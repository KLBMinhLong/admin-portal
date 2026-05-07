package com.adminportal.auth.domain.exception;

public class ResourceNotFoundException extends BaseBusinessException {
    public ResourceNotFoundException(String message) {
        super("RESOURCE_NOT_FOUND", message);
    }
}
