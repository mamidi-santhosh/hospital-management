package com.hospital.appointment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class AppointmentBookingRequest {
    @NotNull
    private Long patientId;
    private String patientName;

    @NotNull
    private Long doctorId;
    private String doctorName;

    @NotNull
    private LocalDate appointmentDate;

    @NotNull
    private LocalTime appointmentTime;

    private BigDecimal fee;
    private String reason;
}
