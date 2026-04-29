package com.adminportal.domain.infrastructure.persistence;

import com.adminportal.domain.domain.entity.RequestComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RequestCommentRepository extends JpaRepository<RequestComment, Long> {
    List<RequestComment> findByPurchasingRequestIdOrderByCreatedAtAsc(Long requestId);
}
