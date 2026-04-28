package com.adminportal.auth.infrastructure.encryption;

import com.adminportal.auth.infrastructure.security.Encrypted;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class EncryptionHandlerInterceptor implements HandlerInterceptor {

    private final EncryptionProperties properties;

    public EncryptionHandlerInterceptor(EncryptionProperties properties) {
        this.properties = properties;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!properties.isEnabled()) {
            return true;
        }
        if (handler instanceof HandlerMethod method) {
            if (hasEncryptedAnnotation(method)) {
                request.setAttribute(EncryptionAttributes.ENCRYPTION_REQUIRED, Boolean.TRUE);
            }
        }
        return true;
    }

    private boolean hasEncryptedAnnotation(HandlerMethod method) {
        return method.hasMethodAnnotation(Encrypted.class)
            || method.getBeanType().isAnnotationPresent(Encrypted.class);
    }
}
