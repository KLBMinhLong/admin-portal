package com.adminportal.domain.infrastructure.web;

import com.adminportal.domain.application.dto.CreateCommentDto;
import com.adminportal.domain.application.dto.RequestCommentDto;
import com.adminportal.domain.application.services.RequestCommentService;
import com.adminportal.domain.infrastructure.web.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/requests/{requestId}/comments")
public class RequestCommentController {

    private final RequestCommentService commentService;

    public RequestCommentController(RequestCommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<java.util.List<RequestCommentDto>>> getComments(@PathVariable Long requestId) {
        java.util.List<RequestCommentDto> list = commentService.getCommentsForRequest(requestId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RequestCommentDto>> addComment(
            @PathVariable Long requestId,
            @Valid @RequestBody CreateCommentDto dto,
            Authentication authentication) {
        
        String username = authentication.getName();
        String role = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("User");
        
        if (role.startsWith("ROLE_")) {
            role = role.substring(5);
        }

        RequestCommentDto response = commentService.addComment(requestId, dto, username, role);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, HttpStatus.CREATED.value()));
    }
}
