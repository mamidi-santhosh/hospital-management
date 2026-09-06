package com.hospital.billinginventory.controller;

import com.hospital.billinginventory.dto.ApiResponse;
import com.hospital.billinginventory.dto.StaffDto;
import com.hospital.billinginventory.service.BillingInventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/staff")
@RequiredArgsConstructor
@Tag(name = "Staff Controller", description = "Endpoints for managing hospital staff roster")
public class StaffController {

    private final BillingInventoryService service;

    @PostMapping
    @Operation(summary = "Add or update hospital staff record")
    public ResponseEntity<ApiResponse<StaffDto>> addOrUpdateStaff(@RequestBody StaffDto dto) {
        return ResponseEntity.ok(ApiResponse.success("Staff record saved successfully", service.addOrUpdateStaff(dto)));
    }

    @GetMapping
    @Operation(summary = "Get all hospital staff")
    public ResponseEntity<ApiResponse<List<StaffDto>>> getAllStaff() {
        return ResponseEntity.ok(ApiResponse.success("Staff roster fetched successfully", service.getAllStaff()));
    }
}
