# API Overview & Conventions

## Ghana Police Ticketing System - Backend API

### Base URL

```
{PROTOCOL}://{HOST}:{PORT}/api
```

**Default (Development):** `http://localhost:8000/api`

All endpoints in this documentation are relative to the base URL. For example, `/auth/login` means `http://localhost:8000/api/auth/login`.

---

## Authentication

### Scheme: JWT Bearer Token

All authenticated endpoints require an `Authorization` header:

```
Authorization: Bearer {accessToken}
```

### Token Lifecycle

| Token | Lifetime | Storage |
|-------|----------|---------|
| Access Token | 15 minutes | Client memory / localStorage |
| Refresh Token | 7 days | HttpOnly cookie or localStorage; hashed in DB |

### Custom Headers

| Header | Description | Required |
|--------|-------------|----------|
| `Authorization` | `Bearer {accessToken}` | Yes (authenticated endpoints) |
| `X-Device-ID` | Unique device identifier for tracking | Optional (handheld devices) |
| `Content-Type` | `application/json` (default) or `multipart/form-data` (file uploads) | Yes |
| `Accept` | `application/json` | Yes |

### Token Refresh Flow

1. Client receives `401 Unauthorized` response
2. Client sends `POST /api/auth/refresh` with refresh token
3. Server validates refresh token and issues new access token
4. Client retries original request with new access token
5. If refresh fails, client clears auth state and redirects to login

---

## Standard Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message",
  "timestamp": "2026-01-15T10:30:00Z"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error description",
    "details": {
      "fieldName": ["Error message for this field"]
    }
  },
  "timestamp": "2026-01-15T10:30:00Z"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request body or query params failed validation |
| `INVALID_CREDENTIALS` | 401 | Login failed - wrong email/badge or password |
| `UNAUTHORIZED` | 401 | Missing or invalid access token |
| `TOKEN_EXPIRED` | 401 | Access token has expired |
| `FORBIDDEN` | 403 | User lacks permission for this action |
| `NOT_FOUND` | 404 | Requested resource does not exist |
| `CONFLICT` | 409 | Resource already exists (duplicate badge number, etc.) |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `SERVICE_UNAVAILABLE` | 503 | Dependent service (DB, payment provider) is down |

---

## Pagination

### Request Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-indexed) |
| `limit` | integer | 20 | Items per page (max: 100) |
| `sortBy` | string | `createdAt` | Field to sort by |
| `sortOrder` | string | `desc` | Sort direction: `asc` or `desc` |

### Response Shape

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 247,
      "totalPages": 13,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "timestamp": "2026-01-15T10:30:00Z"
}
```

---

## Filtering

List endpoints support filtering via query parameters. Common patterns:

| Pattern | Example | Description |
|---------|---------|-------------|
| Single value | `?status=paid` | Exact match |
| Multiple values | `?status=paid,unpaid` | Comma-separated OR match |
| Date range | `?dateFrom=2026-01-01&dateTo=2026-01-31` | Inclusive date range |
| Numeric range | `?minAmount=100&maxAmount=500` | Inclusive numeric range |
| Text search | `?search=GR-1234` | Partial match across relevant text fields |

---

## Data Formats

### Dates & Times

- All timestamps use **ISO 8601** format with timezone: `2026-01-15T10:30:00Z`
- Date-only fields use: `2026-01-15`
- Server timezone: `Africa/Accra` (GMT+0)
- All timestamps stored and returned in UTC

### Currency

- Currency code: `GHS` (Ghana Cedi)
- Symbol: `GH₵`
- All monetary amounts are **decimal numbers with 2 decimal places**
- Example: `200.00`, `1500.50`

### IDs

- All entity IDs are **UUID v4** format: `550e8400-e29b-41d4-a716-446655440000`
- Ticket numbers follow pattern: `GPS-{YEAR}-{6-DIGIT-SEQUENCE}` (e.g., `GPS-2026-000142`)

### Phone Numbers

- Ghana mobile format: `+233XXXXXXXXX` or `0XXXXXXXXX`
- Validation pattern: `^(\+233|0)[235]\d{8}$`

### Vehicle Registration

- Standard: `XX-XXXX-XX` (e.g., `GR-1234-20`)
- Government: `GV-XXXX-XX`
- Diplomatic: `CD-XXX-XX`
- Commercial: `G[TNRC]-XXXX-XX`

---

## Role-Based Access Control (RBAC)

### User Roles

| Role | Scope | Description |
|------|-------|-------------|
| `officer` | Own data | Field officer issuing tickets on handheld device |
| `supervisor` | Station | Station supervisor with oversight of station officers |
| `admin` | Region | Regional administrator with full management capabilities |
| `accountant` | Region | Finance officer managing payments and reconciliation |
| `super_admin` | National | National administrator with full system access |

### Permission Matrix

| Permission | officer | supervisor | admin | accountant | super_admin |
|------------|---------|------------|-------|------------|-------------|
| `ticket:create` | Y | Y | Y | - | Y |
| `ticket:view:own` | Y | Y | Y | Y | Y |
| `ticket:view:station` | - | Y | Y | Y | Y |
| `ticket:view:all` | - | - | Y | Y | Y |
| `ticket:edit` | - | - | Y | - | Y |
| `ticket:void` | - | Y | Y | - | Y |
| `ticket:print` | Y | Y | Y | - | Y |
| `officer:view:station` | - | Y | Y | - | Y |
| `officer:view:all` | - | - | Y | - | Y |
| `officer:create` | - | - | Y | - | Y |
| `officer:edit` | - | - | Y | - | Y |
| `payment:view` | - | - | Y | Y | Y |
| `payment:process` | - | - | Y | Y | Y |
| `payment:reconcile` | - | - | - | Y | Y |
| `objection:view` | - | - | Y | - | Y |
| `objection:process` | - | - | Y | - | Y |
| `report:view:station` | - | Y | Y | Y | Y |
| `report:view:all` | - | - | Y | Y | Y |
| `report:export` | - | - | Y | Y | Y |

### Jurisdiction Scoping

Data access is automatically scoped by the user's jurisdiction:

- **Officer**: Sees only own tickets
- **Supervisor**: Sees all tickets at their assigned station
- **Admin**: Sees all tickets in their region
- **Accountant**: Sees all tickets in their region (read-only except payments)
- **Super Admin**: Sees all tickets nationally

This scoping is enforced server-side via middleware. Clients do not need to pass jurisdiction filters — the server injects them based on the authenticated user's assignment.

---

## Rate Limiting

| Endpoint Group | Limit | Window |
|----------------|-------|--------|
| Auth (login, refresh) | 10 requests | 1 minute |
| Write operations (POST, PUT, PATCH, DELETE) | 60 requests | 1 minute |
| Read operations (GET) | 120 requests | 1 minute |
| File upload | 20 requests | 1 minute |
| Sync | 10 requests | 1 minute |

Rate limit headers included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1705312200
```

---

## Health Check

```
GET /api/health
```

No authentication required.

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-01-15T10:30:00Z",
  "services": {
    "database": true,
    "cache": true,
    "storage": true
  }
}
```

Status values: `healthy`, `degraded` (non-critical service down), `unhealthy` (critical service down).

---

## Business Constants

| Constant | Value | Description |
|----------|-------|-------------|
| Ticket Number Prefix | `GPS` | Ghana Police Service |
| Payment Grace Period | 14 days | Days before ticket becomes overdue |
| Objection Deadline | 7 days | Days allowed to file an objection |
| Max Photos Per Ticket | 4 | Maximum evidence photos |
| Max Photo Size | 5 MB | Per photo file size limit |
| Sync Batch Size | 50 | Maximum items per sync request |
| Max Sync Retries | 5 | Before marking sync item as failed |
| Conflict Resolution | `server-wins` | Server data takes precedence on conflict |
