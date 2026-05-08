package com.adminportal.domain.application.port.out;

import com.adminportal.domain.domain.entity.RequestComment;

import java.util.List;

public interface RequestCommentPort {
    List<RequestComment> findByPurchasingRequestIdOrderByCreatedAtAsc(Long requestId);
    RequestComment save(RequestComment comment);
}
