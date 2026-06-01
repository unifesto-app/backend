# Supabase Storage Setup

This document explains how to set up the required Supabase Storage buckets for the application.

## Required Buckets

### 1. user-avatars
Used for storing user profile avatars.

**Configuration:**
- **Name:** `user-avatars`
- **Public:** Yes (publicly accessible)
- **File size limit:** 5MB
- **Allowed MIME types:** image/jpeg, image/jpg, image/png, image/webp

## Setup Instructions

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name:** `user-avatars`
   - **Public bucket:** Toggle ON (enable public access)
   - Click **Create bucket**

5. Set up Storage Policies:
   - Click on the `user-avatars` bucket
   - Go to **Policies** tab
   - Add the following policies:

#### Policy 1: Allow authenticated users to upload their own avatars
```sql
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars' 
  AND (storage.foldername(name))[1] = 'avatars'
);
```

#### Policy 2: Allow public read access to all avatars
```sql
CREATE POLICY "Public read access to avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-avatars');
```

#### Policy 3: Allow authenticated users to update their own avatars
```sql
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND (storage.foldername(name))[1] = 'avatars'
);
```

#### Policy 4: Allow authenticated users to delete their own avatars
```sql
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND (storage.foldername(name))[1] = 'avatars'
);
```

### Option 2: Using SQL Editor

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars' 
  AND (storage.foldername(name))[1] = 'avatars'
);

CREATE POLICY "Public read access to avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND (storage.foldername(name))[1] = 'avatars'
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND (storage.foldername(name))[1] = 'avatars'
);
```

## Verification

After setup, verify the bucket is working:

1. Check that the bucket appears in the Storage section
2. Try uploading an avatar through the mobile app
3. Verify the avatar URL is publicly accessible

## Troubleshooting

### Error: "Failed to upload avatar"

**Possible causes:**
1. Bucket doesn't exist - Follow setup instructions above
2. Bucket is not public - Enable public access in bucket settings
3. Storage policies are missing - Add the policies listed above
4. File size exceeds limit - Ensure file is under 5MB
5. Invalid file type - Only JPEG, PNG, and WebP are allowed

### Error: "Permission denied"

**Solution:** Check that the storage policies are correctly set up and that the user is authenticated.

### Avatar URL not accessible

**Solution:** Ensure the bucket is set to public and the "Public read access" policy is in place.

## File Structure

Avatars are stored with the following structure:
```
user-avatars/
  └── avatars/
      ├── {userId}-{timestamp}.jpg
      ├── {userId}-{timestamp}.png
      └── {userId}-{timestamp}.webp
```

## Security Notes

- Avatars are stored in a public bucket for easy access
- File size is limited to 5MB to prevent abuse
- Only authenticated users can upload/update/delete avatars
- File types are restricted to common image formats
- Each avatar filename includes the user ID and timestamp for uniqueness
