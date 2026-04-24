package com.adminportal.auth.application.port.out;

import com.adminportal.auth.domain.entity.User;

public interface TokenGeneratorPort {
    GeneratedToken generate(User user);
}
