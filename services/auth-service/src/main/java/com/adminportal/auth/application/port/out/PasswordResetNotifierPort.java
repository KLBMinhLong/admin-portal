package com.adminportal.auth.application.port.out;

import com.adminportal.auth.domain.entity.User;

public interface PasswordResetNotifierPort {
    void sendResetLink(User user, String rawResetToken);
}
