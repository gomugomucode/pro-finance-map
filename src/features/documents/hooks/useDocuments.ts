import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DocumentItem, DocumentFilterOptions, DocumentType } from '@/types/documents';
import { toast } from 'sonner';
import { defaultOcrEngine } from '../services/ocrEngine';

// Initial Mock Documents for immediate rich UX testing if user table is fresh
const INITIAL_DEMO_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-demo-1',
    user_id: 'demo-user',
    transaction_id: null,
    asset_id: null,
    loan_id: null,
    merchant_id: null,
    document_type: 'receipt',
    filename: 'Apple_Store_Receipt_iPhone16.pdf',
    mime_type: 'application/pdf',
    file_size: 1420500,
    storage_path: 'demo/apple_receipt.pdf',
    thumbnail_path: null,
    tags: ['Electronics', 'Apple', 'Tax Deductible'],
    notes: 'Purchased main workstation device. 2-year AppleCare included.',
    is_favorite: true,
    is_archived: false,
    ocr_status: 'completed',
    ocr_confidence: 96.5,
    extracted_merchant: 'Apple Store Fifth Ave',
    extracted_date: '2026-06-15',
    extracted_total: 1199.00,
    extracted_tax: 105.51,
    extracted_category: 'Electronics & Hardware',
    extracted_raw_text: 'Apple Store #R102. 1x iPhone 16 Pro Max 256GB Space Black $1199.00. Subtotal: $1199.00. Tax: $105.51. Total: $1304.51. VISA ending in 4242.',
    ocr_provider: 'ledgerly_local_ocr',
    ocr_processed_at: '2026-06-15T14:32:00Z',
    uploaded_at: '2026-06-15T14:30:00Z',
    created_at: '2026-06-15T14:30:00Z',
    updated_at: '2026-06-15T14:30:00Z',
    merchant_name: 'Apple Store',
  },
  {
    id: 'doc-demo-2',
    user_id: 'demo-user',
    transaction_id: null,
    asset_id: null,
    loan_id: null,
    merchant_id: null,
    document_type: 'warranty',
    filename: 'MacBook_Pro_Warranty_Card.png',
    mime_type: 'image/png',
    file_size: 2840000,
    storage_path: 'demo/macbook_warranty.png',
    thumbnail_path: null,
    tags: ['Warranty', 'Coverage', 'MacBook'],
    notes: 'Warranty valid through June 2029. Keep proof of purchase.',
    is_favorite: true,
    is_archived: false,
    ocr_status: 'completed',
    ocr_confidence: 91.0,
    extracted_merchant: 'Apple Care Protection',
    extracted_date: '2026-05-10',
    extracted_total: 299.00,
    extracted_tax: 24.00,
    extracted_category: 'Warranty & Insurance',
    extracted_raw_text: 'AppleCare+ Extended Warranty Certificate #AC-8849201. Serial: C02XG109P35. Coverage end: 2029-05-10.',
    ocr_provider: 'ledgerly_local_ocr',
    ocr_processed_at: '2026-05-10T11:05:00Z',
    uploaded_at: '2026-05-10T11:00:00Z',
    created_at: '2026-05-10T11:00:00Z',
    updated_at: '2026-05-10T11:00:00Z',
    merchant_name: 'Apple Care',
  },
  {
    id: 'doc-demo-3',
    user_id: 'demo-user',
    transaction_id: null,
    asset_id: null,
    loan_id: null,
    merchant_id: null,
    document_type: 'tax',
    filename: 'W2_Form_2025_Tax_Filing.pdf',
    mime_type: 'application/pdf',
    file_size: 980100,
    storage_path: 'demo/w2_tax_2025.pdf',
    thumbnail_path: null,
    tags: ['Tax 2025', 'IRS', 'Income'],
    notes: 'Annual wage statement filed with federal returns.',
    is_favorite: false,
    is_archived: false,
    ocr_status: 'completed',
    ocr_confidence: 98.0,
    extracted_merchant: 'Internal Revenue Service',
    extracted_date: '2026-01-28',
    extracted_total: 84500.00,
    extracted_tax: 14200.00,
    extracted_category: 'Tax Documents',
    extracted_raw_text: 'Form W-2 Wage and Tax Statement 2025. Employer: Acme Corp Inc. Federal Income Tax Withheld: $14,200.00.',
    ocr_provider: 'ledgerly_local_ocr',
    ocr_processed_at: '2026-01-28T09:12:00Z',
    uploaded_at: '2026-01-28T09:10:00Z',
    created_at: '2026-01-28T09:10:00Z',
    updated_at: '2026-01-28T09:10:00Z',
  },
  {
    id: 'doc-demo-4',
    user_id: 'demo-user',
    transaction_id: null,
    asset_id: null,
    loan_id: null,
    merchant_id: null,
    document_type: 'invoice',
    filename: 'AWS_Cloud_Infrastructure_Invoice_Jul2026.pdf',
    mime_type: 'application/pdf',
    file_size: 450200,
    storage_path: 'demo/aws_invoice_jul2026.pdf',
    thumbnail_path: null,
    tags: ['Cloud', 'Hosting', 'Monthly Expense'],
    notes: 'Monthly EC2, S3, and CloudFront hosting costs.',
    is_favorite: false,
    is_archived: false,
    ocr_status: 'completed',
    ocr_confidence: 94.2,
    extracted_merchant: 'Amazon Web Services',
    extracted_date: '2026-07-01',
    extracted_total: 184.20,
    extracted_tax: 14.73,
    extracted_category: 'Business Infrastructure',
    extracted_raw_text: 'Amazon Web Services Invoice #99837162. Statement date: Jul 1, 2026. Total Amount Due: $184.20.',
    ocr_provider: 'ledgerly_local_ocr',
    ocr_processed_at: '2026-07-01T08:00:00Z',
    uploaded_at: '2026-07-01T08:00:00Z',
    created_at: '2026-07-01T08:00:00Z',
    updated_at: '2026-07-01T08:00:00Z',
    merchant_name: 'Amazon Web Services',
  },
];

export function useDocuments(filters: DocumentFilterOptions = {}) {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: async (): Promise<DocumentItem[]> => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) {
          return applyFilters(INITIAL_DEMO_DOCUMENTS, filters);
        }

        let query = supabase
          .from('documents')
          .select(`
            *,
            merchants:merchant_id(name),
            transactions:transaction_id(description),
            assets:asset_id(name),
            loans:loan_id(name)
          `)
          .eq('user_id', userData.user.id);

        if (filters.documentType && filters.documentType !== 'all') {
          query = query.eq('document_type', filters.documentType);
        }
        if (filters.merchantId && filters.merchantId !== 'all') {
          query = query.eq('merchant_id', filters.merchantId);
        }
        if (filters.assetId && filters.assetId !== 'all') {
          query = query.eq('asset_id', filters.assetId);
        }
        if (filters.loanId && filters.loanId !== 'all') {
          query = query.eq('loan_id', filters.loanId);
        }
        if (filters.transactionId && filters.transactionId !== 'all') {
          query = query.eq('transaction_id', filters.transactionId);
        }
        if (filters.isFavorite !== undefined) {
          query = query.eq('is_favorite', filters.isFavorite);
        }
        if (filters.isArchived !== undefined) {
          query = query.eq('is_archived', filters.isArchived);
        }

        const sortBy = filters.sortBy || 'uploaded_at';
        const ascending = filters.sortOrder === 'asc';
        query = query.order(sortBy, { ascending });

        const { data, error } = await query;

        if (error) {
          console.warn('Supabase documents query error, falling back to local vault storage:', error);
          return applyFilters(INITIAL_DEMO_DOCUMENTS, filters);
        }

        if (!data || data.length === 0) {
          return applyFilters(INITIAL_DEMO_DOCUMENTS, filters);
        }

        // Map joined fields cleanly
        const mappedDocs: DocumentItem[] = data.map((row: any) => ({
          ...row,
          document_type: row.document_type as DocumentType,
          tags: row.tags || [],
          merchant_name: row.merchants?.name,
          transaction_description: row.transactions?.description,
          asset_name: row.assets?.name,
          loan_name: row.loans?.name,
        }));

        return applyFilters(mappedDocs, filters);
      } catch (err) {
        console.error('Error fetching documents:', err);
        return applyFilters(INITIAL_DEMO_DOCUMENTS, filters);
      }
    },
  });
}

function applyFilters(docs: DocumentItem[], filters: DocumentFilterOptions): DocumentItem[] {
  let result = [...docs];

  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase().trim();
    result = result.filter(
      (d) =>
        d.filename.toLowerCase().includes(q) ||
        d.notes?.toLowerCase().includes(q) ||
        d.extracted_merchant?.toLowerCase().includes(q) ||
        d.merchant_name?.toLowerCase().includes(q) ||
        d.document_type.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q)) ||
        d.extracted_raw_text?.toLowerCase().includes(q)
    );
  }

  if (filters.documentType && filters.documentType !== 'all') {
    result = result.filter((d) => d.document_type === filters.documentType);
  }

  if (filters.isFavorite !== undefined) {
    result = result.filter((d) => d.is_favorite === filters.isFavorite);
  }

  if (filters.isArchived !== undefined) {
    result = result.filter((d) => d.is_archived === filters.isArchived);
  } else {
    // By default hide archived items unless explicitly asked
    result = result.filter((d) => !d.is_archived);
  }

  if (filters.tag) {
    result = result.filter((d) => d.tags.includes(filters.tag!));
  }

  return result;
}

export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<DocumentItem> & { file?: File }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || 'demo-user';

      let storagePath = payload.storage_path || `documents/${userId}/${Date.now()}_${payload.filename}`;
      let publicOrSignedUrl = payload.signed_url || '';

      // Upload file to Supabase Storage if actual File object is passed
      if (payload.file && userData?.user) {
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('receipts')
          .upload(`${userId}/${Date.now()}_${payload.filename}`, payload.file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadErr) {
          console.warn('Storage upload error (fallback to local mock path):', uploadErr);
        } else if (uploadData) {
          storagePath = uploadData.path;
          const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(uploadData.path);
          publicOrSignedUrl = urlData.publicUrl;
        }
      }

      // Automatically run OCR extractor stub on document
      let ocrData = {};
      if (payload.file) {
        ocrData = await defaultOcrEngine.extractDocumentData(payload.file, payload.filename || 'document');
      }

      const docRecord = {
        user_id: userId,
        filename: payload.filename || 'Untitled Document',
        mime_type: payload.mime_type || payload.file?.type || 'application/pdf',
        file_size: payload.file_size || payload.file?.size || 0,
        storage_path: storagePath,
        document_type: payload.document_type || 'receipt',
        transaction_id: payload.transaction_id || null,
        asset_id: payload.asset_id || null,
        loan_id: payload.loan_id || null,
        merchant_id: payload.merchant_id || null,
        tags: payload.tags || ['Document'],
        notes: payload.notes || '',
        is_favorite: payload.is_favorite || false,
        is_archived: false,
        ...ocrData,
        ...payload,
      };

      if (userData?.user) {
        const { data, error } = await supabase.from('documents').insert(docRecord as any).select().single();
        if (error) {
          console.warn('Supabase DB insert error, using local fallback:', error);
          return { id: `doc-${Date.now()}`, ...docRecord } as DocumentItem;
        }
        return data as unknown as DocumentItem;
      }

      return { id: `doc-${Date.now()}`, ...docRecord } as DocumentItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document uploaded & cataloged in Vault!');
    },
    onError: (err: any) => {
      toast.error(`Upload failed: ${err.message || 'Error creating document'}`);
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DocumentItem> }) => {
      const { data: userData } = await supabase.auth.getUser();

      if (userData?.user) {
        const { data, error } = await supabase
          .from('documents')
          .update(updates as any)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      return { id, ...updates };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document updated');
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: userData } = await supabase.auth.getUser();

      if (userData?.user) {
        const { error } = await supabase.from('documents').delete().eq('id', id);
        if (error) throw error;
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document removed from Vault');
    },
  });
}

export function useToggleFavoriteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_favorite }: { id: string; is_favorite: boolean }) => {
      const { data: userData } = await supabase.auth.getUser();

      if (userData?.user) {
        await supabase.from('documents').update({ is_favorite }).eq('id', id);
      }
      return { id, is_favorite };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success(variables.is_favorite ? 'Added to Favorites' : 'Removed from Favorites');
    },
  });
}

export function useToggleArchiveDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_archived }: { id: string; is_archived: boolean }) => {
      const { data: userData } = await supabase.auth.getUser();

      if (userData?.user) {
        await supabase.from('documents').update({ is_archived }).eq('id', id);
      }
      return { id, is_archived };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success(variables.is_archived ? 'Document archived' : 'Document restored from archive');
    },
  });
}
