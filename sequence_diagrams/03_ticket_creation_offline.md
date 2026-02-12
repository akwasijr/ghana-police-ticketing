# Ticket Creation (Offline)

This document contains the sequence diagram for ticket creation when the officer's handheld device has no network connectivity. Tickets are stored locally in IndexedDB and queued for sync when connectivity is restored.

---

## Offline Ticket Issuance Flow

The officer completes the same 4-step form as the online flow, but data is persisted locally with a sync queue entry for later synchronization.

```mermaid
sequenceDiagram
    actor Officer
    participant App as Handheld App
    participant IDB as IndexedDB
    participant Printer as Bluetooth Printer (via RawBT)

    Note over Officer,App: Step 1-4: Same form flow as online

    Officer->>App: Complete 4-step ticket form<br/>(vehicle, driver, violations,<br/>photos, location, notes)
    Officer->>App: Tap "Issue & Print"

    Note over App: Network Detection

    App->>App: Check navigator.onLine === false
    App->>App: Confirm offline mode

    Note over App,IDB: Local Ticket Storage

    App->>App: Generate client-side UUID<br/>(crypto.randomUUID)
    App->>App: Build ticket object with<br/>clientCreatedId = UUID,<br/>status = 'pending_sync',<br/>createdAt = NOW()

    App->>IDB: Store ticket in 'tickets' object store<br/>{ clientCreatedId, vehicleInfo, driverInfo,<br/>offences[], location, notes,<br/>syncStatus: 'pending',<br/>createdAt, officerId }
    IDB-->>App: Ticket stored locally

    Note over App,IDB: Photo Storage

    App->>IDB: Store each photo in 'photos' object store<br/>{ id, ticketClientId, blob/base64,<br/>isSynced: false, capturedAt }
    IDB-->>App: Photos stored locally

    Note over App,IDB: Sync Queue Entries

    App->>IDB: Add to 'sync_queue'<br/>{ id, operation: 'create',<br/>entityType: 'ticket',<br/>entityId: clientCreatedId,<br/>priority: 1,<br/>retryCount: 0,<br/>createdAt: NOW() }
    IDB-->>App: Ticket sync entry queued

    App->>IDB: Add photo entries to 'sync_queue'<br/>{ id, operation: 'upload',<br/>entityType: 'photo',<br/>entityId: photoId,<br/>parentEntityId: clientCreatedId,<br/>priority: 3,<br/>retryCount: 0,<br/>createdAt: NOW() }
    IDB-->>App: Photo sync entries queued

    Note over App,Printer: User Feedback & Receipt Printing

    App-->>Officer: Show success screen with<br/>"Pending Sync" badge indicator
    App->>App: Update offline ticket count<br/>in sync status bar

    App->>App: Format receipt data locally<br/>(placeholder ticket number:<br/>"OFFLINE-{UUID short}",<br/>violations, total fine,<br/>note about pending confirmation)

    App->>Printer: Send formatted receipt data<br/>(via RawBT Bluetooth bridge)
    Printer-->>Officer: Print physical ticket receipt<br/>(marked as provisional)

    Note over Officer: Officer hands provisional<br/>receipt to driver

    Note over App: When device regains connectivity,<br/>the Offline Sync Flow (04) takes over<br/>to synchronize all pending items.
```
