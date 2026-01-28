# 🏥 OPD Token Allocation Engine

## 📌 Overview

The **OPD Token Allocation Engine** is a backend system designed to manage outpatient department (OPD) appointments in hospitals.  
It supports **elastic capacity management**, **priority-based allocation**, and **real-world operational variability** such as cancellations, no-shows, and emergency insertions.

The system is implemented using **Node.js, TypeScript, PostgreSQL, Prisma ORM, and routing-controllers**, following clean architecture and event-driven principles.

---

## 🎯 Problem Statement

Doctors operate in **fixed OPD time slots** (e.g., 9–10, 10–11).  
Each slot has a **hard maximum capacity**, but patient tokens may originate from multiple sources:

- Online booking
- Walk-in OPD desk
- Paid priority patients
- Follow-up patients
- Emergency patients

The system must:

- Enforce **hard per-slot capacity limits**
- Dynamically reallocate tokens when conditions change
- Prioritize between different token sources
- Handle cancellations, no-shows, and emergency additions
- Remain deterministic, auditable, and safe under concurrency

---

## 🧠 Key Design Principles

### 1. Slot vs Token Separation
- A **slot** represents a fixed doctor time window.
- **Tokens** represent individual patient visits within that slot.
- Example:  
  A 1-hour slot can contain 5–6 tokens, each roughly representing a 10-minute consultation.

### 2. Hard Capacity with Elastic Behavior
- Slot capacity is **never exceeded**.
- Elasticity is achieved via:
  - Waitlisting
  - Token displacement
  - Promotion on cancellation or no-show

### 3. Deterministic Allocation
- Given the same state, the system always produces the same allocation.
- No randomness is involved.

### 4. Event Sourcing
- Every state change is recorded as an **event**.
- This enables auditability, debugging, and future analytics.

---

## 🗂️ System Architecture
Controller Layer (API)
↓
Service Layer (Allocation Logic)
↓
Repository Layer (DB Access)
↓
PostgreSQL (Single Source of Truth)

## 🗄️ Database Schema

The schema is designed to:

- Separate **Doctor**, **Patient**, and **Employee** responsibilities
- Maintain slot-based capacity control
- Track token lifecycle and priority
- Capture all state changes using event sourcing

### 📷 Schema Diagram

<!-- ![OPD Token Allocation Schema](docs/opd-schema.png) -->

## 🧱 Core Entities

### Doctor
- Owns OPD slots  
- Can create follow-up tokens  

### Patient
- Identity-only entity  
- Does not authenticate  
- Tokens are created on behalf of patients  

### Employee
- Hospital staff  
- Can create walk-in and emergency tokens  

### OPD Slot
- Fixed time window  
- Hard capacity  
- Contains multiple tokens  

### Token
- Represents a patient visit  
- Contains source, priority, status, and sequence order  

### Event
- Append-only log  
- Captures every state transition  

---

## 🔁 Token Lifecycle

REQUESTED
↓
CONFIRMED ←→ WAITLISTED
↓
IN_PROGRESS
↓
COMPLETED / CANCELLED / NO_SHOW


---

## 🧮 Priority Model

Priority is calculated using a **pure deterministic function**.

### Priority Factors (in order)
1. Emergency (absolute override)  
2. Payment status  
3. Token source  
4. FIFO order (creation time)  

### Example Priority Weights

| Condition        | Score |
|------------------|-------|
| Emergency        | +1000 |
| Paid patient    | +300  |
| Follow-up       | +200  |
| Walk-in         | +100  |
| Online          | +50   |

> Higher score = higher priority  
> Ties are resolved using request time (FIFO)

---

## ⚙️ Core Algorithms

### 1️⃣ Allocate Token
1. Start transaction  
2. Lock OPD slot  
3. Calculate priority  
4. Check confirmed token count  
5. Decision:
   - Capacity available → **CONFIRM**
   - Slot full:
     - Higher priority → **DISPLACE lowest**
     - Otherwise → **WAITLIST**
6. Assign sequence number  
7. Emit events  
8. Commit transaction  

---

### 2️⃣ Cancel Token
- Mark token as **CANCELLED**  
- Free capacity  
- Promote next waitlisted token  
- Reassign sequence numbers  

---

### 3️⃣ Handle No-Show
- Mark token as **NO_SHOW**  
- Free capacity  
- Promote from waitlist  

---

### 4️⃣ Emergency Token Insertion
- Emergency tokens are **always accommodated**  
- Lowest-priority confirmed token is displaced if required  
- Minimal disruption strategy  

---

### 5️⃣ Promote from Waitlist
- Triggered when capacity becomes available  
- Highest-priority waitlisted token is promoted  
- Sequence numbers are reassigned  

---

## 🔒 Concurrency & Safety

- Slot-level locking  
- Prisma transactions  
- Hard capacity invariant enforced at all times  
- No partial or inconsistent updates  

---

## 🌐 API Design

| Endpoint | Description |
|--------|------------|
| `POST /tokens` | Request / allocate token |
| `POST /tokens/:id/cancel` | Cancel token |
| `POST /tokens/:id/no-show` | Mark no-show |
| `POST /tokens/emergency` | Emergency token |
| `GET /tokens/slot/:slotId` | View slot tokens (simulation/debug) |

---

## 🧪 OPD Day Simulation

The system supports simulation with:
- At least **3 doctors**  
- Multiple slots per doctor  
- Mixed token sources  
- Cancellations, no-shows, and emergencies  

This demonstrates:
- Elastic reallocation  
- Fair prioritization  
- Stability under real-world changes  

---

## ⚠️ Edge Cases Handled

- Slot full at request time  
- Multiple same-priority tokens  
- Emergency insertion mid-slot  
- Cancellation after confirmation  
- No-show just before consultation  
- Concurrent token requests  

---

## ❌ Non-Goals (Explicit Trade-offs)

- Exact consultation timestamps  
- Patient authentication  
- Payment processing  
- Insurance logic  

These are intentionally excluded to keep the system focused and robust.

---

## 🚀 Technology Stack

- Node.js + TypeScript  
- PostgreSQL  
- Prisma ORM  
- routing-controllers  
- Inversify (Dependency Injection)  
- ES Modules (ESM)  

---

## 🏁 Conclusion

The OPD Token Allocation Engine demonstrates:
- Strong algorithmic reasoning  
- Real-world healthcare modeling  
- Clean architecture  
- Deterministic, auditable behavior  
- Practical engineering trade-offs  

The system is designed to be **correct, explainable, and extensible**, making it suitable for real-world hospital OPD workflows.
