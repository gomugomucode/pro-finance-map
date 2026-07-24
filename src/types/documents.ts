export type DocumentType =
  | 'receipt'
  | 'invoice'
  | 'bill'
  | 'warranty'
  | 'tax'
  | 'statement'
  | 'insurance'
  | 'manual'
  | 'registration'
  | 'photo'
  | 'other';

export type OcrStatus = 'unprocessed' | 'pending' | 'completed' | 'failed';

export interface OcrExtractedData {
  ocr_status: OcrStatus;
  ocr_confidence?: number | null;
  extracted_merchant?: string | null;
  extracted_date?: string | null;
  extracted_total?: number | null;
  extracted_tax?: number | null;
  extracted_category?: string | null;
  extracted_raw_text?: string | null;
  ocr_provider?: string | null;
  ocr_processed_at?: string | null;
}

export interface DocumentItem {
  id: string;
  user_id: string;
  transaction_id: string | null;
  asset_id: string | null;
  loan_id: string | null;
  merchant_id: string | null;
  
  document_type: DocumentType;
  filename: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  thumbnail_path: string | null;
  
  tags: string[];
  notes: string | null;
  is_favorite: boolean;
  is_archived: boolean;
  
  // OCR Extracted Metadata
  ocr_status: OcrStatus;
  ocr_confidence: number | null;
  extracted_merchant: string | null;
  extracted_date: string | null;
  extracted_total: number | null;
  extracted_tax: number | null;
  extracted_category: string | null;
  extracted_raw_text: string | null;
  ocr_provider: string | null;
  ocr_processed_at: string | null;

  uploaded_at: string;
  created_at: string;
  updated_at: string;

  // Joined entity info (optional)
  merchant_name?: string;
  transaction_description?: string;
  asset_name?: string;
  loan_name?: string;
  signed_url?: string;
}

export interface DocumentFilterOptions {
  searchQuery?: string;
  documentType?: DocumentType | 'all';
  merchantId?: string | 'all';
  assetId?: string | 'all';
  loanId?: string | 'all';
  transactionId?: string | 'all';
  isFavorite?: boolean;
  isArchived?: boolean;
  startDate?: string;
  endDate?: string;
  tag?: string;
  sortBy?: 'uploaded_at' | 'filename' | 'file_size' | 'extracted_total';
  sortOrder?: 'asc' | 'desc';
}

export interface UploadProgressItem {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  errorMsg?: string;
  documentType: DocumentType;
  transactionId?: string;
  assetId?: string;
  loanId?: string;
  merchantId?: string;
  tags: string[];
  notes: string;
}
