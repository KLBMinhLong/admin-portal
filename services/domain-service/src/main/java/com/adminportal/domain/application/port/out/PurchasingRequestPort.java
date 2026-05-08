package com.adminportal.domain.application.port.out;

import com.adminportal.domain.domain.entity.PurchasingRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface PurchasingRequestPort {
    Optional<PurchasingRequest> findById(Long id);
    PurchasingRequest save(PurchasingRequest request);
    boolean existsByRequestNumber(String requestNumber);
    long nextRequestSequence();
    List<Object[]> countRequestsByStatus();
    List<Object[]> countRequestsByStatusForUser(String username);
    List<Object[]> sumTotalAmountByMonthInYear(int year);
    List<Object[]> sumTotalAmountByMonthInYearForUser(int year, String username);
    List<PurchasingRequest> findTopPendingRequests(Pageable pageable);
    List<PurchasingRequest> findTopPendingRequestsForUser(String username, Pageable pageable);
    List<PurchasingRequest> findAll();
}
