package com.adminportal.domain.application.usecase;

import com.adminportal.domain.application.dto.ApprovalActionDto;
import com.adminportal.domain.application.dto.PurchasingRequestDto;
import com.adminportal.domain.application.mapper.PurchasingRequestMapper;
import com.adminportal.domain.domain.entity.PurchasingRequest;
import com.adminportal.domain.domain.event.RequestProcessedEvent;
import com.adminportal.domain.domain.repository.PurchasingRequestRepository;
import com.adminportal.domain.infrastructure.camunda.WorkflowService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class ProcessApprovalUseCase {

    private static final Logger log = LoggerFactory.getLogger(ProcessApprovalUseCase.class);
    private static final String KAFKA_TOPIC = "domain.request-processed";

    private final PurchasingRequestRepository requestRepository;
    private final PurchasingRequestMapper mapper;
    private final WorkflowService workflowService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public ProcessApprovalUseCase(PurchasingRequestRepository requestRepository,
                                  PurchasingRequestMapper mapper,
                                  WorkflowService workflowService,
                                  KafkaTemplate<String, Object> kafkaTemplate) {
        this.requestRepository = requestRepository;
        this.mapper = mapper;
        this.workflowService = workflowService;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Transactional
    public PurchasingRequestDto execute(Long requestId, String username, boolean isApproved, ApprovalActionDto dto) {
        // 1. Fetch request with optimistic lock implicitly via JPA @Version
        PurchasingRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        String comment = dto != null ? dto.comment() : null;

        // 2. Process Approval logic (transitions state and steps)
        request.processApproval(username, comment, isApproved);

        // 3. Persist
        PurchasingRequest saved = requestRepository.save(request);

        // 4. Update Camunda Workflow
        try {
            workflowService.completeTask(saved.getRequestNumber(), username, isApproved, comment);
        } catch (Exception ex) {
            log.error("Failed to update Camunda workflow for request {}", saved.getRequestNumber(), ex);
            // Non-critical, or throw if you want Camunda failure to roll back DB
        }

        // 5. Publish Event
        try {
            RequestProcessedEvent event = new RequestProcessedEvent(
                saved.getId(),
                saved.getRequestNumber(),
                username,
                isApproved ? "APPROVE" : "REJECT",
                comment,
                saved.getStatus().name(),
                Instant.now()
            );
            kafkaTemplate.send(KAFKA_TOPIC, saved.getRequestNumber(), event);
        } catch (Exception ex) {
            log.warn("Failed to publish REQUEST_PROCESSED event", ex);
        }

        return mapper.toDto(saved);
    }
}
