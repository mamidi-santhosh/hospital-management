package com.hospital.billinginventory.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "staff")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Staff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    private String designation;

    private String department;

    private String email;

    private String phoneNumber;

    private BigDecimal salary;

    private String shift; // Day, Night, Rotating

    @Builder.Default
    private boolean active = true;
}
