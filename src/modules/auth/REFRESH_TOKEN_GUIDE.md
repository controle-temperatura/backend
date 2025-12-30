# Refresh Token Implementation Guide

## Overview

This authentication system implements a secure refresh token mechanism with the following features:

- **Token Rotation**: Each time a refresh token is used, it's invalidated and a new one is issued
- **Secure Storage**: Refresh tokens are hashed before being stored in the database
- **HttpOnly Cookies**: Tokens are stored in HttpOnly cookies to prevent XSS attacks
- **Multiple Device Support**: Users can be logged in on multiple devices simultaneously
- **Selective Logout**: Users can logout from a specific device or all devices at once

## API Endpoints

### 1. Login
**POST** `/auth/login`

Authenticates a user and returns access and refresh tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
- Sets `access_token` cookie (15 minutes expiry)
- Sets `refresh_token` cookie (7 days expiry)
- Sets `user_id` cookie (7 days expiry)

```json
{
  "message": "Logged in successfully"
}
```

### 2. Refresh Token
**POST** `/auth/refresh`

Exchanges a refresh token for a new access token and refresh token.

**Request:**
- Reads `refresh_token` from cookies automatically
- Or accepts `refresh_token` in request body

**Response:**
- Sets new `access_token` cookie (15 minutes expiry)
- Sets new `refresh_token` cookie (7 days expiry)

```json
{
  "message": "Token atualizado com sucesso"
}
```

### 3. Logout (Current Device)
**POST** `/auth/logout`

Logs out the user from the current device only.

**Headers:**
- Requires valid JWT token (access_token)

**Response:**
- Clears all auth cookies
- Removes the current refresh token from database

```json
{
  "message": "Logout realizado com sucesso"
}
```

### 4. Logout All Devices
**POST** `/auth/logout-all`

Logs out the user from all devices.

**Headers:**
- Requires valid JWT token (access_token)

**Response:**
- Clears all auth cookies
- Removes all refresh tokens for the user from database

```json
{
  "message": "Logout realizado de todos os dispositivos"
}
```

### 5. Get Current User
**GET** `/auth/me`

Returns the currently authenticated user's information.

**Headers:**
- Requires valid JWT token (access_token)

**Response:**
```json
{
  "userId": "uuid",
  "email": "user@example.com"
}
```

## Security Features

### 1. Token Hashing
Refresh tokens are hashed using bcrypt before storage, similar to passwords. This means:
- If the database is compromised, attackers cannot use the stored tokens
- Only the client with the original token can use it

### 2. Token Rotation
Every time a refresh token is used:
1. The old token is deleted from the database
2. A new token is generated and stored
3. This prevents token reuse and limits the impact of token theft

### 3. HttpOnly Cookies
Tokens are stored in HttpOnly cookies which:
- Cannot be accessed by JavaScript (prevents XSS attacks)
- Are automatically sent with requests
- Have proper security flags (Secure in production, SameSite)

### 4. Expiration
- **Access Token**: 15 minutes (short-lived for security)
- **Refresh Token**: 7 days (longer-lived for convenience)

## Client Implementation Example

### Frontend (React/Next.js)

```typescript
// Login
async function login(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Important: sends cookies
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}

// Refresh token automatically
async function refreshToken() {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include', // Important: sends cookies
  });
  return response.json();
}

// API call with automatic token refresh
async function apiCall(url: string, options: RequestInit = {}) {
  let response = await fetch(url, {
    ...options,
    credentials: 'include',
  });

  // If access token expired, refresh and retry
  if (response.status === 401) {
    await refreshToken();
    response = await fetch(url, {
      ...options,
      credentials: 'include',
    });
  }

  return response;
}

// Logout
async function logout() {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
}
```

### Axios Interceptor Example

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Important: sends cookies
});

// Response interceptor for automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If access token expired and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh the token
        await api.post('/auth/refresh');
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

## Database Schema

```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([token])
}
```

## Maintenance

### Cleanup Expired Tokens

The `AuthService` includes a `cleanupExpiredTokens()` method that can be called periodically to remove expired tokens from the database.

You can set up a cron job to run this cleanup:

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthService } from './auth/auth.service';

@Injectable()
export class TasksService {
  constructor(private authService: AuthService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    await this.authService.cleanupExpiredTokens();
  }
}
```

## Testing

### Test Login and Token Refresh

```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  -c cookies.txt

# Use protected endpoint
curl -X GET http://localhost:3000/auth/me \
  -b cookies.txt

# Refresh token
curl -X POST http://localhost:3000/auth/refresh \
  -b cookies.txt \
  -c cookies.txt

# Logout
curl -X POST http://localhost:3000/auth/logout \
  -b cookies.txt
```

## Common Issues

### 1. CORS Issues with Cookies
Make sure your CORS configuration allows credentials:

```typescript
app.enableCors({
  origin: 'http://localhost:3001', // Your frontend URL
  credentials: true,
});
```

### 2. SameSite Cookie Issues
In development with different ports:
- Use `sameSite: 'lax'`

In production with HTTPS:
- Use `sameSite: 'none'` and `secure: true`

### 3. Token Not Being Sent
Make sure the client is sending credentials:
- Fetch: `credentials: 'include'`
- Axios: `withCredentials: true`









