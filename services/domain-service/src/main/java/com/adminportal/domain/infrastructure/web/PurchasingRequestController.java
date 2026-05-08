package com.adminportal.domain.infrastructure.web;

import com.adminportal.domain.application.dto.CreateRequestDto;
import com.adminportal.domain.application.dto.PurchasingRequestDto;
import com.adminportal.domain.application.services.CurrentUserService;
import com.adminportal.domain.application.usecase.CreateRequestUseCase;
import com.adminportal.domain.application.usecase.SubmitRequestUseCase;
import com.adminportal.domain.application.usecase.GetRequestUseCase;
import com.adminportal.domain.application.usecase.ListRequestsUseCase;
import com.adminportal.domain.domain.entity.IdempotencyRecord;
import com.adminportal.domain.infrastructure.cache.IdempotencyService;
import com.adminportal.domain.infrastructure.security.Encrypted;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.adminportal.domain.infrastructure.web.ApiResponse;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

/**
 * REST controller cho purchasing requests.
 * Rule 13: POST phải có Idempotency-Key header.
 * Rule 17: path = /api/v1/requests, resource plural, no verb.
 */
@RestController
@Encrypted
@RequestMapping("/api/v1/requests")
public class PurchasingRequestController {

    private static final Logger log = LoggerFactory.getLogger(PurchasingRequestController.class);

    private final CreateRequestUseCase createRequestUseCase;
    private final SubmitRequestUseCase submitRequestUseCase;
    private final GetRequestUseCase getRequestUseCase;
    private final ListRequestsUseCase listRequestsUseCase;
    private final IdempotencyService idempotencyService;
    private final ObjectMapper objectMapper;
    private final CurrentUserService currentUserService;

    public PurchasingRequestController(CreateRequestUseCase createRequestUseCase,
                                       SubmitRequestUseCase submitRequestUseCase,
                                       GetRequestUseCase getRequestUseCase,
                                       ListRequestsUseCase listRequestsUseCase,
                                       IdempotencyService idempotencyService,
                                       ObjectMapper objectMapper,
                                       CurrentUserService currentUserService) {
        this.createRequestUseCase = createRequestUseCase;
        this.submitRequestUseCase = submitRequestUseCase;
        this.getRequestUseCase = getRequestUseCase;
        this.listRequestsUseCase = listRequestsUseCase;
        this.idempotencyService = idempotencyService;
        this.objectMapper = objectMapper;
        this.currentUserService = currentUserService;
    }

    /**
     * Lấy danh sách requests (có filter).
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<java.util.List<PurchasingRequestDto>>> getAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        java.util.List<PurchasingRequestDto> list = listRequestsUseCase.execute(status, search);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * Lấy thông tin chi tiết request.
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PurchasingRequestDto>> getById(@PathVariable Long id) {
        PurchasingRequestDto dto = getRequestUseCase.execute(id);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    /**
     * Tạo mới purchasing request.
     *
     * @param idempotencyKey UUID duy nhất từ client để ngăn duplicate
     * @param dto            dữ liệu request, đã validate bởi @Valid
     * @return 201 Created kèm response body
     */
    @PostMapping
    @PreAuthorize("hasAuthority('request.create')")
    public ResponseEntity<ApiResponse<PurchasingRequestDto>> create(
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody CreateRequestDto dto) {

        // Rule 13: kiểm tra idempotency key trùng → trả kết quả cũ
        Optional<IdempotencyRecord> existing = idempotencyService.findExisting(idempotencyKey);
        if (existing.isPresent()) {
            IdempotencyRecord record = existing.get();
            log.info("Idempotent replay for create key={}", idempotencyKey);
            try {
                ApiResponse<PurchasingRequestDto> previous = objectMapper.readValue(
                    record.getResponseBody(), new TypeReference<ApiResponse<PurchasingRequestDto>>(){});
                return ResponseEntity.status(record.getHttpStatus())
                    .header("Content-Type", "application/json")
                    .body(previous);
            } catch (JsonProcessingException e) {
                log.warn("Failed to parse saved idempotent response", e);
                return ResponseEntity.status(record.getHttpStatus()).build();
            }
        }

        String username = currentUserService.requireUsername();

        PurchasingRequestDto result = createRequestUseCase.execute(dto, username);

        ApiResponse<PurchasingRequestDto> api = ApiResponse.success(result, HttpStatus.CREATED.value());

        try {
            String responseJson = objectMapper.writeValueAsString(api);
            idempotencyService.save(idempotencyKey, responseJson, HttpStatus.CREATED.value());
            return ResponseEntity.status(HttpStatus.CREATED)
                .header("Content-Type", "application/json")
                .body(api);
        } catch (JsonProcessingException ex) {
            log.error("Failed to serialize response", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error(500, "Serialization error"));
        }
    }

    /**
     * Submit request sang quy trình phê duyệt.
     */
    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAuthority('request.submit')")
    public ResponseEntity<ApiResponse<PurchasingRequestDto>> submit(
            @PathVariable Long id,
            @RequestHeader("Idempotency-Key") String idempotencyKey) {

        // Rule 13: check idempotency key
        Optional<IdempotencyRecord> existing = idempotencyService.findExisting(idempotencyKey);
        if (existing.isPresent()) {
            IdempotencyRecord record = existing.get();
            log.info("Idempotent replay for submit key={}", idempotencyKey);
            try {
                ApiResponse<PurchasingRequestDto> previous = objectMapper.readValue(
                    record.getResponseBody(), new TypeReference<ApiResponse<PurchasingRequestDto>>(){});
                return ResponseEntity.status(record.getHttpStatus())
                    .header("Content-Type", "application/json")
                    .body(previous);
            } catch (JsonProcessingException e) {
                log.warn("Failed to parse saved idempotent response", e);
                return ResponseEntity.status(record.getHttpStatus()).build();
            }
        }

        String username = currentUserService.requireUsername();

        PurchasingRequestDto result = submitRequestUseCase.execute(id, username);

        ApiResponse<PurchasingRequestDto> api = ApiResponse.success(result, HttpStatus.OK.value());

        try {
            String responseJson = objectMapper.writeValueAsString(api);
            idempotencyService.save(idempotencyKey, responseJson, HttpStatus.OK.value());
            return ResponseEntity.status(HttpStatus.OK)
                .header("Content-Type", "application/json")
                .body(api);
        } catch (JsonProcessingException ex) {
            log.error("Failed to serialize response", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error(500, "Serialization error"));
        }
    }
}
