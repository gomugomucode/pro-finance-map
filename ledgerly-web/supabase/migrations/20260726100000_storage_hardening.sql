-- Hardening Receipts Storage Bucket with Constraints
update storage.buckets
set file_size_limit = 15728640, -- 15MB in bytes
    allowed_mime_types = array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
where id = 'receipts';
