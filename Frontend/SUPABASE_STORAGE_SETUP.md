# Supabase Storage Setup Guide

This guide will help you set up the required storage bucket and policies for PDF file uploads in TakeOn.

## 🪣 Step 1: Create Storage Bucket

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Enter the bucket name: `topic-pdfs`
5. Set **Public bucket** to `true` (or configure RLS policies as shown below)
6. Click **"Create bucket"**

## 🔒 Step 2: Configure RLS Policies

### Option A: Public Bucket (Easier Setup)
If you set the bucket as public in Step 1, you're done! Files will be publicly accessible via URL.

### Option B: Private Bucket with RLS Policies (Recommended)

#### 1. Upload Policy (Allow authenticated users to upload)
```sql
-- Policy Name: "Allow authenticated users to upload files"
-- Operation: INSERT
-- Target roles: authenticated

CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'topic-pdfs');
```

#### 2. Read Policy (Allow public access to read files)
```sql
-- Policy Name: "Allow public read access"
-- Operation: SELECT
-- Target roles: public

CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'topic-pdfs');
```

#### 3. Delete Policy (Allow owners to delete their files)
```sql
-- Policy Name: "Allow users to delete their own files"
-- Operation: DELETE
-- Target roles: authenticated

CREATE POLICY "Allow users to delete their own files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'topic-pdfs' AND owner = auth.uid());
```

## 🛠️ Step 3: Apply Policies via Dashboard

1. Go to **Storage** → **Policies** in your Supabase dashboard
2. Click **"New Policy"**
3. Select the `objects` table under `storage` schema
4. Choose the operation type (INSERT, SELECT, DELETE)
5. Set the target roles (`authenticated`, `public`, etc.)
6. Enter the policy expression (the `WITH CHECK` or `USING` clause from above)
7. Click **"Save policy"**

## 🧪 Step 4: Test the Setup

1. Try creating a game with a PDF file upload
2. If you see the error: "Storage bucket not configured properly", check:
   - Bucket exists and is named exactly `topic-pdfs`
   - RLS policies are correctly applied
   - Your user is authenticated

## 🔧 Alternative: SQL Editor Setup

You can also run these SQL commands directly in the **SQL Editor**:

```sql
-- Create policies for the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('topic-pdfs', 'topic-pdfs', true);

-- If you want private bucket with policies instead:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('topic-pdfs', 'topic-pdfs', false);

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'topic-pdfs');

-- Allow public read access
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'topic-pdfs');

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete their own files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'topic-pdfs' AND owner = auth.uid());
```

## 🚨 Troubleshooting

### Error: "new row violates row-level security policy"
- **Cause**: Missing or incorrect RLS policies
- **Solution**: Apply the policies from Step 2

### Error: "The resource was not found"
- **Cause**: Bucket doesn't exist or wrong name
- **Solution**: Ensure bucket is named exactly `topic-pdfs`

### Error: "Unauthorized"
- **Cause**: User not authenticated or insufficient permissions
- **Solution**: Ensure user is logged in and has upload permissions

## 🎯 Testing

After setup, test by:
1. Creating a game with a PDF file
2. Checking if the file uploads successfully
3. Verifying the PDF URL works in the game lobby
4. Ensuring the "View Study Material" link opens the PDF

## 📝 Notes

- File naming convention: `{topicId}_{timestamp}.{extension}`
- Supported file types: PDF only
- Max file size: Depends on your Supabase plan
- Files are stored permanently unless manually deleted 