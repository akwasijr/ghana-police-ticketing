# Objection/Dispute Lifecycle

This diagram illustrates the full objection flow from filing through review to resolution. It covers deadline validation, duplicate objection checks, admin review, and both approval and rejection outcomes.

## Part 1: Filing an Objection

```mermaid
sequenceDiagram
    participant Driver
    participant System as System (Portal/Station)
    participant API as API Server
    participant DB as Database
    participant Notification as Notification Service

    Driver->>System: File objection (via public portal or at station)
    System->>API: POST /api/objections { ticketId, reason, details, contactPhone, contactEmail, supportingDocuments }
    activate API

    API->>DB: Validate ticket exists
    DB-->>API: Ticket record (with issuedAt)

    API->>API: Check objection deadline (issuedAt + 7 days)

    alt Past deadline
        API-->>System: 400 { error: "Objection deadline has passed", deadline, issuedAt }
        System-->>Driver: Display "Objection period expired" message
    else Within deadline
        API->>DB: Check no active objection exists for this ticket
        DB-->>API: Existing objection check result

        alt Active objection already exists
            API-->>System: 409 { error: "An active objection already exists for this ticket" }
            System-->>Driver: Display "Duplicate objection" error
        else No active objection
            API->>DB: CREATE objection (status: 'pending', filedAt: now)
            DB-->>API: Objection created

            API->>DB: UPDATE ticket status = 'objection'
            DB-->>API: Ticket status updated

            API->>DB: INSERT audit_log (objection:filed)
            DB-->>API: Audit log inserted

            API-->>System: 201 { objectionId, ticketNumber, status: 'pending', reviewDeadline }
            deactivate API

            System-->>Driver: Display confirmation with objection reference number

            Note over Notification: Notification sent to station admin
            API->>Notification: Send notification (new objection pending review)
            Notification-->>API: Notification delivered
        end
    end
```

## Part 2: Admin Reviews Objection

```mermaid
sequenceDiagram
    participant Admin
    participant Dashboard
    participant API as API Server
    participant DB as Database

    Admin->>Dashboard: Navigate to Objections page, filter 'pending'
    Dashboard->>API: GET /api/objections?status=pending
    activate API
    API->>DB: Query objections where status = 'pending'
    DB-->>API: List of pending objections
    API-->>Dashboard: 200 { objections: [...], total, page }
    deactivate API

    Dashboard-->>Admin: Display list of pending objections

    Admin->>Dashboard: Select objection to review
    Dashboard->>API: GET /api/objections/{id}
    activate API
    API->>DB: Query objection with ticket details, evidence, attachments
    DB-->>API: Full objection record
    API-->>Dashboard: 200 { objection, ticket, evidence, attachments, driverInfo }
    deactivate API

    Dashboard-->>Admin: Display full objection details (reason, documents, ticket info)
    Note over Admin: Admin reviews evidence and supporting documents
```

## Part 3a: Objection Approved

```mermaid
sequenceDiagram
    participant Admin
    participant Dashboard
    participant API as API Server
    participant DB as Database
    participant Notification as Notification Service

    Note over Admin: After reviewing evidence, admin decides to approve

    Admin->>Dashboard: Click "Approve", enter review notes (optional: adjust fine)
    Dashboard->>API: POST /api/objections/{id}/review { decision: 'approved', reviewNotes, adjustedFine? }
    activate API

    API->>DB: UPDATE objection SET status = 'approved', reviewedBy, reviewedAt, reviewNotes
    DB-->>API: Objection updated

    alt Fine adjusted
        API->>DB: UPDATE ticket SET fineAmount = adjustedFine, status = 'unpaid'
        DB-->>API: Ticket fine adjusted
        Note over API: Ticket remains active with reduced fine
    else Ticket cancelled
        API->>DB: UPDATE ticket SET status = 'cancelled'
        DB-->>API: Ticket cancelled
    end

    API->>DB: INSERT audit_log (objection:approved, severity: 'warning', details)
    DB-->>API: Audit log inserted

    API-->>Dashboard: 200 { objection: updated, ticket: updated }
    deactivate API

    Dashboard-->>Admin: Display success "Objection approved"

    API->>Notification: Notify driver (objection approved, outcome)
    Notification-->>API: Notification sent
    Note over Notification: Driver notified via SMS/email of approval
```

## Part 3b: Objection Rejected

```mermaid
sequenceDiagram
    participant Admin
    participant Dashboard
    participant API as API Server
    participant DB as Database
    participant Notification as Notification Service

    Note over Admin: After reviewing evidence, admin decides to reject

    Admin->>Dashboard: Click "Reject", enter review notes
    Dashboard->>API: POST /api/objections/{id}/review { decision: 'rejected', reviewNotes }
    activate API

    API->>DB: UPDATE objection SET status = 'rejected', reviewedBy, reviewedAt, reviewNotes
    DB-->>API: Objection updated

    API->>DB: UPDATE ticket SET status = 'unpaid' or 'overdue' (revert to previous status)
    DB-->>API: Ticket status reverted

    API->>DB: INSERT audit_log (objection:rejected)
    DB-->>API: Audit log inserted

    API-->>Dashboard: 200 { objection: updated, ticket: updated }
    deactivate API

    Dashboard-->>Admin: Display "Objection rejected"

    API->>Notification: Notify driver (objection rejected, reason, payment deadline)
    Notification-->>API: Notification sent
    Note over Notification: Driver notified of rejection with instructions to pay
```
