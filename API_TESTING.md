# API Testing Guide

This guide shows how to test the Auth API endpoints using curl, Postman, or any HTTP client.

## Prerequisites

1. Backend server running (default: `http://localhost:3000`)
2. Valid Supabase JWT token from your frontend authentication

## Getting a Test Token

### Option 1: From Supabase Dashboard

1. Go to your Supabase project
2. Navigate to **Authentication** → **Users**
3. Click on a user
4. Copy the JWT token from the user details

### Option 2: From Frontend Login

After logging in via your frontend (email or Google), extract the token from:
- Local storage: `supabase.auth.token`
- Or from the Supabase client: `supabase.auth.getSession()`

```javascript
// In browser console after login
const { data: { session } } = await supabase.auth.getSession()
console.log(session.access_token)
```

## API Endpoints

### 1. Get Current User Profile

**Endpoint:** `GET /auth/me`

**Description:** Fetch the authenticated user's profile.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "profile": {
    "name": "John Doe",
    "username": "johndoe",
    "avatar_url": "https://example.com/avatar.jpg",
    "bio": "Software developer",
    "phone": "+1234567890",
    "role": "attendee",
    "is_verified": false,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "statusCode": 404,
  "message": "Profile not found",
  "error": "Not Found"
}
```

---

### 2. Sync User Profile

**Endpoint:** `POST /auth/sync`

**Description:** Create user profile if it doesn't exist. Call this after first login.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/auth/sync \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200):**
```json
{
  "message": "Profile synced successfully",
  "profile": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "name": null,
    "username": null,
    "avatar_url": null,
    "bio": null,
    "phone": null,
    "role": "attendee",
    "is_verified": false,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 3. Update User Profile

**Endpoint:** `PATCH /auth/profile`

**Description:** Update user profile information.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body (all fields optional):**
```json
{
  "name": "John Doe",
  "username": "johndoe",
  "avatar_url": "https://example.com/avatar.jpg",
  "bio": "Full-stack developer passionate about web technologies",
  "phone": "+1234567890"
}
```

**cURL Example:**
```bash
curl -X PATCH http://localhost:3000/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "username": "johndoe",
    "bio": "Software developer"
  }'
```

**Success Response (200):**
```json
{
  "message": "Profile updated successfully",
  "profile": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "name": "John Doe",
    "username": "johndoe",
    "avatar_url": "https://example.com/avatar.jpg",
    "bio": "Software developer",
    "phone": "+1234567890",
    "role": "attendee",
    "is_verified": false,
    "is_active": true,
    "updated_at": "2024-01-01T12:30:00.000Z"
  }
}
```

**Validation Error (400):**
```json
{
  "statusCode": 400,
  "message": [
    "name must be longer than or equal to 2 characters",
    "username can only contain letters, numbers, underscores and hyphens"
  ],
  "error": "Bad Request"
}
```

**Conflict Error (409):**
```json
{
  "statusCode": 409,
  "message": "Username already taken",
  "error": "Conflict"
}
```

---

## Validation Rules

### Name
- **Min length:** 2 characters
- **Max length:** 100 characters
- **Type:** String

### Username
- **Min length:** 3 characters
- **Max length:** 30 characters
- **Pattern:** Only letters, numbers, underscores, and hyphens
- **Unique:** Must be unique across all users
- **Examples:**
  - ✅ `john_doe`
  - ✅ `user123`
  - ✅ `my-username`
  - ❌ `ab` (too short)
  - ❌ `user@name` (invalid character)
  - ❌ `user name` (spaces not allowed)

### Avatar URL
- **Type:** Valid URL
- **Max length:** 500 characters
- **Examples:**
  - ✅ `https://example.com/avatar.jpg`
  - ✅ `https://cdn.example.com/images/user/123.png`
  - ❌ `not-a-url`
  - ❌ `example.com/avatar.jpg` (missing protocol)

### Bio
- **Max length:** 500 characters
- **Type:** String

### Phone
- **Type:** Valid phone number (international format)
- **Examples:**
  - ✅ `+1234567890`
  - ✅ `+44 20 7946 0958`
  - ❌ `123456` (invalid format)

---

## Common Error Responses

### 401 Unauthorized - No Token
```json
{
  "statusCode": 401,
  "message": "No authorization token provided",
  "error": "Unauthorized"
}
```

### 401 Unauthorized - Invalid Token
```json
{
  "statusCode": 401,
  "message": "Invalid token",
  "error": "Unauthorized"
}
```

### 401 Unauthorized - Expired Token
```json
{
  "statusCode": 401,
  "message": "Token has expired",
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Profile not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Failed to fetch profile",
  "error": "Internal Server Error"
}
```

---

## Postman Collection

### Setup

1. Create a new collection in Postman
2. Add an environment variable:
   - `BASE_URL`: `http://localhost:3000`
   - `JWT_TOKEN`: Your Supabase JWT token

### Request Examples

#### Get Profile
```
GET {{BASE_URL}}/auth/me
Headers:
  Authorization: Bearer {{JWT_TOKEN}}
```

#### Sync Profile
```
POST {{BASE_URL}}/auth/sync
Headers:
  Authorization: Bearer {{JWT_TOKEN}}
```

#### Update Profile
```
PATCH {{BASE_URL}}/auth/profile
Headers:
  Authorization: Bearer {{JWT_TOKEN}}
  Content-Type: application/json
Body (raw JSON):
{
  "name": "John Doe",
  "username": "johndoe",
  "bio": "Software developer"
}
```

---

## Testing Workflow

### First-Time User Flow

1. **User logs in via frontend** (Supabase handles this)
2. **Frontend receives JWT token**
3. **Call sync endpoint** to create profile:
   ```bash
   POST /auth/sync
   ```
4. **Fetch user profile**:
   ```bash
   GET /auth/me
   ```
5. **Update profile** with user information:
   ```bash
   PATCH /auth/profile
   ```

### Returning User Flow

1. **User logs in via frontend**
2. **Frontend receives JWT token**
3. **Fetch user profile**:
   ```bash
   GET /auth/me
   ```

---

## Testing with JavaScript/TypeScript

### Using Fetch API

```typescript
const API_URL = 'http://localhost:3000';
const token = 'YOUR_JWT_TOKEN';

// Get profile
async function getProfile() {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}

// Sync profile
async function syncProfile() {
  const response = await fetch(`${API_URL}/auth/sync`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}

// Update profile
async function updateProfile(data) {
  const response = await fetch(`${API_URL}/auth/profile`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response.json();
}

// Usage
const profile = await getProfile();
console.log(profile);

await updateProfile({
  name: 'John Doe',
  username: 'johndoe',
  bio: 'Software developer'
});
```

### Using Axios

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Get profile
const { data } = await api.get('/auth/me');

// Sync profile
await api.post('/auth/sync');

// Update profile
await api.patch('/auth/profile', {
  name: 'John Doe',
  username: 'johndoe'
});
```

---

## Troubleshooting

### "Profile not found" on /auth/me

**Solution:** Call `POST /auth/sync` first to create the profile.

### "Username already taken"

**Solution:** Choose a different username. Usernames must be unique.

### "Invalid token"

**Possible causes:**
1. Token is expired (Supabase tokens expire after 1 hour by default)
2. Wrong JWT secret in backend `.env`
3. Token is malformed

**Solution:** 
- Get a fresh token from Supabase
- Verify `SUPABASE_JWT_SECRET` matches your Supabase project

### "No authorization token provided"

**Solution:** Make sure you're including the `Authorization` header with `Bearer ` prefix.

### CORS errors in browser

**Solution:** Update `CORS_ORIGIN` in backend `.env` to match your frontend URL.

---

## Production Testing

When testing in production:

1. Replace `http://localhost:3000` with your production API URL
2. Use production Supabase tokens
3. Ensure CORS is configured for your production frontend domain
4. Monitor logs for any errors

---

## Security Notes

⚠️ **Never commit JWT tokens to version control**  
⚠️ **Never share JWT tokens publicly**  
⚠️ **Tokens expire after 1 hour (default Supabase setting)**  
⚠️ **Always use HTTPS in production**  
⚠️ **Keep your `SUPABASE_JWT_SECRET` secure**
