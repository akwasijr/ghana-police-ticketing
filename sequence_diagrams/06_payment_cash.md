# Cash Payment at Station

This diagram illustrates the walk-in cash payment flow where a driver visits a police station to pay a ticket in person. The accountant searches for the ticket, collects cash, records the payment, and prints a receipt.

```mermaid
sequenceDiagram
    participant Driver
    participant Counter as Station Counter
    participant Accountant
    participant Dashboard
    participant API as API Server
    participant DB as Database
    participant Printer

    Driver->>Counter: Walk in with ticket/reference number
    Counter->>Accountant: Hand over ticket details

    Accountant->>Dashboard: Search ticket by number
    Dashboard->>API: GET /api/tickets/number/{ticketNumber}
    activate API
    API->>DB: Query ticket by ticketNumber
    DB-->>API: Ticket record

    alt Ticket not found
        API-->>Dashboard: 404 Ticket not found
        Dashboard-->>Accountant: Display "Ticket not found" error
        Accountant-->>Driver: Inform ticket not found, verify reference
    else Ticket found
        API-->>Dashboard: 200 Ticket details with amount due
        deactivate API
        Dashboard-->>Accountant: Display ticket details (offence, fine, status)

        alt Ticket already paid
            Note over Accountant: Ticket status shows 'paid'
            Accountant-->>Driver: Inform ticket is already paid
        else Ticket unpaid or overdue
            Note over Accountant: Verify amount due, collect cash from driver
            Accountant->>Driver: Confirm amount and collect cash
            Driver->>Accountant: Hand over cash payment

            Accountant->>Dashboard: Click "Record Cash Payment"
            Dashboard->>API: POST /api/payments/cash { ticketId, amount, payerName, payerPhone, notes }
            activate API

            API->>DB: Validate ticket is unpaid/overdue
            DB-->>API: Ticket status confirmed

            API->>DB: CREATE payment (method: 'cash', status: 'completed', completedAt: now)
            DB-->>API: Payment created

            API->>DB: UPDATE ticket status = 'paid', set paidAt, paidAmount
            DB-->>API: Ticket updated

            API->>DB: Generate receipt number
            DB-->>API: Receipt number generated

            API->>DB: INSERT audit_log (payment:cash, recordedBy: accountantId)
            DB-->>API: Audit log inserted

            API-->>Dashboard: 201 Payment with receipt details { paymentId, receiptNumber, amount, paidAt }
            deactivate API

            Dashboard-->>Accountant: Display receipt (receiptNumber, amount, date, ticket details)

            Accountant->>Printer: Print receipt for driver
            Printer-->>Accountant: Receipt printed

            Accountant->>Driver: Hand over printed receipt
            Note over Driver: Driver leaves with receipt as proof of payment
        end
    end
```
