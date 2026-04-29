package com.adminportal.domain.infrastructure.encryption;

import com.adminportal.domain.infrastructure.security.Encrypted;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

@ControllerAdvice(annotations = Controller.class)
public class EncryptionResponseBodyAdvice implements ResponseBodyAdvice<Object> {

    private final ObjectMapper objectMapper;
    private final AesGcmEncryptionService encryptionService;
    private final EncryptionProperties properties;

    public EncryptionResponseBodyAdvice(ObjectMapper objectMapper,
                                        AesGcmEncryptionService encryptionService,
                                        EncryptionProperties properties) {
        this.objectMapper = objectMapper;
        this.encryptionService = encryptionService;
        this.properties = properties;
    }

    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        if (!properties.isEnabled()) {
            return false;
        }
        return hasEncryptedAnnotation(returnType) || isEncryptionRequired();
    }

    @Override
    public Object beforeBodyWrite(Object body, MethodParameter returnType, MediaType selectedContentType,
                                  Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                  org.springframework.http.server.ServerHttpRequest request,
                                  org.springframework.http.server.ServerHttpResponse response) {
        if (body instanceof EncryptedPayload) {
            return body;
        }

        String json = body == null ? "{}" : toJson(body);
        return encryptionService.encrypt(json);
    }

    private boolean hasEncryptedAnnotation(MethodParameter returnType) {
        return returnType.hasMethodAnnotation(Encrypted.class)
            || returnType.getContainingClass().isAnnotationPresent(Encrypted.class);
    }

    private boolean isEncryptionRequired() {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes)) {
            return false;
        }
        Object flag = attributes.getRequest().getAttribute(EncryptionAttributes.ENCRYPTION_REQUIRED);
        return Boolean.TRUE.equals(flag);
    }

    private String toJson(Object body) {
        if (body instanceof String text) {
            return text;
        }
        try {
            return objectMapper.writeValueAsString(body);
        } catch (JsonProcessingException exception) {
            throw new EncryptionConfigException("ENCRYPTION_CONFIG_ERROR", exception);
        }
    }
}
