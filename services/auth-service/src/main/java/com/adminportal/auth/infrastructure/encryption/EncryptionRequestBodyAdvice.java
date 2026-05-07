package com.adminportal.auth.infrastructure.encryption;

import com.adminportal.auth.infrastructure.security.Encrypted;
import com.adminportal.auth.infrastructure.security.RsaEncryptionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.servlet.mvc.method.annotation.RequestBodyAdviceAdapter;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;

@ControllerAdvice(annotations = Controller.class)
public class EncryptionRequestBodyAdvice extends RequestBodyAdviceAdapter {

    private final ObjectMapper objectMapper;
    private final AesGcmEncryptionService encryptionService;
    private final RsaEncryptionService rsaEncryptionService;
    private final EncryptionProperties properties;

    public EncryptionRequestBodyAdvice(ObjectMapper objectMapper,
                                       AesGcmEncryptionService encryptionService,
                                       RsaEncryptionService rsaEncryptionService,
                                       EncryptionProperties properties) {
        this.objectMapper = objectMapper;
        this.encryptionService = encryptionService;
        this.rsaEncryptionService = rsaEncryptionService;
        this.properties = properties;
    }

    @Override
    public boolean supports(MethodParameter parameter, Type targetType,
                            Class<? extends HttpMessageConverter<?>> converterType) {
        return properties.isEnabled() && hasEncryptedAnnotation(parameter);
    }

    @Override
    public HttpInputMessage beforeBodyRead(HttpInputMessage inputMessage,
                                           MethodParameter parameter,
                                           Type targetType,
                                           Class<? extends HttpMessageConverter<?>> converterType)
            throws IOException {
        byte[] body = inputMessage.getBody().readAllBytes();
        if (body.length == 0) {
            if (isBodyRequired(parameter)) {
                throw new InvalidEncryptedPayloadException("INVALID_ENCRYPTED_PAYLOAD");
            }
            setEncryptionRequired(inputMessage);
            return inputMessage;
        }

        EncryptedPayload payload;
        try {
            payload = objectMapper.readValue(body, EncryptedPayload.class);
        } catch (Exception exception) {
            throw new InvalidEncryptedPayloadException("INVALID_ENCRYPTED_PAYLOAD", exception);
        }

        if (payload.data() == null || payload.iv() == null || payload.data().isBlank() || payload.iv().isBlank()) {
            throw new InvalidEncryptedPayloadException("INVALID_ENCRYPTED_PAYLOAD");
        }

        String decrypted;
        if (payload.key() != null && !payload.key().isBlank()) {
            // Hybrid Encryption: Giải mã AES key bằng RSA trước
            try {
                byte[] aesKey = rsaEncryptionService.decrypt(payload.key());
                decrypted = encryptionService.decryptHybrid(payload.data(), payload.iv(), aesKey);
            } catch (Exception e) {
                throw new DecryptionFailedException("RSA_DECRYPTION_FAILED", e);
            }
        } else {
            // Static Encryption: Dùng key mặc định
            decrypted = encryptionService.decrypt(payload.data(), payload.iv());
        }
        
        byte[] decryptedBytes = decrypted.getBytes(StandardCharsets.UTF_8);

        HttpHeaders headers = new HttpHeaders();
        headers.putAll(inputMessage.getHeaders());
        headers.setContentLength(decryptedBytes.length);

        setEncryptionRequired(inputMessage);

        return new HttpInputMessage() {
            @Override
            public HttpHeaders getHeaders() {
                return headers;
            }

            @Override
            public ByteArrayInputStream getBody() {
                return new ByteArrayInputStream(decryptedBytes);
            }
        };
    }

    @Override
    public Object handleEmptyBody(Object body, HttpInputMessage inputMessage,
                                  MethodParameter parameter, Type targetType,
                                  Class<? extends HttpMessageConverter<?>> converterType) {
        if (!isBodyRequired(parameter)) {
            return body;
        }
        throw new InvalidEncryptedPayloadException("INVALID_ENCRYPTED_PAYLOAD");
    }

    private boolean hasEncryptedAnnotation(MethodParameter parameter) {
        return parameter.hasMethodAnnotation(Encrypted.class)
            || parameter.getContainingClass().isAnnotationPresent(Encrypted.class);
    }

    private void setEncryptionRequired(HttpInputMessage inputMessage) {
        if (inputMessage instanceof ServletServerHttpRequest servletRequest) {
            servletRequest.getServletRequest().setAttribute(EncryptionAttributes.ENCRYPTION_REQUIRED, Boolean.TRUE);
        }
    }

    private boolean isBodyRequired(MethodParameter parameter) {
        RequestBody requestBody = parameter.getParameterAnnotation(RequestBody.class);
        return requestBody == null || requestBody.required();
    }
}
