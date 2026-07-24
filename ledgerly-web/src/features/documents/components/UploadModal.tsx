import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { DocumentDropzone } from './DocumentDropzone';
import { DocumentType } from '@/types/documents';

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId?: string;
  assetId?: string;
  loanId?: string;
  merchantId?: string;
  defaultType?: DocumentType;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  open,
  onOpenChange,
  transactionId,
  assetId,
  loanId,
  merchantId,
  defaultType,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl sm:max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            Upload Financial Document
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Add receipts, warranties, tax documents, or invoices to your Ledgerly Document Vault.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          <DocumentDropzone
            transactionId={transactionId}
            assetId={assetId}
            loanId={loanId}
            merchantId={merchantId}
            defaultType={defaultType}
            onSuccess={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
