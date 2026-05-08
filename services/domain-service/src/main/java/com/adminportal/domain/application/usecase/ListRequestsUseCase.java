package com.adminportal.domain.application.usecase;

import com.adminportal.domain.application.dto.PurchasingRequestDto;
import com.adminportal.domain.application.mapper.PurchasingRequestMapper;
import com.adminportal.domain.application.port.out.PurchasingRequestPort;
import com.adminportal.domain.domain.entity.PurchasingRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ListRequestsUseCase {

    private final PurchasingRequestPort requestRepository;
    private final PurchasingRequestMapper mapper;

    public ListRequestsUseCase(PurchasingRequestPort requestRepository, PurchasingRequestMapper mapper) {
        this.requestRepository = requestRepository;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<PurchasingRequestDto> execute(String status, String search) {
        // For now, let's use a simple findAll and filter in memory if status/search provided,
        // or better, update the port to support it. 
        // To keep it simple and fix the immediate 500, I'll use the existing port methods if possible.
        
        List<PurchasingRequest> requests = requestRepository.findAll();
        
        return requests.stream()
                .filter(r -> status == null || status.isBlank() || r.getStatus().name().equalsIgnoreCase(status))
                .filter(r -> search == null || search.isBlank() || 
                             r.getRequestNumber().contains(search) || 
                             (r.getRequestedBy() != null && r.getRequestedBy().contains(search)))
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }
}
