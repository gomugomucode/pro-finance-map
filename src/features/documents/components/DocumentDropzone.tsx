import React, { useRef, useEffect } from 'react';
import { useDocumentUpload } from '../hooks/useDocumentUpload';
import { DocumentType } from '@/types/documents';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Camera,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Tag,
  Paperclip,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DocumentDropzoneProps {
  transactionId?: string;
  assetId?: string;
  loanId?: string;
  merchantId?: string;
  defaultType?: DocumentType;
  onSuccess?: () => void;
}

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'receipt', label: 'Receipt' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'bill', label: 'Bill' },
  { value: 'warranty', label: 'Warranty Card' },
  { value: 'tax', label: 'Tax Document' },
  { value: 'statement', label: 'Bank/Card Statement' },
  { value: 'insurance', label: 'Insurance Policy' },
  { value: 'manual', label: 'Manual/Guide' },
  { value: 'registration', label: 'Registration' },
  { value: 'photo', label: 'Proof Photo' },
  { value: 'other', label: 'Other Document' },
];

export const DocumentDropzone: React.FC<DocumentDropzoneProps> = ({
  transactionId,
  assetId,
  loanId,
  merchantId,
  defaultType,
  onSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);

  const {
    queue,
    isUploading,
    addFilesToQueue,
    handlePasteEvent,
    removeItem,
    updateItem,
    processQueue,
    clearCompleted,
  } = useDocumentUpload({
    transactionId,
    assetId,
    loanId,
    merchantId,
    defaultType,
    onSuccess,
  });

  // Attach global paste listener to dropzone container
  useEffect(() => {
    const pasteHandler = (e: ClipboardEvent) => handlePasteEvent(e);
    window.addEventListener('paste', pasteHandler);
    return () => window.removeEventListener('paste', pasteHandler);
  }, [handlePasteEvent]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Target Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
          isDragOver
            ? 'border-primary bg-primary/5 scale-[0.99]'
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
          className="hidden"
          onChange={handleFileChange}
        />

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm">
            <Upload className="h-7 w-7" />
          </div>

          <div>
            <h4 className="text-base font-semibold tracking-tight text-foreground">
              Drop receipts & documents here
            </h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Supports PDFs, Images (JPEG, PNG, WebP), Invoices & Warranties up to 15MB. Or paste directly from clipboard!
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-medium"
            >
              <Paperclip className="h-3.5 w-3.5 mr-1.5" />
              Browse Files
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => cameraInputRef.current?.click()}
              className="text-xs font-medium"
            >
              <Camera className="h-3.5 w-3.5 mr-1.5" />
              Camera Snap
            </Button>
          </div>
        </div>
      </div>

      {/* Queue List & Multi-file Upload Controls */}
      {queue.length > 0 && (
        <div className="border border-border rounded-xl bg-card p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h5 className="text-sm font-semibold">
                Upload Queue ({queue.length} file{queue.length > 1 ? 's' : ''})
              </h5>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearCompleted}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear Completed
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={processQueue}
                disabled={isUploading || queue.every((i) => i.status === 'completed')}
                className="text-xs font-semibold"
              >
                {isUploading && <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Upload All to Vault
              </Button>
            </div>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {queue.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-muted/40 border border-border/60 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt="preview"
                      className="h-10 w-10 rounded object-cover border shrink-0 bg-background"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">{item.file.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {(item.file.size / 1024).toFixed(1)} KB • {item.file.type || 'Document'}
                    </p>

                    {item.status === 'uploading' && (
                      <Progress value={item.progress} className="h-1.5 mt-1.5" />
                    )}

                    {item.status === 'error' && (
                      <span className="text-destructive text-[11px] flex items-center gap-1 mt-1 font-medium">
                        <AlertCircle className="h-3 w-3" />
                        {item.errorMsg || 'Upload error'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Controls per item */}
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                  <Select
                    value={item.documentType}
                    onValueChange={(val: DocumentType) => updateItem(item.id, { documentType: val })}
                  >
                    <SelectTrigger className="h-7 text-xs w-[130px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((dt) => (
                        <SelectItem key={dt.value} value={dt.value} className="text-xs">
                          {dt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {item.status === 'completed' ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[11px]">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Uploaded
                    </Badge>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
