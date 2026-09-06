package com.hospital.patientdoctor.controller;

import com.hospital.patientdoctor.dto.ApiResponse;
import com.hospital.patientdoctor.dto.PrescriptionDto;
import com.hospital.patientdoctor.entity.Prescription;
import com.hospital.patientdoctor.service.PatientDoctorService;
import com.hospital.patientdoctor.service.PdfGeneratorService;
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
@RequestMapping("/api/v1/prescriptions")
@RequiredArgsConstructor
@Tag(name = "Prescription Controller", description = "Endpoints for creating prescriptions and exporting OpenPDF documents")
public class PrescriptionController {

    private final PatientDoctorService service;
    private final PdfGeneratorService pdfGeneratorService;

    @PostMapping
    @Operation(summary = "Write a new prescription for a patient")
    public ResponseEntity<ApiResponse<PrescriptionDto>> createPrescription(@RequestBody PrescriptionDto dto) {
        PrescriptionDto created = service.createPrescription(dto);
        return ResponseEntity.ok(ApiResponse.success("Prescription created successfully", created));
    }

    @GetMapping("/patient/{patientId}")
    @Operation(summary = "Get all prescriptions for a patient")
    public ResponseEntity<ApiResponse<List<PrescriptionDto>>> getPatientPrescriptions(@PathVariable("patientId") Long patientId) {
        return ResponseEntity.ok(ApiResponse.success("Prescriptions list fetched successfully", service.getPatientPrescriptions(patientId)));
    }

    @GetMapping("/{id}/pdf")
    @Operation(summary = "Download official PDF prescription document")
    public ResponseEntity<InputStreamResource> downloadPrescriptionPdf(@PathVariable("id") Long id) {
        Prescription prescription = service.getPrescriptionEntity(id);
        ByteArrayInputStream bis = pdfGeneratorService.generatePrescriptionPdf(prescription);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "inline; filename=prescription_" + id + ".pdf");

        return ResponseEntity
                .ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_PDF)
                .body(new InputStreamResource(bis));
    }
}
