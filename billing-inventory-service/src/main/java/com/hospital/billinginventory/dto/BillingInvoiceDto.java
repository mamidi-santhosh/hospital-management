package com.hospital.billinginventory.dto;

import com.hospital.billinginventory.entity.InvoiceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillingInvoiceDto {
    private Long id;
    private Long patientId;
    private String patientName;
    private Long appointmentId;
    private BigDecimal consultationFee;
    private BigDecimal medicineCharges;
    private BigDecimal labTestCharges;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private InvoiceStatus status;
    private String paymentMethod;
    private LocalDateTime invoiceDate;
}
