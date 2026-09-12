# Healthcare Management System — Figma UX Flow Documents Index

> **Master Figma Storyboard Suite**  
> Dedicated step-by-step UX documents for each flow in the Healthcare Management System, featuring Figma UI artboards, screen components, interactions, microservices data flows, and presentation scripts.

---

## 📂 Dedicated UX Flow Documents

| Flow # | Figma Board ID | Flow Document File Link | Primary Persona & Features |
| :--- | :--- | :--- | :--- |
| **Flow 1** | `FIG-FLOW-01-AUTH` | **[Flow 1: OAuth2 Authentication & Security](file:///c:/Mamidi/2026/POC/hospital%20management/docs/ux_flows/Flow_1_OAuth2_Authentication_and_Security.md)** | All Personas (`/login`). Sign In, Registration, JWT Access & Refresh Token rotation, Redis stampede fix. |
| **Flow 2** | `FIG-FLOW-02-PATIENT` | **[Flow 2: Patient Appointment Booking & Saga](file:///c:/Mamidi/2026/POC/hospital%20management/docs/ux_flows/Flow_2_Patient_Appointment_Booking_and_Kafka_Saga.md)** | Patient (`/patient`). Doctor selection, Kafka Saga Orchestration, Token `#101` confirmation, OpenPDF prescriptions. |
| **Flow 3** | `FIG-FLOW-03-DOCTOR` | **[Flow 3: Doctor Clinical Consultation](file:///c:/Mamidi/2026/POC/hospital%20management/docs/ux_flows/Flow_3_Doctor_Clinical_Consultation_and_Prescriptions.md)** | Doctor (`/doctor`). Consultation queue, calling patients (`IN_PROGRESS`), Digital Prescription Editor modal. |
| **Flow 4** | `FIG-FLOW-04-QUEUE` | **[Flow 4: Real-Time STOMP Live Queue Stream](file:///c:/Mamidi/2026/POC/hospital%20management/docs/ux_flows/Flow_4_RealTime_Live_Queue_Token_Stream.md)** | Waiting Lobby (`/queue`). STOMP WebSockets (`/ws-token`), Redis Pub/Sub, live token updates (`#4` -> `#5`). |
| **Flow 5** | `FIG-FLOW-05-STAFF` | **[Flow 5: Hospital Staff Roster Management](file:///c:/Mamidi/2026/POC/hospital%20management/docs/ux_flows/Flow_5_Hospital_Staff_Roster_Management.md)** | Admin (`/admin` Tab 1). Onboarding staff, clinical departments, monthly salary management. |
| **Flow 6** | `FIG-FLOW-06-INVENTORY` | **[Flow 6: Inventory Control & Low Stock Alerts](file:///c:/Mamidi/2026/POC/hospital%20management/docs/ux_flows/Flow_6_Medical_Inventory_Control_and_Low_Stock_Alerts.md)** | Admin (`/admin` Tab 2). Pharmaceutical stock tracking, reorder levels, red `LOW STOCK` badges & warning alert banner. |
| **Flow 7** | `FIG-FLOW-07-BILLING` | **[Flow 7: Financial Billing Ledger & PDF Invoices](file:///c:/Mamidi/2026/POC/hospital%20management/docs/ux_flows/Flow_7_Financial_Billing_Ledger_and_PDF_Invoices.md)** | Admin (`/admin` Tab 3). Consultation, pharmacy, lab fee itemization, tax computation, OpenPDF tax invoice export. |

---

## 📐 Figma System Navigation Topology

```
                                +---------------------------+
                                |   FIG-FLOW-01-AUTH        |
                                |  http://localhost:3000   |
                                |     Login & Security      |
                                +-------------+-------------+
                                              |
                     +------------------------+------------------------+
                     |                        |                        |
                     v                        v                        v
        +-------------------------+ +-------------------+ +-------------------------+
        |   FIG-FLOW-02-PATIENT   | | FIG-FLOW-03-DOCTOR| |  FIG-FLOW-05/06/07-ADMIN|
        |   Patient Portal        | |   Doctor Portal   | |   Admin & Ops Portal    |
        |  /patient               | |  /doctor          | |  /admin                 |
        +------------+------------+ +---------+---------+ +------------+------------+
                     |                        |                        |
                     +------------------------+------------------------+
                                              |
                                              v
                                +---------------------------+
                                |   FIG-FLOW-04-QUEUE       |
                                |   Live Queue Display      |
                                |  /queue (STOMP WebSockets)|
                                +---------------------------+
```
