package com.adminportal.auth.application.service.impl;

import com.adminportal.auth.application.service.PasswordPolicy;
import com.adminportal.auth.domain.exception.InvalidInputException;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Component
public class PasswordPolicyImpl implements PasswordPolicy {
    private static final Pattern HAS_UPPERCASE = Pattern.compile(".*[A-Z].*");
    private static final Pattern HAS_LOWERCASE = Pattern.compile(".*[a-z].*");
    private static final Pattern HAS_NUMBER = Pattern.compile(".*\\d.*");
    private static final Pattern HAS_SPECIAL = Pattern.compile(".*[^a-zA-Z0-9].*");

    @Override
    public void validate(String password) {
        if (password == null || password.length() < 12) {
            throw new InvalidInputException("Mật khẩu phải có ít nhất 12 ký tự");
        }
        if (!HAS_UPPERCASE.matcher(password).matches()) {
            throw new InvalidInputException("Mật khẩu phải chứa ít nhất 1 ký tự in hoa");
        }
        if (!HAS_LOWERCASE.matcher(password).matches()) {
            throw new InvalidInputException("Mật khẩu phải chứa ít nhất 1 ký tự in thường");
        }
        if (!HAS_NUMBER.matcher(password).matches()) {
            throw new InvalidInputException("Mật khẩu phải chứa ít nhất 1 chữ số");
        }
        if (!HAS_SPECIAL.matcher(password).matches()) {
            throw new InvalidInputException("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt");
        }
    }
}
