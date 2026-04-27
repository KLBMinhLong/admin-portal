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
    @Query(value = "SELECT nextval('seq_request_number')", nativeQuery = true)
    long nextRequestSequence();
}
