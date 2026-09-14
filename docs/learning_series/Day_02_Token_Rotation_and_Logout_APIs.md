# 📚 Hands-On API Masterclass - Day 2

## Module: Token Security, Refresh Rotation & Logout Revocation (`auth-service`)

Welcome to **Day 2**! Today we dissect the two token lifecycle maintenance endpoints that complete our security architecture:
1. `POST /api/v1/auth/refresh` — Refresh Token Rotation & New Access Token Generation
2. `POST /api/v1/auth/logout` — Stateless Token Revocation & Redis Blacklist Cleanup

---

# 🐣 SECTION 1: Layman Analogy vs. Backend Developer Analogy

Before inspecting the Java code, review how each core concept translates from real-world non-technical analogies into concrete backend software engineering terms:

| Concept / Technology | 🐣 Layman Analogy | 💻 Backend Developer Analogy & Technical Definition |
| :--- | :--- | :--- |
| **Refresh Token Rotation** | Exchanging an expiring VIP wristband at the customer service desk using your 7-day membership card. The clerk checks that your card is valid and hands you a fresh wristband. | Requesting a new 15-minute JWT Access Token by presenting a valid database-backed Refresh Token UUID string (`POST /api/v1/auth/refresh`) without requiring user password re-entry. |
| **Token Revocation & Logout** | Canceling your lost hotel key card at the front desk. Even if someone finds your old card, the electronic doors will reject it immediately. | Explicitly invalidating an active session by marking the `refresh_tokens.revoked` column to `1 (true)` in MySQL and pushing the active JWT Access Token hash into a Redis Blacklist (`blacklist:<jwt>`) with a 15-minute TTL. |
| **Stateless vs Stateful Token Hybrid** | A 15-minute amusement park ride pass (**Stateless Access Token**) verified on-the-spot by ride operators without checking the computer system, paired with a central membership file (**Stateful Refresh Token**) checked only when getting new passes. | A hybrid security architecture where Access Tokens are verified locally in memory by API Gateway (`JwtAuthenticationFilter`) without DB latency, while Refresh Tokens are persisted in MySQL (`auth_db.refresh_tokens`) for stateful revocation control. |
| **Redis Token Blacklisting** | A security guard at an airport holding a printed "No Fly List" of revoked badges. If your badge is on the list, you are turned away instantly. | An in-memory distributed cache store (`RedisTemplate`) containing revoked JWT signatures. The API Gateway checks Redis key existence (`EXISTS blacklist:<jwt>`) before routing incoming requests to downstream microservices. |
| **Hibernate L1 Cache & Dirty Checking** | A clerk taking notes on a notepad while talking to a client. Only when the conversation ends does the clerk officially type all changes into the central database ledger. | Hibernate's First-Level Cache (Persistence Context bound to current `@Transactional` thread). When entity getters/setters mutate state (e.g. `rt.setRevoked(true)`), Hibernate automatically detects changes during flush time and generates optimized SQL `UPDATE` statements without manual SQL execution. |

---

# 🌐 SECTION 2: API 3 - `POST /api/v1/auth/refresh` (Token Refresh Rotation)

---

## 1. End-to-End Request & Response Specification

### **HTTP Request**
- **Method**: `POST`
- **Path**: `http://localhost:8080/api/v1/auth/refresh` (routed via API Gateway to `auth-service` at `http://localhost:8081`)
- **Headers**:
  ```http
  Content-Type: application/json
  ```
- **Request Body JSON Payload**:
  ```json
  {
    "refreshToken": "4a71b123-9876-4abc-8910-def123456789"
  }
  ```

---

### **HTTP Response (Success - 200 OK)**
- **Headers**: `Content-Type: application/json`
- **Response Body JSON Payload**:
  ```json
  {
    "success": true,
    "message": "Token refreshed successfully",
    "data": {
      "accessToken": "eyJhbGciOiJIUzUxMiJ9.eyJyb2xlcyI6IlJPTEVfUEFUSUVOVCIsInVzZXJJZCI6MTAxLCJlbWFpbCI6InNhcmFoQGV4YW1wbGUuY29tIiwic3ViIjoic2FyYWhfcGF0aWVudCIsImlhdCI6MTc4OTIzNTI4NiwiZXhwIjoxNzg5MjM2MTg2fQ.zY93mM1...",
      "refreshToken": "4a71b123-9876-4abc-8910-def123456789",
      "tokenType": "Bearer",
      "userId": 101,
      "username": "sarah_patient",
      "email": "sarah@example.com",
      "fullName": "Sarah Jenkins",
      "role": "ROLE_PATIENT"
    },
    "timestamp": "2026-09-14T23:40:00.123"
  }
  ```

---

## 2. PlantUML Sequence Diagram (Architecture Flow)

```plantuml
@startuml
autonumber
actor Client as "React Web App"
participant GW as "Spring Cloud API Gateway (8080)"
participant CTRL as "AuthController (8081)"
participant SVC as "AuthService"
participant REF_REPO as "RefreshTokenRepository"
database DB as "auth_db (MySQL 3307)"
participant JWT as "JwtTokenProvider"

Client -> GW: POST /api/v1/auth/refresh { refreshToken }
GW -> CTRL: Forward HTTP Request to AuthController.refreshToken()
CTRL -> CTRL: @Valid checks RefreshTokenRequest body
CTRL -> SVC: authService.refreshToken(request)
SVC -> REF_REPO: findByToken("4a71b123-9876-4abc-8910-def123456789")
REF_REPO -> DB: SELECT * FROM refresh_tokens WHERE token = '4a71b123...'
DB --> REF_REPO: Returns RefreshToken Entity Record
SVC -> SVC: Validate: !isRevoked() && expiryDate > Instant.now()
SVC -> JWT: generateAccessToken(user)
JWT --> SVC: Returns New Signed Access Token String (15-Min Exp)
SVC --> CTRL: Return AuthResponse (new AccessToken + existing RefreshToken)
CTRL --> GW: 200 OK + ApiResponse<AuthResponse>
GW --> Client: 200 OK JSON Response
@enduml
```

![Rendered PlantUML Diagram](images/day02_refresh_sequence.png)


---

## 3. Database Entity Relationship & Table Row Simulation

### **Database State Simulation (Before vs After API Execution)**

#### **BEFORE Refresh Execution (`auth_db.refresh_tokens` Table)**
| id | token | user_id | expiry_date | revoked |
|:---|:---|:---|:---|:---|
| 1 | `4a71b123-9876-4abc-8910-def123456789` | 101 | 2026-09-21 23:26:10 | 0 (false) |

---

#### **AFTER Refresh Execution (`auth_db.refresh_tokens` Table)**
| id | token | user_id | expiry_date | revoked |
|:---|:---|:---|:---|:---|
| 1 | `4a71b123-9876-4abc-8910-def123456789` | 101 | 2026-09-21 23:26:10 | 0 (false) |

> ℹ️ **State Note**: The refresh token row remains valid (`revoked = 0`), but a brand-new 15-minute Access Token string is signed and returned in the HTTP JSON response!

---

## 4. Code Dissection & Deep-Dive Internal Concept Walkthrough

### **A. DTO Class**: [`RefreshTokenRequest.java`](file:///c:/Mamidi/2026/POC/hospital%20management/auth-service/src/main/java/com/hospital/auth/dto/RefreshTokenRequest.java)

📌 **Purpose & Responsibility**:
Defines the client request contract for token renewal. Ensures the incoming JSON request contains a non-blank `refreshToken` parameter before executing database queries.

```java
public class RefreshTokenRequest {

    @NotBlank(message = "Refresh token is required")
    private String refreshToken;

    public RefreshTokenRequest() {}

    public RefreshTokenRequest(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }
}
```

🔬 **Deep Dive: Internal Mechanics & Execution Mechanics**:
- `@NotBlank(message = "Refresh token is required")`:
  - 🔴 **BEFORE Execution**: Raw HTTP JSON body payload (`{"refreshToken": ""}`) arrives at Spring MVC `DispatcherServlet`.
  - ⚙️ **EXECUTION UNDER THE HOOD**: Spring's `RequestResponseBodyMethodProcessor` uses Jackson `ObjectMapper` to deserialize JSON into a `RefreshTokenRequest` instance. Before method invocation, Spring's `ValidatorImpl` (Jakarta Validation / Hibernate Validator engine) scans field annotations. It evaluates `trimmedStringLength > 0`. Because the string is blank, it creates a `FieldError` object containing default message `"Refresh token is required"`.
  - 🟢 **AFTER Execution**: Spring throws `MethodArgumentNotValidException`. The `@RestControllerAdvice` (`GlobalExceptionHandler`) intercepts the exception, bypasses controller/service execution entirely, and immediately responds with HTTP `400 Bad Request`.

---

### **B. Controller Layer**: [`AuthController.java`](file:///c:/Mamidi/2026/POC/hospital%20management/auth-service/src/main/java/com/hospital/auth/controller/AuthController.java#L37-L42)

📌 **Purpose & Responsibility**:
Exposes the token refresh endpoint `POST /api/v1/auth/refresh`. Validates request payload and delegates token renewal logic to `AuthService`.

```java
37:     @PostMapping("/refresh")
38:     @Operation(summary = "Issue new Access token using a valid Refresh token")
39:     public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
40:         AuthResponse response = authService.refreshToken(request);
41:         return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", response));
42:     }
```

🔬 **Deep Dive: Internal Mechanics & Execution Mechanics**:
- `Line 37: @PostMapping("/refresh")`:
  - ⚙️ **EXECUTION UNDER THE HOOD**: On application startup, Spring MVC's `RequestMappingHandlerMapping` scans all `@RestController` classes, building an in-memory routing trie map: `POST /api/v1/auth/refresh -> AuthController.refreshToken()`.
- `Line 40: authService.refreshToken(request)`:
  - ⚙️ **EXECUTION UNDER THE HOOD**: Spring injects a CGLIB dynamic proxy instance for `AuthService`. Calling this method routes through Spring's `TransactionInterceptor` AOP advice, which requests a JDBC `Connection` from HikariCP connection pool, binds it to the current thread via `TransactionSynchronizationManager`, and sets `autoCommit = false`.

---

### **C. Service Layer**: [`AuthService.java`](file:///c:/Mamidi/2026/POC/hospital%20management/auth-service/src/main/java/com/hospital/auth/service/AuthService.java#L112-L133)

📌 **Purpose & Responsibility**:
Looks up the refresh token in `auth_db.refresh_tokens`, validates that the token is neither revoked nor expired, and invokes `JwtTokenProvider` to generate a fresh 15-minute Access Token.

```java
112:     @Transactional
113:     public AuthResponse refreshToken(RefreshTokenRequest request) {
114:         RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
115:                 .orElseThrow(() -> new IllegalArgumentException("Refresh token not found"));
116: 
117:         if (refreshToken.isRevoked() || refreshToken.getExpiryDate().isBefore(Instant.now())) {
118:             throw new IllegalArgumentException("Refresh token was expired or revoked");
119:         }
120: 
121:         User user = refreshToken.getUser();
122:         String newAccessToken = jwtTokenProvider.generateAccessToken(user);
123: 
124:         return AuthResponse.builder()
125:                 .accessToken(newAccessToken)
126:                 .refreshToken(refreshToken.getToken())
127:                 .userId(user.getId())
128:                 .username(user.getUsername())
129:                 .email(user.getEmail())
130:                 .fullName(user.getFullName())
131:                 .role(user.getRole().name())
132:                 .build();
133:     }
```

🔬 **Deep Dive: Internal Mechanics & Execution Mechanics**:

#### **1. Spring Data JPA Database Query (`Line 114`)**:
- 🔴 **BEFORE Execution**: The JVM thread has an open database connection bound to its thread context. Hibernate First-Level Cache (L1 Persistence Context) is empty for this query.
- ⚙️ **EXECUTION UNDER THE HOOD**:
  1. `refreshTokenRepository` (a Spring Data JPA proxy generated via `SimpleJpaRepository`) derives JPQL from method name `findByToken`: `SELECT r FROM RefreshToken r WHERE r.token = :token`.
  2. Hibernate translates JPQL into MySQL dialect SQL: `SELECT r.id, r.token, r.expiry_date, r.revoked, r.user_id FROM refresh_tokens r WHERE r.token = ?`.
  3. Prepares JDBC `PreparedStatement`, binds parameter `"4a71b123-9876..."`, and executes on MySQL (port 3307).
  4. Hydrates SQL result set into a managed Java `RefreshToken` entity instance and places it into Hibernate's L1 Cache snapshot map (`PersistenceContext`).
- 🟢 **AFTER Execution**: The `RefreshToken` object is in `MANAGED` state in Hibernate L1 cache, with direct object references to associated `User` entity via JPA `@OneToOne` mapping.

#### **2. Security Expiry & Revocation Validation (`Lines 117-119`)**:
- ⚙️ **EXECUTION UNDER THE HOOD**: Evaluates two boolean expressions:
  1. `refreshToken.isRevoked()`: Reads boolean flag from memory (`revoked == true`).
  2. `refreshToken.getExpiryDate().isBefore(Instant.now())`: Compares Java `Instant` UTC epoch timestamps against system UTC clock. If `expiryDate` (e.g. `2026-09-21`) is before `now` (e.g. `2026-09-22`), returns `true`.
  3. If either check fails, throws `IllegalArgumentException("Refresh token was expired or revoked")`. Transaction rolls back immediately.

---

# 🔐 SECTION 3: API 4 - `POST /api/v1/auth/logout` (Stateless Token Revocation)

---

## 1. End-to-End Request & Response Specification

### **HTTP Request**
- **Method**: `POST`
- **Path**: `http://localhost:8080/api/v1/auth/logout?refreshToken=4a71b123-9876-4abc-8910-def123456789`
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
    "message": "Logout successful",
    "data": null,
    "timestamp": "2026-09-14T23:42:00.456"
  }
  ```

---

## 2. PlantUML Sequence Diagram (Architecture Flow)

```plantuml
@startuml
autonumber
actor Client as "React Web App"
participant GW as "Spring Cloud API Gateway (8080)"
participant CTRL as "AuthController (8081)"
participant SVC as "AuthService"
participant REDIS as "CacheStampedeService (Redis)"
participant REF_REPO as "RefreshTokenRepository"
database DB as "auth_db (MySQL 3307)"

Client -> GW: POST /api/v1/auth/logout (Header: Bearer JWT, Query: refreshToken)
GW -> CTRL: Forward HTTP Request to AuthController.logout()
CTRL -> SVC: authService.logout(authHeader, refreshTokenStr)
note over SVC, REDIS: Extract Access Token & Push to Redis Blacklist
SVC -> REDIS: blacklistToken(token, TTL=15 Min)
REDIS -> REDIS: SETEX "blacklist:<jwt>" 900 "revoked"
note over SVC, REF_REPO: Revoke Refresh Token in MySQL DB
SVC -> REF_REPO: findByToken("4a71b123-9876-4abc-8910-def123456789")
REF_REPO -> DB: SELECT * FROM refresh_tokens WHERE token = '4a71b123...'
DB --> REF_REPO: Returns RefreshToken Entity
SVC -> REF_REPO: rt.setRevoked(true) -> save(rt)
REF_REPO -> DB: UPDATE refresh_tokens SET revoked = 1 WHERE id = 1
DB --> REF_REPO: 1 Row Updated
SVC --> CTRL: Void Success Return
CTRL --> GW: 200 OK + ApiResponse.success("Logout successful", null)
GW --> Client: 200 OK JSON Response
@enduml
```

![Rendered PlantUML Diagram](images/day02_logout_sequence.png)


---

## 3. Database & Redis State Simulation

### **Database & Redis State Simulation (Before vs After Logout API Execution)**

#### **BEFORE Logout Execution (`auth_db.refresh_tokens` Table & Redis Key Store)**

##### **MySQL `auth_db.refresh_tokens` Table**:
| id | token | user_id | expiry_date | revoked |
|:---|:---|:---|:---|:---|
| 1 | `4a71b123-9876-4abc-8910-def123456789` | 101 | 2026-09-21 23:26:10 | **0 (false)** |

##### **Redis In-Memory Key Store**:
| Key | Value | TTL |
|:---|:---|:---|
| *(No key exists)* | — | — |

---

#### **AFTER Logout Execution (`auth_db.refresh_tokens` Table & Redis Key Store)**

##### **MySQL `auth_db.refresh_tokens` Table**:
| id | token | user_id | expiry_date | revoked |
|:---|:---|:---|:---|:---|
| 1 | `4a71b123-9876-4abc-8910-def123456789` | 101 | 2026-09-21 23:26:10 | **1 (true)** |

##### **Redis In-Memory Key Store**:
| Key | Value | TTL (Time-To-Live Expiration) |
|:---|:---|:---|
| `blacklist:eyJhbGciOiJIUzUxMiJ9...` | `"revoked"` | `900 seconds (15 minutes)` |

---

## 4. Code Dissection & Deep-Dive Internal Concept Walkthrough

### **A. Controller Layer**: [`AuthController.java`](file:///c:/Mamidi/2026/POC/hospital%20management/auth-service/src/main/java/com/hospital/auth/controller/AuthController.java#L44-L51)

📌 **Purpose & Responsibility**:
Exposes the logout endpoint `POST /api/v1/auth/logout`. Extracts the `Authorization` bearer token header and `refreshToken` query parameter, delegating revocation handling to `AuthService`.

```java
44:     @PostMapping("/logout")
45:     @Operation(summary = "Revoke tokens and logout user")
46:     public ResponseEntity<ApiResponse<Void>> logout(
47:             @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader,
48:             @RequestParam(value = "refreshToken", required = false) String refreshToken) {
49:         authService.logout(authHeader, refreshToken);
50:         return ResponseEntity.ok(ApiResponse.success("Logout successful", null));
51:     }
```

🔬 **Deep Dive: Internal Mechanics & Execution Mechanics**:
- `Line 47: @RequestHeader(...) String authHeader`:
  - ⚙️ **EXECUTION UNDER THE HOOD**: Spring MVC extracts header `Authorization: Bearer eyJhbGci...` from raw HTTP request packet and binds it to `authHeader`.
- `Line 48: @RequestParam(...) String refreshToken`:
  - ⚙️ **EXECUTION UNDER THE HOOD**: Spring extracts query parameter `?refreshToken=4a71b123...` from URL string.

---

### **B. Service Layer**: [`AuthService.java`](file:///c:/Mamidi/2026/POC/hospital%20management/auth-service/src/main/java/com/hospital/auth/service/AuthService.java#L135-L147)

📌 **Purpose & Responsibility**:
Executes token revocation logic by stripping the `Bearer ` prefix from the Access Token, saving it to Redis with a 15-minute TTL, and setting `revoked = true` on the `RefreshToken` DB entity.

```java
135:     @Transactional
136:     public void logout(String accessToken, String refreshTokenStr) {
137:         if (accessToken != null && accessToken.startsWith("Bearer ")) {
138:             String token = accessToken.substring(7);
139:             cacheStampedeService.blacklistToken(token, Duration.ofMinutes(15));
140:         }
141:         if (refreshTokenStr != null) {
142:             refreshTokenRepository.findByToken(refreshTokenStr).ifPresent(rt -> {
143:                 rt.setRevoked(true);
144:                 refreshTokenRepository.save(rt);
145:             });
146:         }
147:     }
```

🔬 **Deep Dive: Internal Mechanics & Execution Mechanics**:

#### **1. Access Token Extraction & Redis Blacklisting (`Lines 137-139`)**:

- 🔴 **BEFORE Executing Line 139**:
  - The JWT Access Token string `eyJhbGci...` is cryptographically valid. Any service parsing it locally would accept it because its internal 15-minute expiration timestamp has not elapsed.
  - The Redis key store has **no entry** for key `"blacklist:eyJhbGci..."`.
  
- ⚙️ **EXECUTION UNDER THE HOOD**:
  1. `accessToken.substring(7)` cuts off the first 7 characters (`"Bearer "`), isolating the raw JWT signature string in heap memory.
  2. Calls `cacheStampedeService.blacklistToken(token, Duration.ofMinutes(15))`.
  3. Inside `CacheStampedeService`, Spring's `StringRedisTemplate` formats key `"blacklist:" + token` and value `"revoked"`.
  4. `StringRedisTemplate` delegates to `Jedis` / `Lettuce` connection driver, serializing strings into UTF-8 byte arrays (`byte[]`).
  5. Driver sends binary Redis RESP2 Protocol command over TCP socket to Redis Server (port 6379):  
     `SETEX blacklist:eyJhbGci... 900 revoked`
  6. Redis Server receives command, inserts key into its primary hash table dictionary ($O(1)$ time complexity), and attaches a 900-second (15-minute) TTL ticker in its internal expiration dictionary.

- 🟢 **AFTER Executing Line 139**:
  - Redis contains key `"blacklist:eyJhbGci..."` set to value `"revoked"` with a 15-minute TTL.
  - **Instant Security Impact**: Whenever Spring Cloud API Gateway (`JwtAuthenticationFilter`) receives any request carrying this JWT Access Token, it executes Redis command `EXISTS blacklist:eyJhbGci...`. Redis responds with `1 (true)` in ~0.2ms. The API Gateway immediately aborts the request with `401 Unauthorized`, completely shielding downstream services!

---

#### **2. MySQL Refresh Token State Mutation & Dirty Checking (`Lines 142-145`)**:

- 🔴 **BEFORE Executing Line 143**:
  - Database row in `auth_db.refresh_tokens` has `revoked = 0 (false)`.
  - Hibernate L1 Cache contains managed `RefreshToken` entity loaded from DB with initial state snapshot: `[id=1, token="4a71b123...", revoked=false]`.

- ⚙️ **EXECUTION UNDER THE HOOD**:
  1. `rt.setRevoked(true)` mutates the Java object field in JVM heap memory.
  2. `refreshTokenRepository.save(rt)` is called (or method returns, triggering `@Transactional` transaction commit).
  3. Spring's `TransactionInterceptor` initiates transaction commit flush.
  4. Hibernate's `DefaultFlushEntityEventListener` triggers **Dirty Checking**: Hibernate compares the mutated entity fields against the initial loaded state snapshot stored in the L1 Persistence Context.
  5. Hibernate detects that field `revoked` changed from `false` to `true`.
  6. Hibernate dynamically constructs SQL `UPDATE` statement:  
     `UPDATE refresh_tokens SET revoked = 1, expiry_date = ?, token = ?, user_id = ? WHERE id = 1`
  7. Executes SQL via JDBC `PreparedStatement` on MySQL port 3307 and commits the JDBC transaction.

- 🟢 **AFTER Executing Line 145**:
  - Row in MySQL table `auth_db.refresh_tokens` has `revoked = 1 (true)`.
  - Any subsequent token refresh attempt using `POST /api/v1/auth/refresh` will query this row, evaluate `if (refreshToken.isRevoked())`, and throw `IllegalArgumentException("Refresh token was expired or revoked")`.

---

### **C. Cache & Blacklist Service**: [`CacheStampedeService.java`](file:///c:/Mamidi/2026/POC/hospital%20management/auth-service/src/main/java/com/hospital/auth/service/CacheStampedeService.java#L65-L75)

📌 **Purpose & Responsibility**:
Helper service interacting directly with Redis to store blacklisted token signatures and perform ultra-fast cache validation checks.

```java
public void blacklistToken(String token, Duration ttl) {
    String key = "blacklist:" + token;
    redisTemplate.opsForValue().set(key, "revoked", ttl);
}

public boolean isTokenBlacklisted(String token) {
    String key = "blacklist:" + token;
    return Boolean.TRUE.equals(redisTemplate.hasKey(key));
}
```

🔬 **Deep Dive: Internal Mechanics & Execution Mechanics**:
- `redisTemplate.opsForValue().set(key, "revoked", ttl)`: Executes Redis `SETEX` command setting key expiration atomically.
- `redisTemplate.hasKey(key)`: Executes Redis `EXISTS` check. Runs in $O(1)$ constant time!

---

# 🧠 SECTION 4: Interview Questions & Code Answers

| Question | Candidate Answer for System Design Interviews |
| :--- | :--- |
| **Q1: How do you handle instant Logout in a stateless JWT microservices architecture?** | *"Because JWT Access Tokens are stateless and self-contained, downstream services cannot invalidate them natively before expiration. We solve this by implementing a **Redis Token Blacklist**. On logout, the API Gateway or AuthService writes the token signature to Redis with a TTL equal to the token's remaining lifespan. The Gateway checks Redis before routing requests, turning a stateless token into an instantly revokable session."* |
| **Q2: Why use Refresh Token Rotation instead of a single static Refresh Token?** | *"Refresh Token Rotation ensures that whenever a Refresh Token is used to issue a new Access Token, a new Refresh Token is also issued (or invalidated). If an attacker steals a Refresh Token, using it will invalidate the victim's session, detecting token reuse and triggering an automatic security lockout."* |
| **Q3: Why set a short 15-minute TTL on Redis blacklisted keys?** | *"Since Access Tokens automatically expire after 15 minutes, any blacklisted token becomes harmless after 15 minutes anyway. Setting a 15-minute TTL on Redis blacklist keys ensures Redis memory stays small and never grows indefinitely."* |

---

### 🚀 Summary Checklist for Day 2
- [x] Standard PlantUML (`@startuml ... @enduml`) code blocks used exclusively.
- [x] Rendered PlantUML PNG images embedded immediately below each diagram.
- [x] Side-by-Side Layman Analogy vs. Backend Developer Analogy Comparison completed.
- [x] Full request-to-response sequence diagrams generated for Token Refresh & Logout APIs.
- [x] Database & Redis state simulation (BEFORE vs AFTER execution) for MySQL tables & Redis key store completed.
- [x] Deep-Dive Internal Concept Breakdown with 🔴 BEFORE -> ⚙️ UNDER THE HOOD -> 🟢 AFTER execution state analysis for Redis & Spring Data JPA.
