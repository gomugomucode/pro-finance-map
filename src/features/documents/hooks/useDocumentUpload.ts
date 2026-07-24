import { useState, useCallback, useEffect } from 'react';
import { UploadProgressItem, DocumentType } from '@/types/documents';
import { useCreateDocument } from './useDocuments';
import { toast } from 'sonner';

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

interface UploadOptions {
  transactionId?: string;
  assetId?: string;
  loanId?: string;
  merchantId?: string;
  defaultType?: DocumentType;
  onSuccess?: () => void;
}

export function useDocumentUpload(options: UploadOptions = {}) {
  const [queue, setQueue] = useState<UploadProgressItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const createDocumentMutation = useCreateDocument();

  // Validate File
  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File size exceeds 15MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB)`;
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type) && !file.name.match(/\.(pdf|png|jpe?g|webp|doc|docx)$/i)) {
      return `Unsupported file format (${file.type || 'unknown'})`;
    }
    return null;
  };

  // Add Files to Queue
  const addFilesToQueue = useCallback(
    (files: File[]) => {
      const newItems: UploadProgressItem[] = [];

      for (const file of files) {
        const errorMsg = validateFile(file);
        const item: UploadProgressItem = {
          id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          file,
          previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
          progress: 0,
          status: errorMsg ? 'error' : 'pending',
          errorMsg: errorMsg || undefined,
          documentType: options.defaultType || inferDocumentType(file.name),
          transactionId: options.transactionId,
          assetId: options.assetId,
          loanId: options.loanId,
          merchantId: options.merchantId,
          tags: ['Uploaded'],
          notes: '',
        };

        if (errorMsg) {
          toast.error(errorMsg);
        }
        newItems.push(item);
      }

      setQueue((prev) => [...prev, ...newItems]);
    },
    [options]
  );

  // Handle Clipboard Paste Event (e.g. pasting receipt images from screenshot)
  const handlePasteEvent = useCallback(
    (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = Array.from(e.clipboardData.items);
      const imageFiles: File[] = [];

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) {
            const pastedFile = new File([blob], `pasted_receipt_${Date.now()}.png`, { type: blob.type });
            imageFiles.push(pastedFile);
          }
        }
      }

      if (imageFiles.length > 0) {
        toast.info(`Pasted ${imageFiles.length} image(s) from clipboard!`);
        addFilesToQueue(imageFiles);
      }
    },
    [addFilesToQueue]
  );

  // Remove Item from Queue
  const removeItem = (id: string) => {
    setQueue((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  // Update Item Property (e.g., changing Document Type, Tags, or Notes before upload)
  const updateItem = (id: string, updates: Partial<UploadProgressItem>) => {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  // Process and Upload Queue
  const processQueue = async () => {
    const pendingItems = queue.filter((item) => item.status === 'pending');
    if (pendingItems.length === 0) return;

    setIsUploading(true);

    for (const item of pendingItems) {
      try {
        // Update status to uploading
        setQueue((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading', progress: 30 } : i))
        );

        // Simulate upload progress steps
        await new Promise((r) => setTimeout(r, 200));
        setQueue((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, progress: 70 } : i))
        );

        await createDocumentMutation.mutateAsync({
          file: item.file,
          filename: item.file.name,
          mime_type: item.file.type,
          file_size: item.file.size,
          document_type: item.documentType,
          transaction_id: item.transactionId || null,
          asset_id: item.assetId || null,
          loan_id: item.loanId || null,
          merchant_id: item.merchantId || null,
          tags: item.tags,
          notes: item.notes,
        });

        // Update status to completed
        setQueue((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'completed', progress: 100 } : i))
        );
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: 'error', errorMsg: err.message || 'Upload failed' }
              : i
          )
        );
      }
    }

    setIsUploading(false);
    options.onSuccess?.();
  };

  // Clear completed uploads
  const clearCompleted = () => {
    setQueue((prev) => prev.filter((i) => i.status !== 'completed'));
  };

  return {
    queue,
    isUploading,
    addFilesToQueue,
    handlePasteEvent,
    removeItem,
    updateItem,
    processQueue,
    clearCompleted,
  };
}

function inferDocumentType(filename: string): DocumentType {
  const f = filename.toLowerCase();
  if (f.includes('warranty')) return 'warranty';
  if (f.includes('invoice')) return 'invoice';
  if (f.includes('bill')) return 'bill';
  if (f.includes('tax') || f.includes('w2') || f.includes('1099')) return 'tax';
  if (f.includes('statement')) return 'statement';
  if (f.includes('insurance') || f.includes('policy')) return 'insurance';
  if (f.includes('registration')) return 'registration';
  if (f.includes('manual')) return 'manual';
  return 'receipt';
}
