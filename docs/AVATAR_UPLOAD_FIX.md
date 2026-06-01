# Avatar Upload Fix

## Problem
Avatar uploads were failing with the error: `Failed to upload avatar`

## Root Cause
The backend was using `SUPABASE_ANON_KEY` instead of `SUPABASE_SERVICE_ROLE_KEY` for server-side storage operations. The anonymous key has limited permissions and cannot perform file uploads to Supabase Storage.

## Solution Applied

### 1. Updated Supabase Client Configuration
**File:** `src/users/users.service.ts`

Changed from:
```typescript
const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY')!;
this.supabase = createClient(supabaseUrl, supabaseKey);
```

To:
```typescript
const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!;
this.supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
  realtime: {
    transport: WebSocket as any,
  },
});
```

**Why this fixes it:**
- `SERVICE_ROLE_KEY` has full admin permissions for server-side operations
- Added WebSocket transport for Node.js compatibility
- Disabled session persistence (not needed for server-side operations)

### 2. Improved Error Logging
Enhanced the `uploadAvatar` method to provide detailed error information:

```typescript
if (uploadError) {
  this.logger.error('Failed to upload avatar to Supabase Storage', {
    error: uploadError,
    userId,
    filePath,
    fileSize: file.size,
    mimeType: file.mimetype,
  });
  throw new ConflictException(
    `Failed to upload avatar: ${uploadError.message || 'Storage error'}`,
  );
}
```

This helps with debugging by logging:
- The actual error from Supabase
- User ID attempting the upload
- File path in storage
- File size and MIME type

### 3. Created Storage Verification Script
**File:** `scripts/verify-storage.ts`

Run with:
```bash
npx ts-node scripts/verify-storage.ts
```

This script:
- ✅ Checks if the `user-avatars` bucket exists
- ✅ Verifies the bucket is public
- ✅ Tests file upload functionality
- ✅ Tests public URL generation
- ✅ Cleans up test files

## Verification Steps

1. **Verify storage is configured:**
   ```bash
   cd backend
   npx ts-node scripts/verify-storage.ts
   ```
   
   Expected output: `✅ All checks passed! Storage is properly configured.`

2. **Restart the backend server:**
   ```bash
   npm run start:dev
   ```

3. **Test avatar upload from mobile app:**
   - Open the mobile app
   - Go to profile/account settings
   - Try uploading an avatar
   - Should succeed without errors

## Environment Variables Required

Ensure these are set in `backend/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Important:** Never commit the `SERVICE_ROLE_KEY` to version control. It has full admin access to your Supabase project.

## Storage Bucket Configuration

The `user-avatars` bucket must be:
- ✅ Created in Supabase Storage
- ✅ Set to **public** (for avatar URLs to be accessible)
- ✅ Have proper storage policies configured

See `docs/STORAGE_SETUP.md` for detailed setup instructions.

## File Upload Constraints

The backend enforces these limits:
- **Max file size:** 5MB
- **Allowed formats:** JPEG, JPG, PNG, WebP
- **Storage path:** `avatars/{userId}-{timestamp}.{ext}`

## Troubleshooting

### Error: "Bucket not found"
**Solution:** Create the `user-avatars` bucket in Supabase Dashboard → Storage

### Error: "Permission denied"
**Solution:** Ensure you're using `SUPABASE_SERVICE_ROLE_KEY` (not `ANON_KEY`)

### Error: "Invalid file type"
**Solution:** Only JPEG, PNG, and WebP images are allowed

### Avatar URL not accessible
**Solution:** Make sure the bucket is set to **public** in Supabase Dashboard

## Security Notes

- The `SERVICE_ROLE_KEY` bypasses Row Level Security (RLS) policies
- Only use it in server-side code, never expose it to clients
- The mobile app uses the `ANON_KEY` for client-side operations
- File uploads are validated for size and type before processing
- Each avatar filename includes user ID to prevent conflicts

## Related Files

- `src/users/users.service.ts` - Avatar upload implementation
- `src/users/users.controller.ts` - Upload endpoint definition
- `scripts/verify-storage.ts` - Storage verification script
- `docs/STORAGE_SETUP.md` - Detailed storage setup guide
- `mobile-apps/discover/src/lib/api/auth.ts` - Mobile app upload function
