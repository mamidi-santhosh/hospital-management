package com.hospital.billinginventory.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "billing_invoices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillingInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long patientId;

    private String patientName;

    private Long appointmentId;

    private BigDecimal consultationFee;

    private BigDecimal medicineCharges;

    private BigDecimal labTestCharges;

    private BigDecimal taxAmount;

    @Column(nullable = false)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvoiceStatus status;

    private String paymentMethod; // Cash, Card, UPI, Insurance

    private LocalDateTime invoiceDate;

    @PrePersist
    protected void onCreate() {
        this.invoiceDate = LocalDateTime.now();
    }
}
