package com.hospital.billinginventory.controller;

import com.hospital.billinginventory.dto.ApiResponse;
import com.hospital.billinginventory.dto.InventoryItemDto;
import com.hospital.billinginventory.service.BillingInventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory Controller", description = "Endpoints for inventory tracking and low-stock reorder alerts")
public class InventoryController {

    private final BillingInventoryService service;

    @PostMapping
    @Operation(summary = "Add or update inventory item stock")
    public ResponseEntity<ApiResponse<InventoryItemDto>> addOrUpdateInventory(@RequestBody InventoryItemDto dto) {
        return ResponseEntity.ok(ApiResponse.success("Inventory item saved successfully", service.addOrUpdateInventory(dto)));
    }

    @GetMapping
    @Operation(summary = "Get complete inventory stock list")
    public ResponseEntity<ApiResponse<List<InventoryItemDto>>> getAllInventory() {
        return ResponseEntity.ok(ApiResponse.success("Inventory list fetched successfully", service.getAllInventory()));
    }

    @GetMapping("/alerts/low-stock")
    @Operation(summary = "Get low-stock items requiring reorder")
    public ResponseEntity<ApiResponse<List<InventoryItemDto>>> getLowStockAlerts() {
        return ResponseEntity.ok(ApiResponse.success("Low stock alerts fetched successfully", service.getLowStockAlerts()));
    }
}
