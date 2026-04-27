package com.adminportal.domain.application.usecase;

import com.adminportal.domain.application.dto.PurchasingRequestDto;
import com.adminportal.domain.application.mapper.PurchasingRequestMapper;
import com.adminportal.domain.domain.entity.PurchasingRequest;
import com.adminportal.domain.domain.exception.ResourceNotFoundException;
import com.adminportal.domain.domain.event.RequestSubmittedEvent;
import com.adminportal.domain.domain.repository.PurchasingRequestRepository;
import com.adminportal.domain.infrastructure.camunda.WorkflowService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class SubmitRequestUseCase {

    private static final Logger log = LoggerFactory.getLogger(SubmitRequestUseCase.class);
    private static final String KAFKA_TOPIC = "domain.request-submitted";

    private final PurchasingRequestRepository requestRepository;
    private final PurchasingRequestMapper mapper;
    private final WorkflowService workflowService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public SubmitRequestUseCase(PurchasingRequestRepository requestRepository,
                                PurchasingRequestMapper mapper,
                                WorkflowService workflowService,
                                KafkaTemplate<String, Object> kafkaTemplate) {
        this.requestRepository = requestRepository;
        this.mapper = mapper;
        this.workflowService = workflowService;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Transactional
    public PurchasingRequestDto execute(Long requestId, String username) {
        // 1. Fetch request
        PurchasingRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new ResourceNotFoundException("Request not found: " + requestId));

        // 2. State validation & status change
        // UC-REQ-02 flow: DRAFT -> PENDING_APPROVAL and add steps
        request.submit();

        // 3. Persist
        PurchasingRequest saved = requestRepository.save(request);

        // 4. Start workflow
        try {
            workflowService.initiateApprovalWorkflow(
                saved.getRequestNumber(), saved.getId(), username, saved.getTotalAmount()
            );
        } catch (Exception ex) {
            log.error("Failed to start Camunda workflow for request {}", saved.getRequestNumber(), ex);
            throw new RuntimeException("WORKFLOW_START_FAILED", ex);
        }

        // 5. Publish Event
        try {
            RequestSubmittedEvent event = new RequestSubmittedEvent(
                saved.getId(),
                saved.getRequestNumber(),
                username,
                saved.getStatus().name(),
                Instant.now()
            );
            kafkaTemplate.send(KAFKA_TOPIC, saved.getRequestNumber(), event);
        } catch (Exception ex) {
            log.warn("Failed to publish REQUEST_SUBMITTED event", ex);
        }

        return mapper.toDto(saved);
    }
}
