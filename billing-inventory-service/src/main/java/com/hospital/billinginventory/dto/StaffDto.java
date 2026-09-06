package com.hospital.billinginventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffDto {
    private Long id;
    private String fullName;
    private String designation;
    private String department;
    private String email;
    private String phoneNumber;
    private BigDecimal salary;
    private String shift;
    private boolean active;
}
