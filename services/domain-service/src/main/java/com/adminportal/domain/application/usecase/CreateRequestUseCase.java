package com.adminportal.domain.application.usecase;

import com.adminportal.domain.application.dto.CreateRequestDto;
import com.adminportal.domain.application.dto.PurchasingRequestDto;
import com.adminportal.domain.application.mapper.PurchasingRequestMapper;
import com.adminportal.domain.domain.entity.PurchaseItem;
import com.adminportal.domain.domain.entity.PurchasingRequest;
import com.adminportal.domain.domain.event.RequestCreatedEvent;
import com.adminportal.domain.application.port.out.PurchasingRequestPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.Year;

/**
 * Use case: tạo mới purchasing request ở trạng thái DRAFT.
 * <p>
 * Business rules:
 * - Ít nhất 1 item.
 * - Tổng tiền > 0.
 * - Sinh request number theo format PR-YYYY-XXX.
 * - Publish Kafka event REQUEST_CREATED.
 */
@Service
public class CreateRequestUseCase {

    private static final Logger log = LoggerFactory.getLogger(CreateRequestUseCase.class);
    private static final String KAFKA_TOPIC = "domain.request-created";

    private final PurchasingRequestPort requestRepository;
    private final PurchasingRequestMapper mapper;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public CreateRequestUseCase(PurchasingRequestPort requestRepository,
                                PurchasingRequestMapper mapper,
                                KafkaTemplate<String, Object> kafkaTemplate) {
        this.requestRepository = requestRepository;
        this.mapper = mapper;
        this.kafkaTemplate = kafkaTemplate;
    }

    /**
     * Tạo mới purchasing request.
     *
     * @param dto      validated input DTO
     * @param username username từ JWT (authenticated user)
     * @return created request DTO
     * @throws IllegalArgumentException nếu items trống hoặc total ≤ 0
     */
    @Transactional
    public PurchasingRequestDto execute(CreateRequestDto dto, String username) {
        // 1. Sinh request number PR-YYYY-XXX
        String requestNumber = generateRequestNumber();

        // 2. Tạo aggregate root
        String currency = (dto.currency() != null && !dto.currency().isBlank())
            ? dto.currency() : "VND";

        PurchasingRequest request = PurchasingRequest.create(
            requestNumber,
            dto.title(),
            dto.description(),
            username,
            dto.departmentId(),
            dto.costCenter(),
            currency
        );

        // 3. Thêm items vào aggregate
        dto.items().forEach(itemDto -> {
            PurchaseItem item = PurchaseItem.create(
                itemDto.itemCode(),
                itemDto.itemName(),
                itemDto.quantity(),
                itemDto.unitPrice(),
                itemDto.specification()
            );
            request.addItem(item);
        });

        // 4. Validate tổng tiền > 0
        if (request.getTotalAmount().signum() <= 0) {
            throw new IllegalArgumentException("Total amount must be > 0");
        }

        // 5. Persist
        PurchasingRequest saved = requestRepository.save(request);
        log.info("Created purchasing request number={} by user={}", requestNumber, username);

        // 6. Publish Kafka event
        try {
            RequestCreatedEvent event = new RequestCreatedEvent(
                saved.getId(),
                saved.getRequestNumber(),
                saved.getRequestedBy(),
                saved.getTotalAmount(),
                saved.getCurrency(),
                saved.getStatus().name(),
                Instant.now()
            );
            kafkaTemplate.send(KAFKA_TOPIC, saved.getRequestNumber(), event);
            log.debug("Published REQUEST_CREATED event for number={}", requestNumber);
        } catch (Exception ex) {
            // Kafka failure should not roll back the DB transaction
            log.warn("Failed to publish REQUEST_CREATED event for number={}: {}",
                      requestNumber, ex.getMessage());
        }

        // 7. Map & return
        return mapper.toDto(saved);
    }

    /**
     * Sinh request number format: PR-YYYY-XXX (zero-padded 3 digits).
     */
    private String generateRequestNumber() {
        long seq = requestRepository.nextRequestSequence();
        return String.format("PR-%d-%03d", Year.now().getValue(), seq);
    }
}
