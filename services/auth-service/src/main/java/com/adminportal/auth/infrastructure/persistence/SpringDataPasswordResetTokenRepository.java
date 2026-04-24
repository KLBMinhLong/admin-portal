package com.adminportal.auth.infrastructure.persistence;

import com.adminportal.auth.domain.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface SpringDataPasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {
    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    @Query("select prt from PasswordResetToken prt where prt.userId = :userId and prt.usedAt is null")
    List<PasswordResetToken> findActiveByUserId(UUID userId);
}
