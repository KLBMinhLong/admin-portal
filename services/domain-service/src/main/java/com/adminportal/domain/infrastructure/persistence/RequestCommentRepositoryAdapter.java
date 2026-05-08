package com.adminportal.domain.infrastructure.persistence;

import com.adminportal.domain.application.port.out.RequestCommentPort;
import com.adminportal.domain.domain.entity.RequestComment;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class RequestCommentRepositoryAdapter implements RequestCommentPort {

    private final RequestCommentRepository repo;

    public RequestCommentRepositoryAdapter(RequestCommentRepository repo) {
        this.repo = repo;
    }

    @Override
    public List<RequestComment> findByPurchasingRequestIdOrderByCreatedAtAsc(Long requestId) {
        return repo.findByPurchasingRequestIdOrderByCreatedAtAsc(requestId);
    }

    @Override
    public RequestComment save(RequestComment comment) {
        return repo.save(comment);
    }
}
