package com.adminportal.domain.infrastructure.persistence;

import com.adminportal.domain.application.port.out.IdempotencyPort;
import com.adminportal.domain.domain.entity.IdempotencyRecord;
import com.adminportal.domain.domain.repository.IdempotencyRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public class IdempotencyRepositoryAdapter implements IdempotencyPort {

    private final IdempotencyRepository repo;

    public IdempotencyRepositoryAdapter(IdempotencyRepository repo) {
        this.repo = repo;
    }

    @Override
    public Optional<IdempotencyRecord> findByIdempotencyKey(String key) {
        return repo.findByIdempotencyKey(key);
    }

    @Override
    public IdempotencyRecord save(IdempotencyRecord record) {
        return repo.save(record);
    }

    @Override
    public int deleteExpiredBefore(Instant now) {
        return repo.deleteExpiredBefore(now);
    }
}
