package com.adminportal.auth.infrastructure.external.mail;

import com.adminportal.auth.application.port.out.PasswordResetNotifierPort;
import com.adminportal.auth.domain.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class LoggingPasswordResetNotifier implements PasswordResetNotifierPort {
    private static final Logger log = LoggerFactory.getLogger(LoggingPasswordResetNotifier.class);

    private final String resetPasswordBaseUrl;

    public LoggingPasswordResetNotifier(@Value("${app.reset-password.base-url:http://localhost/reset-password?token=}") String resetPasswordBaseUrl) {
        this.resetPasswordBaseUrl = resetPasswordBaseUrl;
    }

    @Override
    public void sendResetLink(User user, String rawResetToken) {
        log.info("Password reset link generated for userId={} username={} link={}{}",
            user.getId(), user.getUsername(), resetPasswordBaseUrl, rawResetToken);
    }
}
