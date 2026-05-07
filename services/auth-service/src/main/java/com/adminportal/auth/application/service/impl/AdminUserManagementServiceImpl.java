package com.adminportal.auth.application.service.impl;

import com.adminportal.auth.application.dto.request.AdminUserCreateRequest;
import com.adminportal.auth.application.dto.request.AdminUserRoleUpdateRequest;
import com.adminportal.auth.application.dto.request.AdminUserUpdateRequest;
import com.adminportal.auth.application.dto.response.AdminUserDto;
import com.adminportal.auth.application.dto.response.AdminUserRoleOptionDto;
import com.adminportal.auth.application.port.out.RoleRepositoryPort;
import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.application.service.AdminUserManagementService;
import com.adminportal.auth.application.service.UsernamePasswordHashService;
import com.adminportal.auth.domain.entity.Role;
import com.adminportal.auth.domain.entity.User;
import com.adminportal.auth.domain.exception.BusinessStateException;
import com.adminportal.auth.domain.exception.InvalidInputException;
import com.adminportal.auth.domain.exception.ResourceConflictException;
import com.adminportal.auth.domain.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@Transactional
@Slf4j
public class AdminUserManagementServiceImpl implements AdminUserManagementService {

    private static final Pattern HAS_UPPERCASE = Pattern.compile(".*[A-Z].*");
    private static final Pattern HAS_LOWERCASE = Pattern.compile(".*[a-z].*");
    private static final Pattern HAS_NUMBER = Pattern.compile(".*\\d.*");
    private static final Pattern HAS_SPECIAL = Pattern.compile(".*[^a-zA-Z0-9].*");

    private final UserRepositoryPort userRepository;
    private final RoleRepositoryPort roleRepository;
    private final UsernamePasswordHashService passwordHashService;

    public AdminUserManagementServiceImpl(UserRepositoryPort userRepository,
                                          RoleRepositoryPort roleRepository,
                                          UsernamePasswordHashService passwordHashService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordHashService = passwordHashService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminUserDto> listUsers() {
        List<AdminUserDto> users = userRepository.findAllWithRoles().stream()
            .map(AdminUserDto::from)
            .toList();
        log.debug("Listed {} users", users.size());
        return users;
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserDto getUser(UUID userId) {
        log.debug("Getting user detail for userId={}", userId);
        return AdminUserDto.from(loadUserWithRoles(userId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminUserRoleOptionDto> listAssignableRoles() {
        return roleRepository.findAll().stream()
            .filter(Role::isActive)
            .sorted(Comparator.comparing(Role::getName, String.CASE_INSENSITIVE_ORDER))
            .map(AdminUserRoleOptionDto::from)
            .toList();
    }

    @Override
    public AdminUserDto createUser(AdminUserCreateRequest request) {
        String username = normalizeUsername(request.username());
        String email = normalizeEmail(request.email());
        String roleCode = normalizeRoleCode(request.roleCode());

        validateUniqueUsername(username, null);
        validateUniqueEmail(email, null);
        validatePasswordPolicy(request.password());

        Role role = loadRole(roleCode);
        User user = User.create(
            username,
            email,
            passwordHashService.encode(username, request.password()),
            toPrimaryRole(role.getCode()),
            normalizeName(request.firstName()),
            normalizeName(request.lastName())
        );
        user.assignRoles(new LinkedHashSet<>(Set.of(role)));
        if (Boolean.FALSE.equals(request.active())) {
            user.setActive(false);
        }

        User savedUser = userRepository.save(user);
        log.info("Created user username={} with role={}", username, roleCode);
        return AdminUserDto.from(savedUser);
    }

    @Override
    public AdminUserDto updateUser(UUID userId, AdminUserUpdateRequest request) {
        User user = loadUserWithRoles(userId);
        String email = normalizeEmail(request.email());

        validateUniqueEmail(email, user.getId());
        user.updateProfile(
            email,
            normalizeName(request.firstName()),
            normalizeName(request.lastName())
        );

        User savedUser = userRepository.save(user);
        log.info("Updated profile for userId={}", userId);
        return AdminUserDto.from(savedUser);
    }

    @Override
    public AdminUserDto updateRole(UUID userId, AdminUserRoleUpdateRequest request) {
        User user = loadUserWithRoles(userId);
        Role role = loadRole(normalizeRoleCode(request.roleCode()));

        user.assignRoles(new LinkedHashSet<>(Set.of(role)));
        user.updateRole(toPrimaryRole(role.getCode()));

        User savedUser = userRepository.save(user);
        log.info("Updated role for userId={} to roleCode={}", userId, role.getCode());
        return AdminUserDto.from(savedUser);
    }

    @Override
    public AdminUserDto toggleActive(UUID userId) {
        User user = loadUserWithRoles(userId);
        user.toggleActive();
        User savedUser = userRepository.save(user);
        log.info("Toggled active for userId={}. Now active={}", userId, savedUser.isActive());
        return AdminUserDto.from(savedUser);
    }

    private User loadUserWithRoles(UUID userId) {
        return userRepository.findByIdWithRolesAndPermissions(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId));
    }

    private Role loadRole(String roleCode) {
        Role role = roleRepository.findByCode(roleCode)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy role: " + roleCode));
        if (!role.isActive()) {
            throw new BusinessStateException("ROLE_DISABLED", "Role đang bị vô hiệu hóa: " + roleCode);
        }
        return role;
    }

    private void validateUniqueUsername(String username, UUID currentUserId) {
        userRepository.findByUsername(username)
            .filter(existing -> currentUserId == null || !existing.getId().equals(currentUserId))
            .ifPresent(existing -> {
                throw new ResourceConflictException("Username đã tồn tại: " + username);
            });
    }

    private void validateUniqueEmail(String email, UUID currentUserId) {
        userRepository.findByEmail(email)
            .filter(existing -> currentUserId == null || !existing.getId().equals(currentUserId))
            .ifPresent(existing -> {
                throw new ResourceConflictException("Email đã tồn tại: " + email);
            });
    }

    private void validatePasswordPolicy(String password) {
        if (password == null || password.length() < 12) {
            throw new InvalidInputException("Mật khẩu phải có ít nhất 12 ký tự");
        }
        if (!HAS_UPPERCASE.matcher(password).matches()) {
            throw new InvalidInputException("Mật khẩu phải chứa ít nhất 1 ký tự in hoa");
        }
        if (!HAS_LOWERCASE.matcher(password).matches()) {
            throw new InvalidInputException("Mật khẩu phải chứa ít nhất 1 ký tự in thường");
        }
        if (!HAS_NUMBER.matcher(password).matches()) {
            throw new InvalidInputException("Mật khẩu phải chứa ít nhất 1 chữ số");
        }
        if (!HAS_SPECIAL.matcher(password).matches()) {
            throw new InvalidInputException("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt");
        }
    }

    private String normalizeUsername(String username) {
        return normalizeRequired(username).toLowerCase(Locale.ROOT);
    }

    private String normalizeEmail(String email) {
        return normalizeRequired(email).toLowerCase(Locale.ROOT);
    }

    private String normalizeRoleCode(String roleCode) {
        String normalized = normalizeRequired(roleCode).toUpperCase(Locale.ROOT);
        return normalized.startsWith("ROLE_") ? normalized.substring(5) : normalized;
    }

    private String normalizeRequired(String value) {
        if (value == null || value.isBlank()) {
            throw new InvalidInputException("Giá trị bắt buộc không được để trống");
        }
        return value.trim();
    }

    private String normalizeName(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String toPrimaryRole(String roleCode) {
        return "ROLE_" + roleCode;
    }
}
