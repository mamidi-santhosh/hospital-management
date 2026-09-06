# Healthcare Management System (Enterprise Microservices Monorepo)

A production-grade, distributed Healthcare Management System for managing patient records, electronic medical records (EMR), doctor consultation rosters, real-time appointment queue tracking via STOMP WebSockets, event-driven distributed transactions via Apache Kafka Saga Orchestration, OAuth2/JWT security with Redis cache stampede protection, and automated PDF export.

---

## 🏗 System Architecture

```
                                  +-----------------------+
                                  |   React + MUI + RTK   |
                                  |   Frontend Portal     |
                                  |    (Port 3000)        |
                                  +-----------+-----------+
                                              |
                                              v (HTTPS / STOMP)
                                  +-----------+-----------+
                                  |   Spring Cloud Gateway|
                                  | (Rate Limiting, JWT,  |
                                  |   Resilience4j CB)    |
                                  |    (Port 8080)        |
                                  +----+-----+-------+----+
                                       |     |       |
                 +---------------------+     |       +----------------------+
                 |                           v                              |
                 v               +-----------+-----------+                  v
  +--------------+------------+  |  Appointment Service  |   +--------------+------------+
  |    Auth / OAuth2 Service  |  | (Saga Orchestrator,   |   |   Patient & Doctor Service|
  | (JWT, Redis Stampede Fix) |  |  WebSockets, Redis)   |   |  (Records, Prescriptions) |
  |    (Port 8081)            |  |    (Port 8083)        |   |    (Port 8082)            |
  +--------------+------------+  +-----------+-----------+   +--------------+------------+
                 |                           |                              |
                 v                           v                              v
           MySQL (auth_db)            MySQL (appt_db)               MySQL (patient_db)
                 |                           |                              |
                 +-------------------+-------+-------+----------------------+
                                     |               |
                                     v               v
                              +------+------+ +------+------+
                              | Apache Kafka| |    Redis    |
                              | (Idempotent)| | (Cluster Lock|
                              | (DLQ / DLT) | |  Pub/Sub)   |
                              +-------------+ +-------------+
```

---

## 🛠 Tech Stack Specification

### Backend & Microservices
- **Java 17**, **Spring Boot 3.2.5**, **Spring Cloud 2023.0.1**
- **Service Discovery**: Spring Cloud Netflix Eureka Server (`eureka-server` @ port 8761)
- **API Gateway**: Spring Cloud Gateway (`api-gateway` @ port 8080) with Resilience4j Circuit Breakers and Redis Rate Limiter
- **Security & Identity**: Spring Security OAuth2/JWT with dual tokens (Access & Refresh tokens) and Redis token blacklisting (`auth-service` @ port 8081)
- **Cache Stampede Prevention**: Redis Distributed Mutex Locking (`SETNX` with TTL) and probabilistic early eviction handling
- **Event-Driven Saga**: Apache Kafka with Idempotent Producers (`acks=all`), Retry topics, and Dead Letter Topics (`appointment-service` @ port 8083)
- **Real-Time Streaming**: STOMP WebSockets with Redis Pub/Sub backplane for live appointment token broadcasting
- **Document & Notification Engine**: OpenPDF for medical prescription/invoice export, Spring Mail for email dispatch (`patient-doctor-service` @ port 8082 & `billing-inventory-service` @ port 8084)
- **Database**: MySQL 8.0 (Isolated schemas per service: `auth_db`, `patient_db`, `appt_db`, `billing_db`)
- **Tracing & Observability**: Micrometer Tracing, OpenZipkin (port 9411), Spring Boot Actuator health probes

### Frontend
- **React 18**, **Redux Toolkit (RTK)**, **Material-UI (MUI v5)**, **Vite**
- **WebSockets**: `@stomp/stompjs` & `sockjs-client`
- **Network Pipeline**: Axios with automated Bearer token injection and silent 401 refresh token rotation

---

## 📋 Service Roster & Port Mapping

| Service Name | Port | Description |
| :--- | :--- | :--- |
| `frontend` | `3000` | React single-page app with Patient, Doctor, Admin, and Live Queue views |
| `api-gateway` | `8080` | Entry gateway, JWT validation filter, rate limiter, circuit breakers |
| `auth-service` | `8081` | User registration, login, token refresh, logout, Redis stampede fix |
| `patient-doctor-service` | `8082` | Patient profiles, EMR history, doctor roster, OpenPDF prescriptions |
| `appointment-service` | `8083` | Appointment booking, Kafka Saga Orchestrator, STOMP WebSocket queue broker |
| `billing-inventory-service` | `8084` | Staff management, inventory alerts, billing PDF invoices, email service |
| `eureka-server` | `8761` | Netflix Eureka Service Discovery Dashboard |
| `zipkin` | `9411` | OpenZipkin Distributed Tracing Dashboard |
| `mysql` | `3307` | MySQL Server hosting `auth_db`, `patient_db`, `appt_db`, `billing_db` |
| `redis` | `6379` | Redis In-Memory Cache, Distributed Lock Mutex, Pub/Sub |
| `kafka` | `9092` | Apache Kafka Event Streaming Broker |

---

## 🚀 How to Run the Application

### Prerequisites
- **Java JDK 17+**
- **Maven 3.8+**
- **Node.js 18+ & npm**
- **Docker Desktop** (with Docker Compose)

---

### Step 1: Clone & Launch Infrastructure Containers
Start MySQL, Redis, Kafka, Zookeeper, and Zipkin containers:
```bash
git clone <repo-url>
cd "hospital management"
docker-compose up -d
```
Verify containers are running:
```bash
docker ps
```

---

### Step 2: Build the Codebase
Build all Java microservices and React frontend:
```bash
# Build Java backend
mvn clean compile -DskipTests

# Build React frontend
cd frontend
npm install
npm run build
cd ..
```

---

### Step 3: Launch Services

#### Option A: One-Click PowerShell Script (Windows)
Run the provided launch script to automatically boot all microservices in separate terminal windows:
```powershell
.\start-all.ps1
```

#### Option B: Manual Service Startup
Start services in separate terminal windows in the following order:

1. **Eureka Server** (Discovery):
   ```bash
   mvn -pl eureka-server spring-boot:run
   ```
2. **API Gateway**:
   ```bash
   mvn -pl api-gateway spring-boot:run
   ```
3. **Auth Service**:
   ```bash
   mvn -pl auth-service spring-boot:run
   ```
4. **Patient & Doctor Service**:
   ```bash
   mvn -pl patient-doctor-service spring-boot:run
   ```
5. **Appointment Service**:
   ```bash
   mvn -pl appointment-service spring-boot:run
   ```
6. **Billing & Inventory Service**:
   ```bash
   mvn -pl billing-inventory-service spring-boot:run
   ```
7. **React Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

---

## 📖 Feature Walkthrough & Usage Guide

### 1. User Registration & Sign In (`http://localhost:3000/login`)
- Register new users with roles: `ROLE_PATIENT`, `ROLE_DOCTOR`, `ROLE_ADMIN`, `ROLE_STAFF`.
- Login issues short-lived JWT Access Tokens (15 mins) and long-lived Refresh Tokens (7 days).

### 2. Patient Portal (`http://localhost:3000/patient`)
- **Book Appointment**: Select doctor, date, time, and reason. Submitting triggers the **Kafka Saga Orchestration** workflow.
- **My Appointments**: View assigned queue token numbers, status (`CONFIRMED`, `PENDING`), and consultation details.
- **Prescription Download**: Download official PDF medical prescriptions generated via OpenPDF.

### 3. Doctor Portal (`http://localhost:3000/doctor`)
- **Consultation Queue**: Call patient tokens in real-time (`IN_PROGRESS`), advance queue status (`COMPLETED`), which automatically broadcasts live token updates via WebSockets.
- **Digital Prescription Writer**: Issue prescriptions with diagnosis, medication dosage, and special instructions.

### 4. Live Token Queue Stream (`http://localhost:3000/queue`)
- Connects via STOMP WebSockets (`/ws-token`) to display live current serving tokens, upcoming tokens, and total patients waiting in real time with audio-visual pulses.

### 5. Admin & Operations Portal (`http://localhost:3000/admin`)
- **Staff Roster**: Manage doctors, nurses, administration staff, salaries, and shifts.
- **Inventory Control**: Track medicine stock and receive automated **Low Stock Warning Alerts** when items fall below reorder thresholds.
- **Billing Ledger & Invoices**: Generate patient tax invoices and download PDF receipt receipts.

---

## 🔗 Swagger API Documentation & Actuator Endpoints

Each microservice exposes interactive Swagger UI documentation and Actuator health probes:

- **API Gateway Swagger**: `http://localhost:8080/swagger-ui.html`
- **Auth Service Swagger**: `http://localhost:8081/swagger-ui.html`
- **Patient & Doctor Service Swagger**: `http://localhost:8082/swagger-ui.html`
- **Appointment Service Swagger**: `http://localhost:8083/swagger-ui.html`
- **Billing Service Swagger**: `http://localhost:8084/swagger-ui.html`
- **Eureka Server Dashboard**: `http://localhost:8761`
- **Zipkin Tracing UI**: `http://localhost:9411`
