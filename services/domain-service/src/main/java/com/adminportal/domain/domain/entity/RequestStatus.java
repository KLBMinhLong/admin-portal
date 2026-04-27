package com.adminportal.domain.domain.entity;

/**
 * Trạng thái vòng đời của một yêu cầu mua sắm.
 */
public enum RequestStatus {
    DRAFT,
    SUBMITTED,
    PENDING_APPROVAL,
    APPROVED,
    REJECTED,
    CANCELLED
}
