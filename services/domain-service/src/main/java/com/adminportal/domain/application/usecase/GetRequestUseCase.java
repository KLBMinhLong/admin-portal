package com.adminportal.domain.application.usecase;

import com.adminportal.domain.application.dto.PurchasingRequestDto;
import com.adminportal.domain.application.mapper.PurchasingRequestMapper;
import com.adminportal.domain.domain.repository.PurchasingRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GetRequestUseCase {

    private final PurchasingRequestRepository requestRepository;
    private final PurchasingRequestMapper mapper;

    public GetRequestUseCase(PurchasingRequestRepository requestRepository, PurchasingRequestMapper mapper) {
        this.requestRepository = requestRepository;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public PurchasingRequestDto execute(Long id) {
        return requestRepository.findById(id)
                .map(mapper::toDto)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + id));
    }
}
