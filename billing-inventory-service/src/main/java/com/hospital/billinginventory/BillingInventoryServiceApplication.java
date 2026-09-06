package com.hospital.billinginventory;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class BillingInventoryServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(BillingInventoryServiceApplication.class, args);
    }
}
