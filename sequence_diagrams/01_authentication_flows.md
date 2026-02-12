# Authentication Flows

This document contains sequence diagrams for all authentication-related flows in the Ghana Police Ticketing System.

---

## 1. Officer Login (Handheld)

Officers authenticate via their badge number and password from the handheld device.

```mermaid
sequenceDiagram
    actor Officer
    participant App as Handheld App
    participant API as API Server
    participant DB as Database

    Officer->>App: Enter badge number + password
    App->>API: POST /api/auth/login<br/>{ badgeNumber, password, deviceId, deviceInfo }
    API->>DB: Query user by badge_number<br/>(JOIN officers table)
    DB-->>API: User + Officer record

    API->>API: Verify password (bcrypt.compare)

    alt Account locked (failed_login_attempts >= threshold)
        API-->>App: 423 Account Locked<br/>{ message, lockoutRemaining }
        App-->>Officer: Show "Account Locked" message
    else Invalid credentials
        API->>DB: INCREMENT failed_login_attempts
        DB-->>API: Updated
        API-->>App: 401 Invalid Credentials<br/>{ message, attemptsRemaining }
        App-->>Officer: Show "Invalid Credentials" error
    else Success
        API->>DB: Reset failed_login_attempts = 0,<br/>update last_login = NOW()
        DB-->>API: Updated
        API->>API: Generate JWT access token (15min expiry)
        API->>API: Generate refresh token (7 days expiry)
        API->>DB: Store refresh_token (hashed)<br/>with device_id association
        DB-->>API: Stored
        API->>DB: INSERT audit_log<br/>{ action: 'login', userId, deviceId, ip }
        DB-->>API: Created
        API-->>App: 200 { user, officer, tokens:<br/>{ accessToken, refreshToken, expiresIn } }
        App->>App: Store tokens in localStorage
        App->>App: Set interface mode to 'handheld'
        App-->>Officer: Redirect to /handheld
    end
```

---

## 2. Dashboard Login (Admin / Super Admin)

Admin and Super Admin users authenticate via email and password from the web dashboard.

```mermaid
sequenceDiagram
    actor User as Admin / Super Admin
    participant Dash as Admin Dashboard
    participant API as API Server
    participant DB as Database

    User->>Dash: Enter email + password
    Dash->>API: POST /api/auth/login<br/>{ email, password }
    API->>DB: Query user by email
    DB-->>API: User record (with role)

    API->>API: Verify password (bcrypt.compare)

    alt Account locked
        API-->>Dash: 423 Account Locked<br/>{ message, lockoutRemaining }
        Dash-->>User: Show "Account Locked" message
    else Invalid credentials
        API->>DB: INCREMENT failed_login_attempts
        DB-->>API: Updated
        API-->>Dash: 401 Invalid Credentials<br/>{ message, attemptsRemaining }
        Dash-->>User: Show "Invalid Credentials" error
    else Success
        API->>DB: Reset failed_login_attempts = 0,<br/>update last_login = NOW()
        DB-->>API: Updated
        API->>API: Generate JWT access token (15min expiry)
        API->>API: Generate refresh token (7 days expiry)
        API->>DB: Store refresh_token (hashed)
        DB-->>API: Stored
        API->>DB: INSERT audit_log<br/>{ action: 'login', userId, ip }
        DB-->>API: Created
        API-->>Dash: 200 { user, tokens:<br/>{ accessToken, refreshToken, expiresIn } }
        Dash->>Dash: Store tokens in localStorage

        alt Role is 'super_admin'
            Dash-->>User: Redirect to /super-admin
        else Role is 'admin'
            Dash-->>User: Redirect to /dashboard
        end
    end
```

---

## 3. Token Refresh

Transparent token refresh flow when an access token expires during a session.

```mermaid
sequenceDiagram
    participant Client as Client (App / Dashboard)
    participant API as API Server
    participant DB as Database

    Client->>API: Any API request with expired access token<br/>(Authorization: Bearer <expired_token>)
    API-->>Client: 401 Token Expired<br/>{ code: 'TOKEN_EXPIRED' }

    Client->>Client: Detect TOKEN_EXPIRED response
    Client->>API: POST /api/auth/refresh<br/>{ refreshToken }

    API->>DB: Lookup refresh token<br/>(match hash, check expiry, check revoked)
    DB-->>API: Token record

    alt Valid refresh token
        API->>API: Generate new access token (15min expiry)
        API-->>Client: 200 { accessToken, expiresIn }
        Client->>Client: Update stored access token
        Client->>API: Retry original request<br/>with new access token
        API-->>Client: Original response (success)
    else Invalid or expired refresh token
        API-->>Client: 401 Unauthorized<br/>{ code: 'REFRESH_INVALID' }
        Client->>Client: Clear all stored auth tokens
        Client->>Client: Redirect to /login
    end
```

---

## 4. Password Reset

Full password reset flow via email for dashboard users.

```mermaid
sequenceDiagram
    actor User
    participant App as App (Dashboard)
    participant API as API Server
    participant DB as Database
    participant Email as Email Service

    User->>App: Click "Forgot Password"
    App-->>User: Show forgot password form

    User->>App: Enter email address
    App->>API: POST /api/auth/forgot-password<br/>{ email }

    API->>DB: Find user by email
    DB-->>API: User record (or null)

    Note over API: Always return 200 regardless<br/>of whether email exists<br/>(prevents email enumeration)

    alt User found
        API->>API: Generate reset token<br/>(crypto.randomBytes, 1hr expiry)
        API->>DB: Store reset token hash + expiry on user record
        DB-->>API: Updated
        API->>Email: Send password reset email<br/>with link containing token
        Email-->>User: Reset email delivered
    end

    API-->>App: 200 { message: "If an account exists,<br/>a reset email has been sent" }
    App-->>User: Show confirmation message

    Note over User,Email: User checks email and clicks reset link

    User->>App: Click reset link<br/>(/reset-password?token=xxx)
    App-->>User: Show new password form

    User->>App: Enter new password + confirm
    App->>API: POST /api/auth/reset-password<br/>{ token, newPassword }

    API->>DB: Find user by reset token hash<br/>where expiry > NOW()
    DB-->>API: User record

    alt Token valid and not expired
        API->>API: Hash new password (bcrypt)
        API->>DB: Update user password,<br/>clear reset token + expiry
        DB-->>API: Updated
        API->>DB: Revoke ALL refresh tokens for user<br/>(forces re-login on all devices)
        DB-->>API: Revoked
        API->>DB: INSERT audit_log<br/>{ action: 'password_reset', userId }
        DB-->>API: Created
        API-->>App: 200 { message: "Password reset successful" }
        App-->>User: Show success, redirect to /login
    else Token invalid or expired
        API-->>App: 400 { message: "Invalid or expired reset token" }
        App-->>User: Show error, prompt to request new reset
    end
```
