package com.adminportal.auth.application.dto.response;

import java.util.List;

public record SessionResponse(
    String username,
    List<String> authorities
) {
}
