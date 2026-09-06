package com.hospital.billinginventory.dto;

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
public class InventoryItemDto {
    private Long id;
    private String itemName;
    private String category;
    private Integer quantity;
    private Integer reorderLevel;
    private BigDecimal unitPrice;
    private String supplierName;
    private LocalDateTime updatedAt;
}
