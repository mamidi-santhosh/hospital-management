package com.hospital.appointment.controller;

import com.hospital.appointment.dto.ApiResponse;
import com.hospital.appointment.dto.AppointmentBookingRequest;
import com.hospital.appointment.dto.AppointmentDto;
import com.hospital.appointment.entity.AppointmentStatus;
import com.hospital.appointment.service.AppointmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/appointments")
@RequiredArgsConstructor
@Tag(name = "Appointment Controller", description = "Endpoints for booking appointments, Saga orchestration, and queue updates")
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping("/book")
    @Operation(summary = "Book appointment and trigger Kafka Saga workflow")
    public ResponseEntity<ApiResponse<AppointmentDto>> bookAppointment(@Valid @RequestBody AppointmentBookingRequest request) {
        AppointmentDto booked = appointmentService.bookAppointment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Appointment booking initiated successfully via Saga", booked));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update appointment status and broadcast live token update")
    public ResponseEntity<ApiResponse<AppointmentDto>> updateStatus(
            @PathVariable("id") Long id,
            @RequestParam("status") AppointmentStatus status) {
        AppointmentDto updated = appointmentService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Appointment status updated successfully", updated));
    }

    @GetMapping("/patient/{patientId}")
    @Operation(summary = "Get patient appointment history")
    public ResponseEntity<ApiResponse<List<AppointmentDto>>> getPatientAppointments(@PathVariable("patientId") Long patientId) {
        return ResponseEntity.ok(ApiResponse.success("Appointments fetched successfully", appointmentService.getPatientAppointments(patientId)));
    }

    @GetMapping("/doctor/{doctorId}")
    @Operation(summary = "Get doctor appointment roster for a specific date")
    public ResponseEntity<ApiResponse<List<AppointmentDto>>> getDoctorAppointments(
            @PathVariable("doctorId") Long doctorId,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.success("Doctor roster fetched successfully", appointmentService.getDoctorAppointments(doctorId, date)));
    }
}
