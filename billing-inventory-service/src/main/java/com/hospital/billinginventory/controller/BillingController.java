package com.hospital.billinginventory.controller;

import com.hospital.billinginventory.dto.ApiResponse;
import com.hospital.billinginventory.dto.BillingInvoiceDto;
import com.hospital.billinginventory.entity.BillingInvoice;
import com.hospital.billinginventory.entity.InvoiceStatus;
import com.hospital.billinginventory.service.BillingInventoryService;
import com.hospital.billinginventory.service.PdfInvoiceGenerator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayInputStream;
import java.util.List;

@RestController
@RequestMapping("/api/v1/billing")
@RequiredArgsConstructor
@Tag(name = "Billing Controller", description = "Endpoints for billing invoices and PDF export")
public class BillingController {

    private final BillingInventoryService service;
    private final PdfInvoiceGenerator pdfInvoiceGenerator;

    @PostMapping("/invoices")
    @Operation(summary = "Generate a new patient invoice")
    public ResponseEntity<ApiResponse<BillingInvoiceDto>> createInvoice(@RequestBody BillingInvoiceDto dto) {
        return ResponseEntity.ok(ApiResponse.success("Invoice created successfully", service.createInvoice(dto)));
    }

    @PutMapping("/invoices/{id}/status")
    @Operation(summary = "Update invoice payment status")
    public ResponseEntity<ApiResponse<BillingInvoiceDto>> updateStatus(
            @PathVariable("id") Long id,
            @RequestParam("status") InvoiceStatus status,
            @RequestParam(value = "paymentMethod", required = false) String paymentMethod) {
        return ResponseEntity.ok(ApiResponse.success("Invoice status updated successfully", service.updateInvoiceStatus(id, status, paymentMethod)));
    }

    @GetMapping("/invoices/patient/{patientId}")
    @Operation(summary = "Get all invoices for a patient")
    public ResponseEntity<ApiResponse<List<BillingInvoiceDto>>> getPatientInvoices(@PathVariable("patientId") Long patientId) {
        return ResponseEntity.ok(ApiResponse.success("Invoices fetched successfully", service.getPatientInvoices(patientId)));
    }

    @GetMapping("/invoices/{id}/pdf")
    @Operation(summary = "Download official OpenPDF invoice receipt")
    public ResponseEntity<InputStreamResource> downloadInvoicePdf(@PathVariable("id") Long id) {
        BillingInvoice invoice = service.getInvoiceEntity(id);
        ByteArrayInputStream bis = pdfInvoiceGenerator.generateInvoicePdf(invoice);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "inline; filename=invoice_" + id + ".pdf");

        return ResponseEntity
                .ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_PDF)
                .body(new InputStreamResource(bis));
    }
}
