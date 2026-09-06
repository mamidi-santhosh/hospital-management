package com.hospital.patientdoctor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "doctors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String specialization;

    private String qualification;

    private Integer experienceYears;

    private BigDecimal consultationFee;

    private String availableDays;

    @Builder.Default
    private boolean available = true;
}
