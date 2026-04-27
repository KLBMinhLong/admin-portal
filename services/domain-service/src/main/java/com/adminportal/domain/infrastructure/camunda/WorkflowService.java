package com.adminportal.domain.infrastructure.camunda;

import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class WorkflowService {

    private static final Logger log = LoggerFactory.getLogger(WorkflowService.class);
    private static final String APPROVAL_PROCESS_KEY = "PurchasingRequestApproval";

    private final RuntimeService runtimeService;
    private final org.camunda.bpm.engine.TaskService taskService;

    public WorkflowService(RuntimeService runtimeService, org.camunda.bpm.engine.TaskService taskService) {
        this.runtimeService = runtimeService;
        this.taskService = taskService;
    }

    /**
     * Start Camunda process instance.
     * Rule: Camunda process co business key = requestId (requestNumber)
     */
    public void initiateApprovalWorkflow(String requestNumber, Long requestId, String submittedBy, java.math.BigDecimal totalAmount) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("requestId", requestId);
        variables.put("submittedBy", submittedBy);
        variables.put("totalAmount", totalAmount.doubleValue()); // Truyền số tiền để Camunda check gateway

        ProcessInstance processInstance = runtimeService.startProcessInstanceByKey(
            APPROVAL_PROCESS_KEY,
            requestNumber, // businessKey
            variables
        );

        log.info("Started Camunda process id={} for requestNumber={} with amount={}", 
                 processInstance.getId(), requestNumber, totalAmount);
    }

    /**
     * Helper method cho Camunda Service Task gọi qua Expression: ${workflowService.logInfo('message')}
     */
    public void logInfo(String message) {
        log.info("[Camunda ServiceTask] Notification: {}", message);
    }

    /**
     * Complete the current active user task for the request.
     */
    public void completeTask(String requestNumber, String username, boolean isApproved, String comment) {
        org.camunda.bpm.engine.task.Task task = taskService.createTaskQuery()
                .processInstanceBusinessKey(requestNumber)
                .active()
                .singleResult();

        if (task == null) {
            log.warn("No active Camunda task found for requestNumber={}", requestNumber);
            return;
        }

        Map<String, Object> variables = new HashMap<>();
        variables.put("approved", isApproved);
        variables.put("reviewer", username);
        variables.put("comment", comment);

        taskService.complete(task.getId(), variables);
        log.info("Completed Camunda task id={} for requestNumber={}", task.getId(), requestNumber);
    }
}
