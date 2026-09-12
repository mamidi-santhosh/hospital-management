package com.hospital.patientdoctor.controller;

import com.hospital.patientdoctor.dto.ApiResponse;
import com.hospital.patientdoctor.dto.DoctorDto;
import com.hospital.patientdoctor.service.PatientDoctorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/doctors")
@RequiredArgsConstructor
@Tag(name = "Doctor Controller", description = "Endpoints for doctor profile and roster management")
public class DoctorController {

    private final PatientDoctorService service;

    @PostMapping
    @Operation(summary = "Register or update doctor profile")
    public ResponseEntity<ApiResponse<DoctorDto>> saveDoctor(@RequestBody DoctorDto dto) {
        DoctorDto saved = service.createOrUpdateDoctor(dto);
        return ResponseEntity.ok(ApiResponse.success("Doctor profile saved successfully", saved));
    }

    @GetMapping
    @Operation(summary = "Get all doctors, optionally filtered by specialization")
    public ResponseEntity<ApiResponse<List<DoctorDto>>> getAllDoctors(@RequestParam(value = "specialization", required = false) String specialization) {
        return ResponseEntity.ok(ApiResponse.success("Doctors roster fetched successfully", service.getAllDoctors(specialization)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get doctor details by ID")
    public ResponseEntity<ApiResponse<DoctorDto>> getDoctorById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(ApiResponse.success("Doctor details fetched successfully", service.getDoctorById(id)));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get or create doctor profile by user ID")
    public ResponseEntity<ApiResponse<DoctorDto>> getDoctorByUserId(
            @PathVariable("userId") Long userId,
            @RequestParam(value = "username", required = false) String username,
            @RequestParam(value = "fullName", required = false) String fullName) {
        return ResponseEntity.ok(ApiResponse.success("Doctor profile fetched successfully", service.getDoctorByUserId(userId, username, fullName)));
    }
}
