---
name: api-masterclass
description: Standard operating procedure and template for generating daily API-driven System Design & Spring Boot masterclass study documents with layman analogies, developer analogies, PlantUML sequence & class diagrams, database state simulations, and exact code line links.
---

# API Masterclass Learning Document Generation Skill

This skill defines the mandatory structural checklist and template for creating every daily learning document in the **15-Day System Design & Microservices Masterclass** series (`docs/learning_series/Day_XX_...md`).

---

## Mandatory Structural Checklist

Every daily learning document MUST contain all of the following sections in exact order for both APIs assigned to that day:

### 1. 🐣 Layman Analogy vs. Backend Developer Analogy Comparison
For every major concept, annotation, or pattern introduced in the API, create a side-by-side comparison:
- **Layman Analogy**: Real-world non-technical analogy.
- **Backend Developer Analogy & Technical Definition**: High-level engineering definition, design pattern name, and technical execution details.

### 2. 🌐 End-to-End Request -> Response Flow
For each API endpoint:
- **HTTP Method & Full Path**: (e.g. `POST /api/v1/auth/register`).
- **HTTP Request Headers & Body JSON Payload**: Full JSON sample payload.
- **HTTP Response Headers, Status Code & Body JSON Payload**: Full JSON response sample (`201 Created` or `200 OK`).

### 3. 📊 PlantUML Sequence & Class Diagrams
All UML diagrams MUST be formatted using standard **PlantUML syntax** (`@startuml ... @enduml`):
- **PlantUML Sequence Diagram** (`@startuml ... @enduml`): Tracing Client -> API Gateway -> Security Filter -> Controller -> Service -> Repository -> Database / Service.
- **PlantUML Class Diagram** (`@startuml ... @enduml`): Showing JPA Entity relationships (`User 1 <-- 0..1 RefreshToken : user_id`).
- **Rendered Image Embedding**: Immediately below EVERY PlantUML code block, render and embed the diagram as a high-resolution PNG image (`![Rendered PlantUML Diagram](images/dayXX_...png)`) saved in `docs/learning_series/images/` so the user never has to render diagrams manually.


### 4. 🗄️ Database Entity Relationships & Table Row State Simulation
- **Entity Relationship Explanation**: Detailed breakdown of JPA annotations (`@Entity`, `@Table`, `@Id`, `@OneToOne`, `@JoinColumn`).
- **BEFORE API Execution Table State**: Markdown table showing existing rows in database tables.
- **AFTER API Execution Table State**: Markdown table showing newly inserted/updated rows.

### 5. 🔍 Code Line Dissection & Deep-Dive Internal Mechanics
For EVERY Java code block (DTO, Controller, Service, Repository, Redis/Security Provider):
- **Clickable File Header & Line Numbers**: Include file link (`[Controller.java](file:///path/to/file#L20-L35)`).
- **📌 Purpose & Responsibility (BEFORE Code Block)**: Comprehensive paragraph detailing what the class/method does and its high-level role in the system architecture.
- **🔬 Deep-Dive Internal Mechanics (AFTER Code Block)**: For every major line or technology encountered (Redis blacklisting, Spring Data JPA, Hibernate L1 Persistence Context & Dirty Checking, Transaction Boundaries, Security Filters), provide a 3-stage breakdown:
  1. 🔴 **BEFORE Execution**: Exact state of memory, database tables, Redis key stores, and JVM heap before executing the line.
  2. ⚙️ **EXECUTION UNDER THE HOOD**: Low-level execution details — exact protocol commands (`SETEX key ttl value`), SQL queries (`UPDATE ...`), JDBC `PreparedStatement` execution, Hibernate dirty check comparison, Jackson serialization, or AOP proxy interceptors.
  3. 🟢 **AFTER Execution**: Exact state changes in memory, database rows, and Redis keys, along with instant security / architectural impacts.
- **System Design Interview Q&A**: 3-4 interviewer-style questions and bulletproof candidate answers.

---

## 🛠️ Code Block Syntax & Formatting Guidelines

All code, payloads, and diagram blocks MUST be wrapped in standard markdown triple backtick fences with explicit language identifiers to ensure clean syntax highlighting:
- **Java Snippets**: Use ` ```java ... ``` `
- **JSON Payloads**: Use ` ```json ... ``` `
- **HTTP Headers & Request Info**: Use ` ```http ... ``` `
- **PlantUML Diagrams**: Use ` ```plantuml ... ``` `
- **SQL Queries**: Use ` ```sql ... ``` `
- **Strict Rule**: NEVER output raw source code, JSON objects, or HTTP headers as unformatted plain text.
- **Explanations Required**: Every code snippet MUST be accompanied by a **📌 Purpose & Responsibility** intro preceding the block and a **🔬 Detailed Line-by-Line & Annotation Breakdown** following the block.


