package com.hospital.patientdoctor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "prescriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long appointmentId;

    @Column(nullable = false)
    private Long patientId;

    private String patientName;

    @Column(nullable = false)
    private Long doctorId;

    private String doctorName;

    private String diagnosis;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String medicines; // JSON array or formatted line list

    @Column(columnDefinition = "TEXT")
    private String instructions;

    private LocalDateTime issueDate;

    @PrePersist
    protected void onCreate() {
        this.issueDate = LocalDateTime.now();
    }
}
