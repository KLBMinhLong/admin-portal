package com.adminportal.domain.infrastructure.web;

import com.adminportal.domain.application.dto.ApprovalActionDto;
import com.adminportal.domain.application.dto.PurchasingRequestDto;
import com.adminportal.domain.application.services.CurrentUserService;
import com.adminportal.domain.application.usecase.ProcessApprovalUseCase;
import com.adminportal.domain.domain.entity.IdempotencyRecord;
import com.adminportal.domain.infrastructure.cache.IdempotencyService;
import com.adminportal.domain.infrastructure.security.Encrypted;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@Encrypted
@RequestMapping("/api/v1/approvals")
public class ApprovalController {

    private static final Logger log = LoggerFactory.getLogger(ApprovalController.class);

    private final ProcessApprovalUseCase processApprovalUseCase;
    private final IdempotencyService idempotencyService;
    private final ObjectMapper objectMapper;
    private final CurrentUserService currentUserService;

    public ApprovalController(ProcessApprovalUseCase processApprovalUseCase,
                              IdempotencyService idempotencyService,
                              ObjectMapper objectMapper,
                              CurrentUserService currentUserService) {
        this.processApprovalUseCase = processApprovalUseCase;
        this.idempotencyService = idempotencyService;
        this.objectMapper = objectMapper;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/{requestId}/approve")
    @PreAuthorize("hasAuthority('request.approve')")
    public ResponseEntity<ApiResponse<PurchasingRequestDto>> approve(
            @PathVariable Long requestId,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody(required = false) ApprovalActionDto dto) {
        
        return processAction(requestId, idempotencyKey, true, dto);
    }

    @PostMapping("/{requestId}/reject")
    @PreAuthorize("hasAuthority('request.reject')")
    public ResponseEntity<ApiResponse<PurchasingRequestDto>> reject(
            @PathVariable Long requestId,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody ApprovalActionDto dto) {
        
        return processAction(requestId, idempotencyKey, false, dto);
    }

    private ResponseEntity<ApiResponse<PurchasingRequestDto>> processAction(Long requestId, String idempotencyKey, boolean isApproved, ApprovalActionDto dto) {
        // Idempotency check
        Optional<IdempotencyRecord> existing = idempotencyService.findExisting(idempotencyKey);
        if (existing.isPresent()) {
            IdempotencyRecord record = existing.get();
            log.info("Idempotent replay for approval key={}", idempotencyKey);
            try {
                ApiResponse<PurchasingRequestDto> previous = objectMapper.readValue(
                    record.getResponseBody(), new TypeReference<ApiResponse<PurchasingRequestDto>>() {}
                );
                return ResponseEntity.status(record.getHttpStatus())
                    .header("Content-Type", "application/json")
                    .body(previous);
            } catch (JsonProcessingException ex) {
                log.warn("Failed to parse saved idempotent approval response", ex);
                return ResponseEntity.status(record.getHttpStatus()).build();
            }
        }

        String username = currentUserService.requireUsername();

        PurchasingRequestDto result = processApprovalUseCase.execute(requestId, username, isApproved, dto);
        ApiResponse<PurchasingRequestDto> api = ApiResponse.success(result, HttpStatus.OK.value());

        try {
            String responseJson = objectMapper.writeValueAsString(api);
            idempotencyService.save(idempotencyKey, responseJson, HttpStatus.OK.value());
            return ResponseEntity.status(HttpStatus.OK)
                .header("Content-Type", "application/json")
                .body(api);
        } catch (JsonProcessingException ex) {
            log.error("Failed to serialize response", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Serialization error"));
        }
    }
}
