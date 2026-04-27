package com.adminportal.domain.infrastructure.web;

import com.adminportal.domain.application.dto.CreateRequestDto;
import com.adminportal.domain.application.dto.PurchasingRequestDto;
import com.adminportal.domain.application.usecase.CreateRequestUseCase;
import com.adminportal.domain.domain.entity.IdempotencyRecord;
import com.adminportal.domain.infrastructure.cache.IdempotencyService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

/**
 * REST controller cho purchasing requests.
 * Rule 13: POST phải có Idempotency-Key header.
 * Rule 17: path = /api/v1/requests, resource plural, no verb.
 */
@RestController
@RequestMapping("/api/v1/requests")
public class PurchasingRequestController {

    private static final Logger log = LoggerFactory.getLogger(PurchasingRequestController.class);

    private final CreateRequestUseCase createRequestUseCase;
    private final IdempotencyService idempotencyService;
    private final ObjectMapper objectMapper;

    public PurchasingRequestController(CreateRequestUseCase createRequestUseCase,
                                       IdempotencyService idempotencyService,
                                       ObjectMapper objectMapper) {
        this.createRequestUseCase = createRequestUseCase;
        this.idempotencyService = idempotencyService;
        this.objectMapper = objectMapper;
    }

    /**
     * Tạo mới purchasing request.
     *
     * @param idempotencyKey UUID duy nhất từ client để ngăn duplicate
     * @param dto            dữ liệu request, đã validate bởi @Valid
     * @return 201 Created kèm response body
     */
    @PostMapping
    public ResponseEntity<String> create(
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody CreateRequestDto dto) {

        // Rule 13: kiểm tra idempotency key trùng → trả kết quả cũ
        Optional<IdempotencyRecord> existing = idempotencyService.findExisting(idempotencyKey);
        if (existing.isPresent()) {
            IdempotencyRecord record = existing.get();
            log.info("Idempotent replay for key={}", idempotencyKey);
            return ResponseEntity.status(record.getHttpStatus())
                .header("Content-Type", "application/json")
                .body(record.getResponseBody());
        }

        // TODO: lấy username từ JWT SecurityContext, tạm hardcode cho local test
        String username = "system";

        PurchasingRequestDto result = createRequestUseCase.execute(dto, username);

        try {
            String responseJson = objectMapper.writeValueAsString(result);
            idempotencyService.save(idempotencyKey, responseJson, HttpStatus.CREATED.value());
            return ResponseEntity.status(HttpStatus.CREATED)
                .header("Content-Type", "application/json")
                .body(responseJson);
        } catch (JsonProcessingException ex) {
            log.error("Failed to serialize response", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
