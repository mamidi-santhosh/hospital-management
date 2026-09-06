package com.hospital.billinginventory.repository;

import com.hospital.billinginventory.entity.BillingInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BillingInvoiceRepository extends JpaRepository<BillingInvoice, Long> {
    List<BillingInvoice> findByPatientIdOrderByInvoiceDateDesc(Long patientId);
}
