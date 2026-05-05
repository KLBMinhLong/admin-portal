package com.adminportal.domain.domain.repository;

import com.adminportal.domain.domain.entity.PurchasingRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface PurchasingRequestRepository extends JpaRepository<PurchasingRequest, Long> {

    boolean existsByRequestNumber(String requestNumber);

    /**
     * Lấy giá trị tiếp theo của sequence để sinh request number.
     */
    @Query(value = "SELECT nextval('domain.seq_request_number')", nativeQuery = true)
    long nextRequestSequence();

    @Query("SELECT r.status, COUNT(r) FROM PurchasingRequest r GROUP BY r.status")
    java.util.List<Object[]> countRequestsByStatus();

    @Query("SELECT r.status, COUNT(r) FROM PurchasingRequest r WHERE r.requestedBy = :username GROUP BY r.status")
    java.util.List<Object[]> countRequestsByStatusForUser(@org.springframework.data.repository.query.Param("username") String username);

    @Query(value = "SELECT EXTRACT(MONTH FROM requested_date) as month, SUM(total_amount) as total FROM domain.purchasing_requests WHERE EXTRACT(YEAR FROM requested_date) = :year GROUP BY EXTRACT(MONTH FROM requested_date)", nativeQuery = true)
    java.util.List<Object[]> sumTotalAmountByMonthInYear(@org.springframework.data.repository.query.Param("year") int year);

    @Query(value = "SELECT EXTRACT(MONTH FROM requested_date) as month, SUM(total_amount) as total FROM domain.purchasing_requests WHERE EXTRACT(YEAR FROM requested_date) = :year AND requested_by = :username GROUP BY EXTRACT(MONTH FROM requested_date)", nativeQuery = true)
    java.util.List<Object[]> sumTotalAmountByMonthInYearForUser(@org.springframework.data.repository.query.Param("year") int year, @org.springframework.data.repository.query.Param("username") String username);

    @Query("SELECT r FROM PurchasingRequest r WHERE r.status = 'PENDING_APPROVAL' ORDER BY r.totalAmount DESC")
    java.util.List<PurchasingRequest> findTopPendingRequests(org.springframework.data.domain.Pageable pageable);

    @Query("SELECT r FROM PurchasingRequest r WHERE r.status = 'PENDING_APPROVAL' AND r.requestedBy = :username ORDER BY r.totalAmount DESC")
    java.util.List<PurchasingRequest> findTopPendingRequestsForUser(@org.springframework.data.repository.query.Param("username") String username, org.springframework.data.domain.Pageable pageable);
}
