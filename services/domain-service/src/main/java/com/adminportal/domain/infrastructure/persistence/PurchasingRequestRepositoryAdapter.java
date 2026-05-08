package com.adminportal.domain.infrastructure.persistence;

import com.adminportal.domain.application.port.out.PurchasingRequestPort;
import com.adminportal.domain.domain.entity.PurchasingRequest;
import com.adminportal.domain.domain.repository.PurchasingRequestRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class PurchasingRequestRepositoryAdapter implements PurchasingRequestPort {

    private final PurchasingRequestRepository repo;

    public PurchasingRequestRepositoryAdapter(PurchasingRequestRepository repo) {
        this.repo = repo;
    }

    @Override
    public Optional<PurchasingRequest> findById(Long id) {
        return repo.findById(id);
    }

    @Override
    public PurchasingRequest save(PurchasingRequest request) {
        return repo.save(request);
    }

    @Override
    public boolean existsByRequestNumber(String requestNumber) {
        return repo.existsByRequestNumber(requestNumber);
    }

    @Override
    public long nextRequestSequence() {
        return repo.nextRequestSequence();
    }

    @Override
    public List<Object[]> countRequestsByStatus() {
        return repo.countRequestsByStatus();
    }

    @Override
    public List<Object[]> countRequestsByStatusForUser(String username) {
        return repo.countRequestsByStatusForUser(username);
    }

    @Override
    public List<Object[]> sumTotalAmountByMonthInYear(int year) {
        return repo.sumTotalAmountByMonthInYear(year);
    }

    @Override
    public List<Object[]> sumTotalAmountByMonthInYearForUser(int year, String username) {
        return repo.sumTotalAmountByMonthInYearForUser(year, username);
    }

    @Override
    public List<PurchasingRequest> findTopPendingRequests(Pageable pageable) {
        return repo.findTopPendingRequests(pageable);
    }

    @Override
    public List<PurchasingRequest> findTopPendingRequestsForUser(String username, Pageable pageable) {
        return repo.findTopPendingRequestsForUser(username, pageable);
    }

    @Override
    public List<PurchasingRequest> findAll() {
        return repo.findAll();
    }
}
