# 🚀 Java Spring Boot Microservices & System Design Masterclass

Welcome to the **Hands-On API-Driven Learning Series**, built directly around the enterprise **Hospital Management System** codebase.

This document serves as your **Master Index, Tech Stack Feature Map, and 15-Day Interactive Learning Checklist** (2 APIs per day).

---

## 📋 1. Project Tech Stack & Architecture Feature Map

Below is the feature map of microservices, design patterns, and framework features implemented across this repository:

| Category | Framework / Tool | Implementation Details |
| :--- | :--- | :--- |
| **Parent Project** | Maven Multi-Module (`pom.xml`) | Centralized dependency version management via `<dependencyManagement>` BOM imports. |
| **Service Discovery** | Spring Cloud Netflix Eureka | Dynamic service registration on port `8761`, heartbeat renewal, client-side load balancing (`lb://`). |
| **API Gateway** | Spring Cloud Gateway (Netty) | Non-blocking reactive Gateway on port `8080`, global CORS config, path predicates, custom reactive `JwtAuthenticationFilter`. |
| **Security & Auth** | OAuth2 / Stateless JWT | 15-min Access Tokens, 7-day Refresh Token Rotation, BCrypt hashing, Role-Based Access Control (`ROLE_PATIENT`, `ROLE_DOCTOR`, `ROLE_ADMIN`, `ROLE_STAFF`). |
| **Rate Limiting** | Redis Token Bucket | Traffic throttling via `RequestRateLimiter` in API Gateway with configurable replenish rate and burst capacity. |
| **Resilience & Circuit**| Resilience4j Circuit Breaker | Circuit Breaker fallback forwarding (`/fallback/auth`), sliding window count/time metrics, thread isolation. |
| **Distributed Transactions** | Kafka Saga Orchestration | Event-driven appointment booking saga (`BOOKING_INITIATED`, `CONFIRMED`, `FAILED`), compensation handlers, DLQ. |
| **Real-Time Streaming**| STOMP WebSocket + SockJS | Dynamic WebSocket broker on port `8083`, pub/sub topic channels (`/topic/queue/{doctorId}`) for live token queue streams. |
| **Caching Engine** | Redis Mutex & Stampede Lock | Multi-level Redis caching, cache invalidation, Mutex locking to prevent Thundering Herd / Cache Stampede. |
| **Database Isolation** | Database-per-Service (MySQL) | Isolated DB instances on port `3307` (`auth_db`, `patient_db`, `appt_db`, `billing_db`), Spring Data JPA, `@OneToOne` & `@OneToMany` relationships, Scalar Foreign Keys. |
| **Observability** | Micrometer + Zipkin + Actuator | Distributed Tracing (`TraceId` & `SpanId` header propagation over HTTP/Kafka), Prometheus Actuator metrics. |
| **PDF Generation** | OpenPDF Engine | Dynamic document generation for Clinical Prescriptions and Financial Billing Invoices with direct URL streaming. |

---

## 🗓️ 2. 15-Day Master API Roadmap & Progress Tracker (2 APIs / Day)

Each module includes **Layman Concept Explanations + End-to-End Request/Response Flow + UML Class/Sequence Diagrams + DB Table Row Simulations (Before & After) + Line-by-Line Code Links + Interview Q&A**.

- [x] **Day 01: User Registration & Authentication Core (`auth-service`)**  
  👉 Document: [`Day_01_Auth_Register_and_Login_APIs.md`](file:///c:/Mamidi/2026/POC/hospital%20management/docs/learning_series/Day_01_Auth_Register_and_Login_APIs.md)  
  *APIs*:  
  1. `POST /api/v1/auth/register` (OAuth2 User Registration & BCrypt Password Hashing)  
  2. `POST /api/v1/auth/login` (Authentication & JWT Access / Refresh Token Generation)

- [x] **Day 02: Token Security, Rotation & Logout (`auth-service`)**  
  👉 Document: [`Day_02_Token_Rotation_and_Logout_APIs.md`](file:///c:/Mamidi/2026/POC/hospital%20management/docs/learning_series/Day_02_Token_Rotation_and_Logout_APIs.md)  
  *APIs*:  
  3. `POST /api/v1/auth/refresh` (Refresh Token Rotation & New Access Token Issue)  
  4. `POST /api/v1/auth/logout` (Stateless Token Revocation & Revoked State Cleanup)

- [ ] **Day 03: Redis Cache Stampede Protection & Patient Profiles (`auth-service` & `patient-doctor-service`)**  
  👉 Document: `Day_03_Redis_Stampede_and_Patient_Profiles_APIs.md`  
  *APIs*:  
  5. `GET /api/v1/auth/users/{id}` (User Profile Lookup with Redis Mutex Stampede Protection)  
  6. `POST /api/v1/patients` (Register / Update Patient Profile & Entity PrePersist)

- [ ] **Day 04: Patient Roster Management (`patient-doctor-service`)**  
  👉 Document: `Day_04_Patient_Roster_Management_APIs.md`  
  *APIs*:  
  7. `GET /api/v1/patients` (Fetch All Registered Patients List)  
  8. `GET /api/v1/patients/{id}` (Get Patient Details by Patient ID)

- [ ] **Day 05: Auto-Provisioning & EMR History (`patient-doctor-service`)**  
  👉 Document: `Day_05_Auto_Provisioning_and_EMR_History_APIs.md`  
  *APIs*:  
  9. `GET /api/v1/patients/user/{userId}` (Get/Provision Patient Profile by Auth User ID)  
  10. `GET /api/v1/patients/{id}/medical-history` (Get Patient EMR Medical Records Timeline)

- [ ] **Day 06: EMR Records Creation & Doctor Registration (`patient-doctor-service`)**  
  👉 Document: `Day_06_EMR_Creation_and_Doctor_Registration_APIs.md`  
  *APIs*:  
  11. `POST /api/v1/patients/{id}/medical-history` (Add EMR Medical Record Entry)  
  12. `POST /api/v1/doctors` (Register / Update Doctor Roster Profile)

- [ ] **Day 07: Doctor Roster & Filtering (`patient-doctor-service`)**  
  👉 Document: `Day_07_Doctor_Roster_and_Filtering_APIs.md`  
  *APIs*:  
  13. `GET /api/v1/doctors` (Fetch All Doctors / Filter by Specialization)  
  14. `GET /api/v1/doctors/{id}` (Get Doctor Details by ID)

- [ ] **Day 08: Doctor Profile Auto-Provisioning & Prescriptions (`patient-doctor-service`)**  
  👉 Document: `Day_08_Doctor_Auto_Provisioning_and_Prescriptions_APIs.md`  
  *APIs*:  
  15. `GET /api/v1/doctors/user/{userId}` (Get/Provision Doctor Profile by Auth User ID)  
  16. `POST /api/v1/prescriptions` (Create Clinical Prescription)

- [ ] **Day 09: Clinical Prescriptions History & PDF Generation (`patient-doctor-service`)**  
  👉 Document: `Day_09_Prescriptions_History_and_PDF_Generation_APIs.md`  
  *APIs*:  
  17. `GET /api/v1/prescriptions/patient/{patientId}` (Fetch Patient Prescriptions History)  
  18. `GET /api/v1/prescriptions/{id}/pdf` (Generate & Stream Clinical Prescription PDF File)

- [ ] **Day 10: Kafka Saga Booking & Patient History (`appointment-service`)**  
  👉 Document: `Day_10_Kafka_Saga_Booking_and_History_APIs.md`  
  *APIs*:  
  19. `POST /api/v1/appointments/book` (Book Appointment & Trigger Kafka Saga Workflow)  
  20. `GET /api/v1/appointments/patient/{patientId}` (Fetch Patient Appointment Booking History)

- [ ] **Day 11: Doctor Queue Roster & Status Transitions (`appointment-service`)**  
  👉 Document: `Day_11_Doctor_Queue_and_Status_Transitions_APIs.md`  
  *APIs*:  
  21. `GET /api/v1/appointments/doctor/{doctorId}` (Fetch Doctor Daily Appointment Roster)  
  22. `PUT /api/v1/appointments/{id}/status` (Update Consultation Status & Broadcast Live Token Updates)

- [ ] **Day 12: Real-Time WebSockets & Inventory Management (`appointment-service` & `billing-inventory-service`)**  
  👉 Document: `Day_12_WebSockets_Live_Stream_and_Inventory_APIs.md`  
  *APIs*:  
  23. `WS /ws-token (/topic/queue/{doctorId})` (WebSocket Live Queue Token Stream Pub/Sub)  
  24. `POST /api/v1/inventory` (Add Stock / Medicine Item)

- [ ] **Day 13: Inventory Tracking & Low Stock Alerts (`billing-inventory-service`)**  
  👉 Document: `Day_13_Inventory_Tracking_and_Low_Stock_Alerts_APIs.md`  
  *APIs*:  
  25. `GET /api/v1/inventory` (Fetch Medicine Inventory Tracking List)  
  26. `GET /api/v1/inventory/alerts/low-stock` (Fetch Low Stock Warnings & Reorder Level Alerts)

- [ ] **Day 14: Invoice Generation & Patient Billing Ledger (`billing-inventory-service`)**  
  👉 Document: `Day_14_Invoice_Generation_and_Billing_Ledger_APIs.md`  
  *APIs*:  
  27. `POST /api/v1/billing/invoices` (Generate Patient Financial Invoice)  
  28. `GET /api/v1/billing/invoices/patient/{patientId}` (Fetch Patient Invoices Ledger)

- [ ] **Day 15: Billing PDF Receipts & Staff Roster (`billing-inventory-service`)**  
  👉 Document: `Day_15_Billing_PDF_Receipts_and_Staff_Roster_APIs.md`  
  *APIs*:  
  29. `GET /api/v1/billing/invoices/{id}/pdf` (Generate & Stream Financial Invoice PDF Receipt)  
  30. `POST /api/v1/staff` & `GET /api/v1/staff` (Hospital Staff Management Endpoints)
