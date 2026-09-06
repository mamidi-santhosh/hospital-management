package com.hospital.appointment.saga;

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
public class AppointmentSagaEvent {
    private String eventId;
    private Long appointmentId;
    private Long patientId;
    private Long doctorId;
    private BigDecimal fee;
    private String eventType; // BOOKING_INITIATED, BILLING_RESERVED, BOOKING_CONFIRMED, BOOKING_FAILED
    private String status;
    private String failureReason;
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
