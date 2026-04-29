package com.adminportal.domain.application.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateCommentDto {
    @NotBlank(message = "Comment content is required")
    private String content;
    
    public CreateCommentDto() {}
    
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
