package com.adminportal.domain.application.services;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketNotificationService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void sendRequestUpdate(Long requestId, Object payload) {
        messagingTemplate.convertAndSend("/topic/requests/" + requestId, payload);
    }
    
    public void sendUserNotification(String username, Object payload) {
        // Send to a user-specific topic, can be handled dynamically on frontend
        messagingTemplate.convertAndSend("/topic/users/" + username + "/notifications", payload);
    }
}
