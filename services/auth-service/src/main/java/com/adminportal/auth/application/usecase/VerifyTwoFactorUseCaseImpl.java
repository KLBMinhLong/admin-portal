package com.adminportal.auth.application.usecase;

import com.adminportal.auth.application.dto.request.TwoFactorVerifyRequest;
import com.adminportal.auth.application.dto.response.LoginResponse;
import com.adminportal.auth.application.port.in.VerifyTwoFactorUseCase;
import com.adminportal.auth.application.port.out.ChallengeStorePort;
import com.adminportal.auth.application.port.out.TwoFactorChallenge;
import com.adminportal.auth.application.port.out.TwoFactorVerifierPort;
import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.application.service.AuthenticatedSessionService;
import com.adminportal.auth.domain.entity.User;
import com.adminportal.auth.domain.exception.BusinessStateException;
import com.adminportal.auth.domain.exception.InvalidInputException;
import com.adminportal.auth.domain.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VerifyTwoFactorUseCaseImpl implements VerifyTwoFactorUseCase {
    private static final Logger log = LoggerFactory.getLogger(VerifyTwoFactorUseCaseImpl.class);

    private final ChallengeStorePort challengeStore;
    private final UserRepositoryPort userRepository;
    private final TwoFactorVerifierPort twoFactorVerifier;
    private final AuthenticatedSessionService authenticatedSessionService;

    public VerifyTwoFactorUseCaseImpl(ChallengeStorePort challengeStore,
                                      UserRepositoryPort userRepository,
                                      TwoFactorVerifierPort twoFactorVerifier,
                                      AuthenticatedSessionService authenticatedSessionService) {
        this.challengeStore = challengeStore;
        this.userRepository = userRepository;
        this.twoFactorVerifier = twoFactorVerifier;
        this.authenticatedSessionService = authenticatedSessionService;
    }

    @Override
    @Transactional
    public LoginResponse execute(TwoFactorVerifyRequest request) {
        TwoFactorChallenge challenge = challengeStore.find(request.challenge())
            .orElseThrow(() -> new BusinessStateException("TWO_FACTOR_EXPIRED", "2FA challenge expired"));

        User user = userRepository.findById(challenge.userId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + challenge.userId()));

        if (!user.isTwoFactorEnabled() || user.getTwoFactorSecret() == null || user.getTwoFactorSecret().isBlank()) {
            throw new BusinessStateException("TWO_FACTOR_STATE_CHANGED", "2FA state changed");
        }

        if (!twoFactorVerifier.verifyOtp(user.getTwoFactorSecret(), request.otp())) {
            log.warn("2FA verification failed for userId={}", user.getId());
            throw new InvalidInputException("Invalid 2FA OTP");
        }

        challengeStore.delete(request.challenge());
        log.info("2FA verification succeeded for userId={}", user.getId());

        return authenticatedSessionService.create(user, challenge.deviceInfo());
    }
}
