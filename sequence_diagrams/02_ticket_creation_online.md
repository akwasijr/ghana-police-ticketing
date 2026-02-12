# Ticket Creation (Online)

This document contains the sequence diagram for the complete ticket creation flow when the officer's handheld device has network connectivity.

---

## Online Ticket Issuance Flow

The officer progresses through a 4-step form before submitting the ticket to the API server for processing, storage, and receipt printing.

```mermaid
sequenceDiagram
    actor Officer
    participant App as Handheld App
    participant API as API Server
    participant DB as Database
    participant Storage as Storage Service
    participant Printer as Bluetooth Printer (via RawBT)

    Note over Officer,App: Step 1 - Vehicle & Driver Information

    Officer->>App: Enter vehicle details<br/>(plate number, make, model, color)
    Officer->>App: Enter driver details<br/>(name, license number, phone)
    App->>App: Validate required fields
    App-->>Officer: Proceed to Step 2

    Note over Officer,App: Step 2 - Select Violations

    App->>App: Load offence catalog<br/>(from local cache)
    Officer->>App: Select one or more violations<br/>from categorized list
    Officer->>App: Optionally set custom fine<br/>(within min/max range per offence)
    App->>App: Calculate running total
    App-->>Officer: Proceed to Step 3

    Note over Officer,App: Step 3 - Evidence & Location

    Officer->>App: Capture photos via device camera
    App->>App: Store photos as base64 / blob
    App->>App: Capture GPS coordinates<br/>(navigator.geolocation)
    Officer->>App: Add optional notes
    App-->>Officer: Proceed to Step 4

    Note over Officer,App: Step 4 - Review & Confirm

    App-->>Officer: Display full ticket summary<br/>(vehicle, driver, violations,<br/>total fine, photos, location)
    Officer->>App: Tap "Issue & Print"

    Note over App,API: Submission to Server

    App->>API: POST /api/tickets<br/>{ vehicle, driver, offences[],<br/>location: { lat, lng, address },<br/>notes, photos[] }

    API->>API: Validate all offence IDs<br/>exist in offence catalog
    API->>API: Validate custom fines are<br/>within allowed range per offence

    API->>API: Generate ticket number<br/>(GPS-2026-XXXXXX format)
    API->>API: Calculate totalFine =<br/>SUM(offence fines)
    API->>API: Set paymentDeadline =<br/>NOW() + 14 days
    API->>API: Generate unique payment reference

    API->>DB: INSERT INTO tickets<br/>{ ticketNumber, vehicleInfo, driverInfo,<br/>location, totalFine, paymentDeadline,<br/>paymentReference, officerId, status: 'unpaid' }
    DB-->>API: Ticket created (id)

    API->>DB: INSERT INTO ticket_offences<br/>(one row per selected offence)
    DB-->>API: Offences linked

    API->>DB: INSERT INTO ticket_photos<br/>(metadata + storage references)
    DB-->>API: Photos recorded

    API->>Storage: Upload photo files to storage
    Storage-->>API: Storage URLs returned

    API->>DB: UPDATE ticket_photos<br/>SET url = storage URLs
    DB-->>API: Updated

    API->>DB: INSERT INTO audit_logs<br/>{ action: 'ticket:create',<br/>performedBy: officerId,<br/>entityType: 'ticket', entityId }
    DB-->>API: Audit log created

    API->>API: Generate QR code<br/>(encodes payment URL with<br/>ticket reference)

    API-->>App: 201 Created<br/>{ ticket: { id, ticketNumber,<br/>totalFine, dueDate,<br/>paymentReference },<br/>printData: { qrCode,<br/>paymentInstructions } }

    Note over App,Printer: Receipt Generation & Printing

    App->>App: Show success screen<br/>with receipt preview
    App->>App: Format receipt data<br/>(ticket number, violations,<br/>total fine, due date,<br/>payment reference, QR code)

    App->>Printer: Send formatted receipt data<br/>(via RawBT Bluetooth bridge)
    Printer-->>Officer: Print physical ticket receipt

    Note over Officer: Officer hands receipt to driver
```
