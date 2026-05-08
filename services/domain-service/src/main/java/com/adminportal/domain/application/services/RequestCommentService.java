package com.adminportal.domain.application.services;

import com.adminportal.domain.application.dto.CreateCommentDto;
import com.adminportal.domain.application.dto.RequestCommentDto;
import com.adminportal.domain.domain.entity.PurchasingRequest;
import com.adminportal.domain.domain.entity.RequestComment;
import com.adminportal.domain.application.port.out.PurchasingRequestPort;
import com.adminportal.domain.infrastructure.persistence.RequestCommentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RequestCommentService {

    private final com.adminportal.domain.application.port.out.RequestCommentPort commentRepository;
    private final PurchasingRequestPort requestRepository;
    private final WebSocketNotificationService webSocketNotificationService;

    public RequestCommentService(com.adminportal.domain.application.port.out.RequestCommentPort commentRepository, 
                                 PurchasingRequestPort requestRepository,
                                 WebSocketNotificationService webSocketNotificationService) {
        this.commentRepository = commentRepository;
        this.requestRepository = requestRepository;
        this.webSocketNotificationService = webSocketNotificationService;
    }

    @Transactional(readOnly = true)
    public List<RequestCommentDto> getCommentsForRequest(Long requestId) {
        return commentRepository.findByPurchasingRequestIdOrderByCreatedAtAsc(requestId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public RequestCommentDto addComment(Long requestId, CreateCommentDto dto, String username, String role) {
        PurchasingRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        RequestComment comment = new RequestComment();
        comment.setPurchasingRequest(request);
        comment.setAuthorUsername(username);
        comment.setAuthorRole(role != null ? role : "User");
        comment.setContent(dto.getContent());
        comment.setIsSystem(false);

        comment = commentRepository.save(comment);
        
        RequestCommentDto commentDto = mapToDto(comment);
        
        // Push notification via WebSocket
        webSocketNotificationService.sendRequestUpdate(requestId, commentDto);
        
        return commentDto;
    }
    
    @Transactional
    public void addSystemComment(PurchasingRequest request, String content) {
        RequestComment comment = new RequestComment();
        comment.setPurchasingRequest(request);
        comment.setAuthorUsername("System");
        comment.setAuthorRole("System");
        comment.setContent(content);
        comment.setIsSystem(true);

        comment = commentRepository.save(comment);
        webSocketNotificationService.sendRequestUpdate(request.getId(), mapToDto(comment));
    }

    private RequestCommentDto mapToDto(RequestComment entity) {
        RequestCommentDto dto = new RequestCommentDto();
        dto.setId(entity.getId());
        dto.setAuthorName(entity.getAuthorUsername());
        dto.setAuthorRole(entity.getAuthorRole());
        dto.setContent(entity.getContent());
        dto.setIsSystem(entity.getIsSystem());
        dto.setTimestamp(entity.getCreatedAt());
        return dto;
    }
}
