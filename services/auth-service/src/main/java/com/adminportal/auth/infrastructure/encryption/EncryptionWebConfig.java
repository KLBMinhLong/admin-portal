package com.adminportal.auth.infrastructure.encryption;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class EncryptionWebConfig implements WebMvcConfigurer {

    private final EncryptionHandlerInterceptor encryptionHandlerInterceptor;

    public EncryptionWebConfig(EncryptionHandlerInterceptor encryptionHandlerInterceptor) {
        this.encryptionHandlerInterceptor = encryptionHandlerInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(encryptionHandlerInterceptor);
    }
}
