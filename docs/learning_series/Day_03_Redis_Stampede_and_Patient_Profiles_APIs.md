# 📚 Hands-On API Masterclass - Day 3

## Module: Redis Cache Stampede Protection & Patient Profiles (`auth-service` & `patient-doctor-service`)

Welcome to **Day 3**! Today we dissect two high-performance enterprise endpoints:
1. `GET /api/v1/auth/users/{id}` — User Profile Lookup with Redis Mutex Cache Stampede Protection (`auth-service`)
2. `POST /api/v1/patients` — Register / Update Patient Profile with JPA `@PrePersist` Lifecycle Event (`patient-doctor-service`)

---

# 🐣 SECTION 1: Layman Analogy vs. Backend Developer Analogy

Before inspecting the Java code, review how each core concept translates from real-world non-technical analogies into concrete backend software engineering terms:

| Concept / Technology | 🐣 Layman Analogy | 💻 Backend Developer Analogy & Technical Definition |
| **Jackson ObjectMapper & HTTP Converters** | A translator sitting between two diplomats. Translates spoken English (**JSON bytes**) into written shorthand (**Java Objects**) and back! | Spring MVC's `MappingJackson2HttpMessageConverter` wrapping `com.fasterxml.jackson.databind.ObjectMapper`. Converts raw HTTP JSON bytes into Java DTOs (`readValue()`) and Java objects into UTF-8 JSON responses (`writeValueAsString()`). |
| :--- | :--- | :--- |
| **Cache Stampede (Thundering Herd)** | A popular bakery giving away free bread at 9 AM. When the doors open, 1,000 people rush the counter at once, crushing the staff before anyone can get a loaf. | A high-concurrency race condition occurring when a heavily-read Redis cache key expires. Hundreds of concurrent threads simultaneously experience a Cache Miss and dog-pile the underlying MySQL database with duplicate `SELECT` queries, crashing the DB pool. |
| **Distributed Mutex Lock (`SETNX`)** | A bathroom door lock at a crowded event. The first person locks the door from inside. Everyone else in line waits patiently until the occupant finishes and unlocks the door. | A Redis atomic lock (`redisTemplate.opsForValue().setIfAbsent(lockKey, value, ttl)`). Only ONE concurrent thread acquires the lock to compute the database result and populate Redis, while all other threads sleep and retry, protecting MySQL. |
| **Spin Lock & Retry Loop** | Standing outside the bathroom door and knocking every 10 seconds to check if the occupant has finished. | A non-blocking thread polling pattern (`Thread.sleep(100); return getOrComputeWithLock(...)`) where waiting threads back off for 100ms before re-checking if the Redis cache key has been populated by the lock holder. |
| **JPA `@PrePersist` Lifecycle Hook** | An automated birth certificate printing machine that stamps today's date and time onto the document right before filing it in the cabinet. | A JPA entity lifecycle callback annotation. Hibernate automatically intercepts the entity state right before executing the SQL `INSERT INTO patients` statement, populating auditing fields like `createdAt = LocalDateTime.now()`. |

---

# 🌐 SECTION 2: API 5 - `GET /api/v1/auth/users/{id}` (User Profile with Redis Mutex Protection)

---

## 1. End-to-End Request & Response Specification

### **HTTP Request**
- **Method**: `GET`
- **Path**: `http://localhost:8080/api/v1/auth/users/101` (routed via API Gateway to `auth-service` at `http://localhost:8081`)
- **Headers**:
  ```http
  Authorization: Bearer eyJhbGciOiJIUzUxMiJ9.eyJyb2xlcyI6IlJPTEVfUEFUSUVOVCIsInVzZXJJZCI6MTAx...
  Content-Type: application/json
  ```

---

### **HTTP Response (Success - 200 OK)**
- **Headers**: `Content-Type: application/json`
- **Response Body JSON Payload**:
  ```json
  {
    "success": true,
    "message": "User profile fetched successfully",
    "data": {
      "id": 101,
      "username": "sarah_patient",
      "email": "sarah@example.com",
      "fullName": "Sarah Jenkins",
      "phoneNumber": "555-987-6543",
      "role": "ROLE_PATIENT"
    },
    "timestamp": "2026-09-15T00:05:00.123"
  }
  ```

### **🔄 Jackson `ObjectMapper` Data Transformation Pipeline**

1. **Redis Cache Serialization / Deserialization (`RedisCacheStampedeService`)**:
   - 🔴 **BEFORE Execution**: On Cache Miss, MySQL returns `UserDto` object; on Cache Hit, Redis returns raw JSON string.
   - ⚙️ **EXECUTION UNDER THE HOOD**:
     - **Serialization**: `objectMapper.writeValueAsString(dbResult)` converts `UserDto` Java instance into JSON string to store in Redis with 10-min TTL.
     - **Deserialization**: `objectMapper.readValue(cachedJson, UserDto.class)` parses JSON string from Redis into a typed Java `UserDto` instance in ~0.5ms.
   - 🟢 **AFTER Execution**: Fast non-blocking profile retrieval with zero MySQL queries!

2. **Outgoing Response Serialization (Java Object -> JSON)**:
   - ⚙️ **EXECUTION UNDER THE HOOD**: Spring MVC invokes `objectMapper.writeValueAsString(apiResponse)` to serialize `UserDto` payload to the client over TCP.

---

## 2. PlantUML Sequence Diagram (Architecture Flow)

```plantuml
@startuml
autonumber
actor Client as "React Web App"
participant GW as "Spring Cloud API Gateway (8080)"
participant CTRL as "AuthController (8081)"
participant SVC as "AuthService"
participant REDIS_SVC as "RedisCacheStampedeService"
participant REDIS as "Redis Server (6379)"
database DB as "auth_db (MySQL 3307)"

Client -> GW: GET /api/v1/auth/users/101
GW -> CTRL: Forward Request to AuthController.getUserProfile(101)
CTRL -> SVC: getUserProfileWithStampedeProtection(101)
SVC -> REDIS_SVC: getOrComputeWithLock("user:profile:101", "lock:user:profile:101", ...)
REDIS_SVC -> REDIS: GET user:profile:101
alt Cache HIT
    REDIS --> REDIS_SVC: Returns Cached JSON String
    REDIS_SVC --> SVC: Deserializes JSON -> UserDto
else Cache MISS (Dog-Pile Protection)
    REDIS --> REDIS_SVC: null (Cache Miss)
    REDIS_SVC -> REDIS: SETNX lock:user:profile:101 <UUID> EX 5
    alt Lock Acquired (Winning Thread)
        REDIS --> REDIS_SVC: true (Lock Acquired)
        REDIS_SVC -> DB: SELECT * FROM users WHERE id = 101
        DB --> REDIS_SVC: Returns User Entity Record
        REDIS_SVC -> REDIS: SETEX user:profile:101 600 <UserDto JSON>
        REDIS_SVC -> REDIS: DEL lock:user:profile:101 (Release Lock)
        REDIS_SVC --> SVC: Return UserDto
    else Lock Failed (Waiting Threads)
        REDIS --> REDIS_SVC: false (Lock Occupied)
        note over REDIS_SVC: Thread.sleep(100ms) & Spin Retry
        REDIS_SVC -> REDIS_SVC: getOrComputeWithLock(...) -> Cache HIT!
    end
end
SVC --> CTRL: Return UserDto
CTRL --> GW: 200 OK + ApiResponse<UserDto>
GW --> Client: 200 OK JSON Response
@enduml
```

![Rendered PlantUML Diagram](images/day03_redis_stampede_sequence.png)


---

## 3. Database & Redis State Simulation

### **Database & Redis State Simulation (Before vs After API Execution)**

#### **BEFORE API Execution (Empty Cache & Key Store)**

##### **MySQL `auth_db.users` Table**:
| id | username | email | full_name | role |
|:---|:---|:---|:---|:---|
| 101 | sarah_patient | sarah@example.com | Sarah Jenkins | ROLE_PATIENT |

##### **Redis In-Memory Key Store**:
| Key | Value | TTL |
|:---|:---|:---|
| *(No key exists)* | — | — |

---

#### **AFTER API Execution (Populated Cache Store)**

##### **MySQL `auth_db.users` Table**: Unchanged (Read-only query).

##### **Redis In-Memory Key Store**:
| Key | Value | TTL |
|:---|:---|:---|
| `user:profile:101` | `{"id":101,"username":"sarah_patient","email":"sarah@example.com","fullName":"Sarah Jenkins","role":"ROLE_PATIENT"}` | `600 seconds (10 mins)` |
| `lock:user:profile:101` | *(Deleted in `finally` block)* | `0s` |

---

## 4. Code Dissection & Deep-Dive Internal Mechanics Walkthrough

### **A. Controller Layer**: [`AuthController.java`](file:///c:/Mamidi/2026/POC/hospital%20management/auth-service/src/main/java/com/hospital/auth/controller/AuthController.java#L53-L58)

📌 **Purpose & Responsibility**:
REST Controller endpoint `GET /api/v1/auth/users/{id}` exposing user profile lookup backed by Redis distributed locking.

```java
53:     @GetMapping("/users/{id}")
54:     @Operation(summary = "Get User profile with Redis cache stampede protection")
55:     public ResponseEntity<ApiResponse<UserDto>> getUserProfile(@PathVariable("id") Long id) {
56:         UserDto userDto = authService.getUserProfileWithStampedeProtection(id);
57:         return ResponseEntity.ok(ApiResponse.success("User profile fetched successfully", userDto));
58:     }
```

🔬 **Deep Dive: Internal Mechanics & Execution Mechanics**:
- `Line 53: @GetMapping("/users/{id}")`: Maps HTTP `GET` requests with dynamic path variable `{id}`.
- `Line 55: @PathVariable("id") Long id`: Extracts template parameter `101` from URL path.

---

### **B. Stampede Lock Service Layer**: [`RedisCacheStampedeService.java`](file:///c:/Mamidi/2026/POC/hospital%20management/auth-service/src/main/java/com/hospital/auth/service/RedisCacheStampedeService.java#L25-L65)

📌 **Purpose & Responsibility**:
Enterprise utility class implementing Distributed Mutex Locking algorithm (`SETNX`) to prevent database dog-piling when cache keys expire under high concurrency.

```java
25:     public <T> T getOrComputeWithLock(String cacheKey, String lockKey, Class<T> clazz, Duration ttl, Supplier<T> dbSupplier) {
26:         // Step 1: Check cache first
27:         String cachedJson = redisTemplate.opsForValue().get(cacheKey);
28:         if (cachedJson != null) {
29:             try {
30:                 log.debug("Cache HIT for key: {}", cacheKey);
31:                 return objectMapper.readValue(cachedJson, clazz);
32:             } catch (Exception e) {
33:                 log.error("Failed to deserialize cached value for key: {}", cacheKey, e);
34:             }
35:         }
36: 
37:         // Step 2: Cache MISS - acquire distributed mutex lock
38:         String lockValue = UUID.randomUUID().toString();
39:         Boolean acquired = redisTemplate.opsForValue().setIfAbsent(lockKey, lockValue, Duration.ofSeconds(5));
40: 
41:         if (Boolean.TRUE.equals(acquired)) {
42:             try {
43:                 log.info("Cache MISS - Lock acquired for key: {}. Computing from Database.", cacheKey);
44:                 T dbResult = dbSupplier.get();
45:                 if (dbResult != null) {
46:                     String jsonToCache = objectMapper.writeValueAsString(dbResult);
47:                     redisTemplate.opsForValue().set(cacheKey, jsonToCache, ttl);
48:                 }
49:                 return dbResult;
50:             } catch (Exception e) {
51:                 log.error("Error populating cache for key: {}", cacheKey, e);
52:                 throw new RuntimeException("Cache computation failed", e);
53:             } finally {
54:                 // Release lock safely
55:                 String currentLockVal = redisTemplate.opsForValue().get(lockKey);
56:                 if (lockValue.equals(currentLockVal)) {
57:                     redisTemplate.delete(lockKey);
58:                 }
59:             }
60:         } else {
61:             try {
62:                 Thread.sleep(100);
63:             } catch (InterruptedException e) {
64:                 Thread.currentThread().interrupt();
65:             }
66:             return getOrComputeWithLock(cacheKey, lockKey, clazz, ttl, dbSupplier);
67:         }
68:     }
```

🔬 **Deep Dive: Internal Mechanics & Execution Mechanics**:

#### **1. Redis Cache HIT Branch (`Lines 27-35`)**:
- 🔴 **BEFORE Execution**: The caller thread requests key `user:profile:101`.
- ⚙️ **EXECUTION UNDER THE HOOD**: `redisTemplate.opsForValue().get(cacheKey)` sends Redis command `GET user:profile:101`. If Redis returns a JSON string, Jackson `objectMapper.readValue(cachedJson, UserDto.class)` parses the UTF-8 bytes into a Java `UserDto` object in ~0.5ms.
- 🟢 **AFTER Execution**: Method returns `UserDto` immediately without touching MySQL DB!

#### **2. Mutex Lock Acquisition (`Lines 38-40`)**:
- 🔴 **BEFORE Execution**: 100 concurrent threads experience a Cache Miss simultaneously.
- ⚙️ **EXECUTION UNDER THE HOOD**:
  1. Each thread generates a unique UUID string `lockValue` (e.g. `b4f81234-...`).
  2. `redisTemplate.opsForValue().setIfAbsent(lockKey, lockValue, Duration.ofSeconds(5))` executes Redis command:  
     `SET lock:user:profile:101 b4f81234-... NX EX 5`
  3. Redis is **single-threaded** for command execution. The FIRST thread to hit Redis acquires the key and receives `OK` (`acquired = true`).
  4. The remaining 99 threads receive `null` / `false` (`acquired = false`).
- 🟢 **AFTER Execution**: Exactly ONE winning thread proceeds to query MySQL, while 99 threads jump to `Line 62` (`Thread.sleep(100)` spin lock)!

#### **3. Database Query & Cache Population (`Lines 44-47`)**:
- ⚙️ **EXECUTION UNDER THE HOOD**:
  1. Winning thread executes `dbSupplier.get()`, running SQL `SELECT * FROM users WHERE id = 101`.
  2. Serializes result to JSON string via `objectMapper.writeValueAsString(dbResult)`.
  3. Executes Redis command `SETEX user:profile:101 600 <JSON>` populating cache for 10 minutes.
  4. In `finally` block (`Lines 53-58`), verifies `lockValue.equals(currentLockVal)` and deletes lock key `DEL lock:user:profile:101`.

#### **4. Waiting Threads Spin Lock (`Lines 60-67`)**:
- ⚙️ **EXECUTION UNDER THE HOOD**: The 99 waiting threads sleep for 100ms, then recursively invoke `getOrComputeWithLock(...)`. On retry, `redisTemplate.opsForValue().get(cacheKey)` finds the newly populated cache key! All 99 threads return from Redis in ->O(1)-> time without making a single extra query to MySQL!



---

#### **5. Advanced Java Concept Deep Dive: Why is `getOrComputeWithLock` Typed as `<T> T ... Class<T> clazz`?**

```java
public <T> T getOrComputeWithLock(String cacheKey, String lockKey, Class<T> clazz, Duration ttl, Supplier<T> dbSupplier)
```

##### ❓ **Why is it Typed This Way?**
- **`<T>` (Generic Method Syntax)**: Declares a type parameter `<T>` scoped to this method. It means: *"This method can work with ANY Java data type (`UserDto`, `PatientDto`, `DoctorDto`, `List<PrescriptionDto>`)."*
- **`T` (Generic Return Type)**: Guarantees that the object returned by this method will be of the **exact type `T`** specified by the caller.
- **`Class<T> clazz` (Runtime Type Token)**: Passes the runtime class handle (e.g. `UserDto.class`). Necessary because Java's **Generic Type Erasure** removes `<T>` at compile-time. `clazz` gives Jackson `ObjectMapper` the exact class reflection handle to instantiate `T` during `objectMapper.readValue(json, clazz)`.
- **`Supplier<T> dbSupplier` (Functional Interface)**: A Java 8 lambda expression (`() -> userRepository.findById(userId)...`) that defers database execution. The database query is ONLY executed if a Cache Miss occurs!

---

##### 💥 **What Problem Does This Resolve? (WITHOUT vs. WITH Comparison)**

| Aspect | ❌ WITHOUT Generics (`Object` Return Type) | 🟢 WITH Generics & Type Tokens (`<T> T ... Class<T> clazz`) |
| :--- | :--- | :--- |
| **Type Safety** | **Unsafe at Runtime**: Method returns raw `Object`. Caller must manually cast: `(UserDto) cacheService.get(...)`. If someone accidentally casts to `(PatientDto)`, the application crashes in production with `ClassCastException`! | **100% Compile-Time Safe**: The Java compiler automatically infers and verifies type `T`. No manual casting is ever required (`UserDto user = cacheService.get(...)`). Compile errors catch any type mismatch! |
| **Code Reusability** | **Severe Code Duplication**: Developers are forced to write separate duplicate methods for every single entity in the application (`getUserProfileWithLock()`, `getPatientProfileWithLock()`, `getDoctorProfileWithLock()`). | **Zero Duplication (DRY Principle)**: A single generic method handles Redis stampede locking for ALL 30 APIs across the entire hospital system! |
| **Deferred DB Execution** | **Eager Execution Flaw**: Database queries run even when cache hits occur, wasting database CPU cycles. | **Lazy Execution (`Supplier<T>`)**: The database query lambda is only executed if a Cache Miss occurs inside the mutex lock! |
---

# 🔐 SECTION 3: API 6 - `POST /api/v1/patients` (Register / Update Patient Profile)

---

## 1. End-to-End Request & Response Specification

### **HTTP Request**
- **Method**: `POST`
- **Path**: `http://localhost:8080/api/v1/patients` (routed via API Gateway to `patient-doctor-service` at `http://localhost:8082`)
- **Headers**:
  ```http
  Content-Type: application/json
  ```
- **Request Body JSON Payload**:
  ```json
  {
    "userId": 101,
    "fullName": "Sarah Jenkins",
    "dateOfBirth": "1995-05-20",
    "gender": "FEMALE",
    "bloodGroup": "O_POSITIVE",
    "phoneNumber": "555-987-6543",
    "address": "742 Evergreen Terrace, Springfield",
    "emergencyContact": "555-123-4567"
  }
  ```

---

### **HTTP Response (Success - 200 OK)**
- **Headers**: `Content-Type: application/json`
- **Response Body JSON Payload**:
  ```json
  {
    "success": true,
    "message": "Patient profile saved successfully",
    "data": {
      "id": 1,
      "userId": 101,
      "fullName": "Sarah Jenkins",
      "dateOfBirth": "1995-05-20",
      "gender": "FEMALE",
      "bloodGroup": "O_POSITIVE",
      "phoneNumber": "555-987-6543",
      "address": "742 Evergreen Terrace, Springfield",
      "emergencyContact": "555-123-4567",
      "createdAt": "2026-09-15T00:05:00.456"
    },
    "timestamp": "2026-09-15T00:05:00.456"
  }
  ```

---

## 2. PlantUML Sequence Diagram (Architecture Flow)

```plantuml
@startuml
autonumber
actor Client as "React Web App / auth-service"
participant GW as "Spring Cloud API Gateway (8080)"
participant CTRL as "PatientController (8082)"
participant SVC as "PatientDoctorService"
participant REPO as "PatientRepository"
participant ENTITY as "Patient JPA Entity"
database DB as "patient_db (MySQL 3307)"

Client -> GW: POST /api/v1/patients { userId: 101, fullName, ... }
GW -> CTRL: Forward HTTP Request to PatientController.savePatient()
CTRL -> SVC: createOrUpdatePatient(dto)
SVC -> REPO: findByUserId(101)
REPO -> DB: SELECT * FROM patients WHERE user_id = 101
DB --> REPO: Optional.empty() (New Patient Record)
SVC -> ENTITY: Patient.builder().userId(101).build()
SVC -> ENTITY: Mutate setters (setFullName, setGender, setBloodGroup, ...)
SVC -> REPO: save(patient)
note over ENTITY: JPA @PrePersist Event Callback Triggered
ENTITY -> ENTITY: onCreate() -> createdAt = LocalDateTime.now()
REPO -> DB: INSERT INTO patients (user_id, full_name, date_of_birth, gender, blood_group, created_at, ...)
DB --> REPO: Returns Saved Patient Entity (id = 1)
SVC --> CTRL: Return PatientDto
CTRL --> GW: 200 OK + ApiResponse<PatientDto>
GW --> Client: 200 OK JSON Response
@enduml
```

![Rendered PlantUML Diagram](images/day03_patient_save_sequence.png)


---

## 3. Database State Simulation

### **Database State Simulation (Before vs After API Execution)**

#### **BEFORE API Execution (`patient_db.patients` Table)**
*(Empty table or no patient profile linked to userId 101)*

---

#### **AFTER API Execution (`patient_db.patients` Table)**
| id | user_id | full_name | date_of_birth | gender | blood_group | phone_number | address | emergency_contact | created_at |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| **1** | **101** | **Sarah Jenkins** | **1995-05-20** | **FEMALE** | **O_POSITIVE** | **555-987-6543** | **742 Evergreen Terrace** | **555-123-4567** | **2026-09-15 00:05:00** |

> 🔗 **Cross-Service Foreign Key Link**: Column `user_id = 101` in `patient_db.patients` matches `id = 101` in `auth_db.users`! This achieves Database-per-Service Isolation while maintaining domain identity alignment.

---

## 4. Code Dissection & Deep-Dive Internal Mechanics Walkthrough

### **A. JPA Entity Class**: [`Patient.java`](file:///c:/Mamidi/2026/POC/hospital%20management/patient-doctor-service/src/main/java/com/hospital/patientdoctor/entity/Patient.java)

📌 **Purpose & Responsibility**:
Domain entity representing patient clinical records in `patient_db`. Uses `@PrePersist` JPA lifecycle callback to automatically assign audit creation timestamps.

```java
@Entity
@Table(name = "patients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String fullName;

    private LocalDate dateOfBirth;
    private String gender;
    private String bloodGroup;
    private String phoneNumber;
    private String address;
    private String emergencyContact;
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
```

🔬 **Deep Dive: Internal Mechanics & Execution Mechanics**:

#### **JPA `@PrePersist` Lifecycle Callback (`Lines 41-44`)**:
- 🔴 **BEFORE Execution**: `patient.getCreatedAt()` is `null`. The entity has been instantiated in memory via `Patient.builder()`.
- ⚙️ **EXECUTION UNDER THE HOOD**: When `patientRepository.save(patient)` is invoked, Hibernate's `DefaultPersistEventListener` receives the entity. Before constructing the SQL string, Hibernate's Event Listener infrastructure scans for methods annotated with `@PrePersist`. It executes `onCreate()` via reflection, setting `this.createdAt = LocalDateTime.now()`.
- 🟢 **AFTER Execution**: `createdAt` contains non-null timestamp (`2026-09-15T00:05:00`). Hibernate includes `created_at` in the SQL statement: `INSERT INTO patients (user_id, full_name, created_at, ...) VALUES (?, ?, ?, ...)`.

---

### **B. Service Layer**: [`PatientDoctorService.java`](file:///c:/Mamidi/2026/POC/hospital%20management/patient-doctor-service/src/main/java/com/hospital/patientdoctor/service/PatientDoctorService.java#L24-L38)

📌 **Purpose & Responsibility**:
Executes idempotent upsert logic: queries patient record by `userId`; if missing, instantiates new entity; populates fields; and persists to MySQL.

```java
24:     @Transactional
25:     public PatientDto createOrUpdatePatient(PatientDto dto) {
26:         Patient patient = patientRepository.findByUserId(dto.getUserId())
27:                 .orElse(Patient.builder().userId(dto.getUserId()).build());
28: 
29:         patient.setFullName(dto.getFullName());
30:         patient.setDateOfBirth(dto.getDateOfBirth());
31:         patient.setGender(dto.getGender());
32:         patient.setBloodGroup(dto.getBloodGroup());
33:         patient.setPhoneNumber(dto.getPhoneNumber());
34:         patient.setAddress(dto.getAddress());
35:         patient.setEmergencyContact(dto.getEmergencyContact());
36: 
37:         Patient saved = patientRepository.save(patient);
38:         return mapToPatientDto(saved);
39:     }
```

🔬 **Deep Dive: Internal Mechanics & Execution Mechanics**:
- `Line 26: patientRepository.findByUserId(...)`: Executes `SELECT * FROM patients WHERE user_id = 101`. If empty, `.orElse()` returns new `Patient` instance.
- `Lines 29-35: Field Population`: Mutates domain object properties.
- `Line 37: patientRepository.save(patient)`: Executes Hibernate `EntityManager.persist()` for new records (triggering `@PrePersist`) or `EntityManager.merge()` for existing records.

---

# 🧠 SECTION 4: Interview Questions & Code Answers

| Question | Candidate Answer for System Design Interviews |
| :--- | :--- |
| **Q1: What is a Cache Stampede (Thundering Herd) and how do you prevent it?** | *"A Cache Stampede occurs when a high-traffic cache key expires, causing hundreds of concurrent requests to experience a Cache Miss and simultaneously query the database. We solve this by implementing **Distributed Mutex Locking** using Redis `SETNX`. Only ONE thread acquires the lock to compute the database query and populate Redis, while all other threads spin-lock and wait for the cache key to be populated."* |
| **Q2: Why use a random UUID value when acquiring a Redis lock?** | *"Using a unique UUID lock value ensures safe lock release. When deleting the lock in the `finally` block, we verify that the lock value in Redis still matches our thread's UUID (`if (lockValue.equals(currentLockVal))`). This prevents a slow thread from accidentally deleting a lock acquired by a newer thread!"* |
| **Q3: How do JPA `@PrePersist` and `@PreUpdate` annotations work?** | *"JPA entity lifecycle callbacks allow hooks to execute automatically before database events. `@PrePersist` runs right before Hibernate generates the SQL `INSERT` statement, making it perfect for setting creation timestamps (`createdAt = LocalDateTime.now()`) or default entity audit states without cluttering service logic."* |

---

### 🚀 Summary Checklist for Day 3
- [x] Standard PlantUML (`@startuml ... @enduml`) code blocks used exclusively.
- [x] Rendered PlantUML PNG images embedded immediately below each diagram.
- [x] Side-by-Side Layman Analogy vs. Backend Developer Analogy Comparison completed.
- [x] Full request-to-response sequence diagrams generated for Redis Cache Stampede & Patient Save APIs.
- [x] Database & Redis state simulation (BEFORE vs AFTER execution) for MySQL tables & Redis key store completed.
- [x] Deep-Dive Internal Concept Breakdown with 🔴 BEFORE -> ⚙️ UNDER THE HOOD -> 🟢 AFTER execution state analysis for Redis Mutex `SETNX` & JPA `@PrePersist`.
