package com.hospital.appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TokenQueueMessage {
    private Long doctorId;
    private Integer currentServingToken;
    private Integer nextUpcomingToken;
    private Integer totalInQueue;
    private String doctorName;
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
