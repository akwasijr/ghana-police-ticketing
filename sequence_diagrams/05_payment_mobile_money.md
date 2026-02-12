# Mobile Money Payment Flow

This diagram illustrates the complete mobile money payment lifecycle, including initiating a payment from the dashboard, the MoMo provider interaction with the driver's phone, webhook callbacks, and alternate flows for failed payments.

```mermaid
sequenceDiagram
    participant Admin as Admin/Accountant
    participant Dashboard
    participant API as API Server
    participant DB as Database
    participant MoMo as MoMo Provider
    participant Driver as Driver (Phone)

    Admin->>Dashboard: Select unpaid ticket, click "Initiate Payment"
    Dashboard->>API: POST /api/payments/initiate { ticketId, method: "momo", phoneNumber: "+233..." }

    activate API
    API->>DB: Validate ticket exists, status is unpaid/overdue
    DB-->>API: Ticket record

    alt Ticket not found or already paid
        API-->>Dashboard: 400 Invalid ticket or already paid
        Dashboard-->>Admin: Display error message
    else Ticket valid
        API->>DB: CREATE payment record (status: pending)
        DB-->>API: Payment created

        API->>MoMo: Initiate payment request (amount, phone, reference)
        activate MoMo
        MoMo-->>API: Acknowledge (transaction pending, transactionId)
        deactivate MoMo

        API-->>Dashboard: 201 { paymentId, paymentReference, ussdCode: "*920*44#", instructions, expiresAt }
        deactivate API

        Dashboard-->>Admin: Display USSD code and instructions

        Note over Driver: Driver receives payment prompt on phone

        MoMo->>Driver: USSD prompt to approve payment
        activate Driver

        alt Driver approves payment
            Driver->>MoMo: Approve payment (enter PIN)
            deactivate Driver
            activate MoMo

            MoMo->>API: Webhook callback (transaction completed, transactionId, amount)
            deactivate MoMo
            activate API

            API->>DB: UPDATE payment status = 'completed', set completedAt
            API->>DB: UPDATE ticket status = 'paid', set paidAt, paidAmount
            API->>DB: Generate receipt number
            DB-->>API: Receipt number generated
            API->>DB: INSERT audit_log (payment:completed)
            deactivate API

            Note over Dashboard: Dashboard polls or receives push notification for status update

            Dashboard->>API: GET /api/payments/{paymentId}/status (polling)
            API-->>Dashboard: { status: 'completed', receiptNumber }
            Dashboard-->>Admin: Display payment success with receipt number

        else Driver declines or timeout
            Driver-->>MoMo: Decline / No response (timeout)
            deactivate Driver
            activate MoMo

            MoMo->>API: Webhook callback (transaction failed, reason: "declined" or "timeout")
            deactivate MoMo
            activate API

            API->>DB: UPDATE payment status = 'failed', set failureReason
            API->>DB: INSERT audit_log (payment:failed)
            deactivate API

            Note over Dashboard: Dashboard polls for status update

            Dashboard->>API: GET /api/payments/{paymentId}/status (polling)
            API-->>Dashboard: { status: 'failed', failureReason }
            Dashboard-->>Admin: Display payment failure with reason

        else Insufficient funds
            Driver->>MoMo: Approve payment (enter PIN)
            deactivate Driver
            activate MoMo

            MoMo->>API: Webhook callback (transaction failed, reason: "insufficient_funds")
            deactivate MoMo
            activate API

            API->>DB: UPDATE payment status = 'failed', set failureReason = 'insufficient_funds'
            API->>DB: INSERT audit_log (payment:failed)
            deactivate API

            Note over Dashboard: Dashboard polls for status update

            Dashboard->>API: GET /api/payments/{paymentId}/status (polling)
            API-->>Dashboard: { status: 'failed', failureReason: 'insufficient_funds' }
            Dashboard-->>Admin: Display "Insufficient funds" error, prompt to retry
        end
    end
```
