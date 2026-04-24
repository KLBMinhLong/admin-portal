package com.adminportal.auth.infrastructure.persistence;

import com.adminportal.auth.domain.entity.Token;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface SpringDataTokenRepository extends JpaRepository<Token, UUID> {
    Optional<Token> findByTokenJti(String tokenJti);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Token t where t.userId = :userId and t.active = true")
    List<Token> findActiveByUserIdForUpdate(@Param("userId") UUID userId);

    @Modifying
    @Query("update Token t set t.active = false, t.revokedAt = :revokedAt where t.userId = :userId and t.active = true")
    void revokeAllByUserId(@Param("userId") UUID userId, @Param("revokedAt") Instant revokedAt);
}
