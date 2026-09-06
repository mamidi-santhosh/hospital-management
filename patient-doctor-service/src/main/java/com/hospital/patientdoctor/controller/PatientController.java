package com.hospital.patientdoctor.controller;

import com.hospital.patientdoctor.dto.ApiResponse;
import com.hospital.patientdoctor.dto.MedicalRecordDto;
import com.hospital.patientdoctor.dto.PatientDto;
import com.hospital.patientdoctor.service.PatientDoctorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/patients")
@RequiredArgsConstructor
@Tag(name = "Patient Controller", description = "Endpoints for managing patient records and EMR history")
public class PatientController {

    private final PatientDoctorService service;

    @PostMapping
    @Operation(summary = "Register or update patient profile")
    public ResponseEntity<ApiResponse<PatientDto>> savePatient(@RequestBody PatientDto dto) {
        PatientDto saved = service.createOrUpdatePatient(dto);
        return ResponseEntity.ok(ApiResponse.success("Patient profile saved successfully", saved));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get patient by ID")
    public ResponseEntity<ApiResponse<PatientDto>> getPatientById(@PathVariable("id") Long id) {
        PatientDto patient = service.getPatientById(id);
        return ResponseEntity.ok(ApiResponse.success("Patient details fetched successfully", patient));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get patient profile by User ID")
    public ResponseEntity<ApiResponse<PatientDto>> getPatientByUserId(@PathVariable("userId") Long userId) {
        PatientDto patient = service.getPatientByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success("Patient details fetched successfully", patient));
    }

    @GetMapping
    @Operation(summary = "Get all registered patients")
    public ResponseEntity<ApiResponse<List<PatientDto>>> getAllPatients() {
        return ResponseEntity.ok(ApiResponse.success("Patients list fetched successfully", service.getAllPatients()));
    }

    @GetMapping("/{id}/medical-history")
    @Operation(summary = "Get patient EMR medical history timeline")
    public ResponseEntity<ApiResponse<List<MedicalRecordDto>>> getMedicalHistory(@PathVariable("id") Long id) {
        return ResponseEntity.ok(ApiResponse.success("Medical history fetched successfully", service.getPatientMedicalHistory(id)));
    }

    @PostMapping("/{id}/medical-history")
    @Operation(summary = "Add a new EMR medical record")
    public ResponseEntity<ApiResponse<MedicalRecordDto>> addMedicalRecord(@PathVariable("id") Long id, @RequestBody MedicalRecordDto dto) {
        dto.setPatientId(id);
        return ResponseEntity.ok(ApiResponse.success("Medical record added successfully", service.addMedicalRecord(dto)));
    }
}
