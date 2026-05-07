package com.adminportal.auth.application.service;

public interface PasswordPolicy {
    void validate(String password);
}
