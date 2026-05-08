package com.adminportal.domain.application.usecase;

import com.adminportal.domain.application.dto.ApprovalActionDto;
import com.adminportal.domain.application.dto.PurchasingRequestDto;
import com.adminportal.domain.application.mapper.PurchasingRequestMapper;
import com.adminportal.domain.application.port.out.UserAccessQueryPort;
import com.adminportal.domain.application.services.RequestCommentService;
import com.adminportal.domain.application.services.RuntimeAuthorizationService;
import com.adminportal.domain.application.services.WebSocketNotificationService;
import com.adminportal.domain.domain.entity.PurchaseItem;
import com.adminportal.domain.domain.entity.PurchasingRequest;
import com.adminportal.domain.domain.repository.PurchasingRequestRepository;
import com.adminportal.domain.infrastructure.camunda.WorkflowService;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.TaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProcessApprovalUseCaseTest {

    @Mock
    private com.adminportal.domain.application.port.out.PurchasingRequestPort requestRepository;

    @Mock
    private PurchasingRequestMapper mapper;

    @Mock
    private RuntimeService runtimeService;

    @Mock
    private TaskService taskService;

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Mock
    private RequestCommentService commentService;

    @Mock
    private WebSocketNotificationService wsService;

    private ProcessApprovalUseCase useCase;
    private WorkflowService workflowService;
    private RuntimeAuthorizationService runtimeAuthorizationService;

    @BeforeEach
    void setUp() {
        UserAccessQueryPort userAccessQueryPort = username -> Optional.of(
            new UserAccessQueryPort.UserAccessView("u1", username, Set.of("DEPARTMENT_LEAD"), Set.of("request.approve"))
        );
        runtimeAuthorizationService = new RuntimeAuthorizationService(userAccessQueryPort);
        workflowService = new WorkflowService(runtimeService, taskService) {
            @Override
            public void completeTask(String requestNumber, String username, boolean isApproved, String comment) {
                // no-op for unit test
            }
        };
        useCase = new ProcessApprovalUseCase(
            requestRepository,
            mapper,
            workflowService,
            kafkaTemplate,
            runtimeAuthorizationService,
            commentService,
            wsService
        );
    }

    @Test
    void shouldValidateCurrentApproverRoleBeforeApproving() {
        PurchasingRequest request = PurchasingRequest.create(
            "PR-2026-001",
            "Mua laptop",
            "Cap bo laptop moi",
            "requester",
            1L,
            "CC-01",
            "VND"
        );
        request.addItem(PurchaseItem.create("IT-01", "Laptop", 1, new BigDecimal("70000000"), "Core i7"));
        request.submit();

        when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
        when(requestRepository.save(any(PurchasingRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(mapper.toDto(any(PurchasingRequest.class))).thenReturn(new PurchasingRequestDto(
            1L, "PR-2026-001", "Mua laptop", "Cap bo laptop moi", "requester", null,
            "PENDING_APPROVAL", BigDecimal.valueOf(70000000), "VND", 1L, "CC-01", null, null, null, "requester"
        ));

        PurchasingRequestDto response = useCase.execute(
            1L,
            "dept.lead",
            true,
            new ApprovalActionDto("approved")
        );

        assertEquals("PENDING_APPROVAL", response.status());
    }
}
