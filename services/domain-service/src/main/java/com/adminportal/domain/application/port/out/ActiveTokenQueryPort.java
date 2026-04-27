package com.adminportal.domain.application.port.out;

public interface ActiveTokenQueryPort {
    boolean isActive(String tokenJti);
}
