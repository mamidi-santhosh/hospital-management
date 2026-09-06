package com.hospital.billinginventory.service;

import com.hospital.billinginventory.dto.*;
import com.hospital.billinginventory.entity.*;
import com.hospital.billinginventory.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BillingInventoryService {

    private final StaffRepository staffRepository;
    private final InventoryRepository inventoryRepository;
    private final BillingInvoiceRepository invoiceRepository;
    private final EmailNotificationService emailNotificationService;

    // Staff Operations
    @Transactional
    public StaffDto addOrUpdateStaff(StaffDto dto) {
        Staff staff = (dto.getId() != null)
                ? staffRepository.findById(dto.getId()).orElse(new Staff())
                : new Staff();

        staff.setFullName(dto.getFullName());
        staff.setDesignation(dto.getDesignation());
        staff.setDepartment(dto.getDepartment());
        staff.setEmail(dto.getEmail());
        staff.setPhoneNumber(dto.getPhoneNumber());
        staff.setSalary(dto.getSalary());
        staff.setShift(dto.getShift());
        staff.setActive(dto.isActive());

        Staff saved = staffRepository.save(staff);
        return mapToStaffDto(saved);
    }

    public List<StaffDto> getAllStaff() {
        return staffRepository.findAll().stream().map(this::mapToStaffDto).collect(Collectors.toList());
    }

    // Inventory Operations
    @Transactional
    public InventoryItemDto addOrUpdateInventory(InventoryItemDto dto) {
        InventoryItem item = (dto.getId() != null)
                ? inventoryRepository.findById(dto.getId()).orElse(new InventoryItem())
                : inventoryRepository.findByItemName(dto.getItemName()).orElse(new InventoryItem());

        item.setItemName(dto.getItemName());
        item.setCategory(dto.getCategory());
        item.setQuantity(dto.getQuantity());
        item.setReorderLevel(dto.getReorderLevel());
        item.setUnitPrice(dto.getUnitPrice());
        item.setSupplierName(dto.getSupplierName());

        InventoryItem saved = inventoryRepository.save(item);
        return mapToInventoryDto(saved);
    }

    public List<InventoryItemDto> getAllInventory() {
        return inventoryRepository.findAll().stream().map(this::mapToInventoryDto).collect(Collectors.toList());
    }

    public List<InventoryItemDto> getLowStockAlerts() {
        return inventoryRepository.findLowStockItems().stream().map(this::mapToInventoryDto).collect(Collectors.toList());
    }

    // Billing Invoices
    @Transactional
    public BillingInvoiceDto createInvoice(BillingInvoiceDto dto) {
        BigDecimal consultation = dto.getConsultationFee() != null ? dto.getConsultationFee() : BigDecimal.ZERO;
        BigDecimal medicine = dto.getMedicineCharges() != null ? dto.getMedicineCharges() : BigDecimal.ZERO;
        BigDecimal lab = dto.getLabTestCharges() != null ? dto.getLabTestCharges() : BigDecimal.ZERO;
        BigDecimal tax = dto.getTaxAmount() != null ? dto.getTaxAmount() : BigDecimal.ZERO;

        BigDecimal total = consultation.add(medicine).add(lab).add(tax);

        BillingInvoice invoice = BillingInvoice.builder()
                .patientId(dto.getPatientId())
                .patientName(dto.getPatientName())
                .appointmentId(dto.getAppointmentId())
                .consultationFee(consultation)
                .medicineCharges(medicine)
                .labTestCharges(lab)
                .taxAmount(tax)
                .totalAmount(total)
                .status(InvoiceStatus.UNPAID)
                .paymentMethod(dto.getPaymentMethod())
                .build();

        BillingInvoice saved = invoiceRepository.save(invoice);

        // Send Email Receipt Async
        emailNotificationService.sendEmail(
                "patient@hospital.com",
                "Invoice Issued - #" + saved.getId(),
                "Dear " + saved.getPatientName() + ",\nYour invoice of $" + total + " has been generated.\nStatus: UNPAID."
        );

        return mapToInvoiceDto(saved);
    }

    @Transactional
    public BillingInvoiceDto updateInvoiceStatus(Long id, InvoiceStatus status, String paymentMethod) {
        BillingInvoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found with id: " + id));

        invoice.setStatus(status);
        if (paymentMethod != null) {
            invoice.setPaymentMethod(paymentMethod);
        }

        BillingInvoice saved = invoiceRepository.save(invoice);
        return mapToInvoiceDto(saved);
    }

    public BillingInvoice getInvoiceEntity(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found with id: " + id));
    }

    public List<BillingInvoiceDto> getPatientInvoices(Long patientId) {
        return invoiceRepository.findByPatientIdOrderByInvoiceDateDesc(patientId)
                .stream().map(this::mapToInvoiceDto).collect(Collectors.toList());
    }

    // Mappers
    private StaffDto mapToStaffDto(Staff s) {
        return StaffDto.builder()
                .id(s.getId())
                .fullName(s.getFullName())
                .designation(s.getDesignation())
                .department(s.getDepartment())
                .email(s.getEmail())
                .phoneNumber(s.getPhoneNumber())
                .salary(s.getSalary())
                .shift(s.getShift())
                .active(s.isActive())
                .build();
    }

    private InventoryItemDto mapToInventoryDto(InventoryItem i) {
        return InventoryItemDto.builder()
                .id(i.getId())
                .itemName(i.getItemName())
                .category(i.getCategory())
                .quantity(i.getQuantity())
                .reorderLevel(i.getReorderLevel())
                .unitPrice(i.getUnitPrice())
                .supplierName(i.getSupplierName())
                .updatedAt(i.getUpdatedAt())
                .build();
    }

    private BillingInvoiceDto mapToInvoiceDto(BillingInvoice inv) {
        return BillingInvoiceDto.builder()
                .id(inv.getId())
                .patientId(inv.getPatientId())
                .patientName(inv.getPatientName())
                .appointmentId(inv.getAppointmentId())
                .consultationFee(inv.getConsultationFee())
                .medicineCharges(inv.getMedicineCharges())
                .labTestCharges(inv.getLabTestCharges())
                .taxAmount(inv.getTaxAmount())
                .totalAmount(inv.getTotalAmount())
                .status(inv.getStatus())
                .paymentMethod(inv.getPaymentMethod())
                .invoiceDate(inv.getInvoiceDate())
                .build();
    }
}
