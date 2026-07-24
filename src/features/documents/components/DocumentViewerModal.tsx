import React, { useState } from 'react';
import { DocumentItem } from '@/types/documents';
import {
  useUpdateDocument,
  useDeleteDocument,
  useToggleFavoriteDocument,
  useToggleArchiveDocument,
} from '../hooks/useDocuments';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Trash2,
  Star,
  Archive,
  Edit2,
  Check,
  FileText,
  Sparkles,
  Calendar,
  DollarSign,
  Store,
  Tag,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

interface DocumentViewerModalProps {
  document: DocumentItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document: doc,
  open,
  onOpenChange,
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotationDegree, setRotationDegree] = useState(0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  const updateMutation = useUpdateDocument();
  const deleteMutation = useDeleteDocument();
  const favoriteMutation = useToggleFavoriteDocument();
  const archiveMutation = useToggleArchiveDocument();

  if (!doc) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 50));
  const handleResetZoom = () => {
    setZoomLevel(100);
    setRotationDegree(0);
  };
  const handleRotateRight = () => setRotationDegree((prev) => (prev + 90) % 360);

  const handleSaveTitle = () => {
    if (!titleInput.trim()) return;
    updateMutation.mutate({
      id: doc.id,
      updates: { filename: titleInput.trim() },
    });
    setIsEditingTitle(false);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^#/, '');
      if (!doc.tags.includes(newTag)) {
        updateMutation.mutate({
          id: doc.id,
          updates: { tags: [...doc.tags, newTag] },
        });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateMutation.mutate({
      id: doc.id,
      updates: { tags: doc.tags.filter((t) => t !== tagToRemove) },
    });
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${doc.filename}"?`)) {
      deleteMutation.mutate(doc.id, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const handleDownload = () => {
    if (doc.signed_url) {
      const a = window.document.createElement('a');
      a.href = doc.signed_url;
      a.download = doc.filename;
      a.click();
    } else {
      // Direct mock blob download for demo files
      const blob = new Blob([`Ledgerly Vault Document: ${doc.filename}\nType: ${doc.document_type}\nMerchant: ${doc.extracted_merchant || 'N/A'}`], { type: doc.mime_type });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.filename;
      a.click();
      URL.revokeObjectURL(url);
    }
    toast.success(`Downloading ${doc.filename}...`);
  };

  const isImage = doc.mime_type.startsWith('image/') || doc.filename.match(/\.(png|jpe?g|webp)$/i);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl sm:max-w-5xl h-[85vh] flex flex-col p-0 bg-card border-border overflow-hidden">
        {/* Header Bar */}
        <DialogHeader className="p-4 border-b border-border bg-muted/20 flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <FileText className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    className="h-8 text-sm font-semibold max-w-sm"
                    autoFocus
                  />
                  <Button size="sm" className="h-8 px-2" onClick={handleSaveTitle}>
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-bold truncate text-foreground">
                    {doc.filename}
                  </DialogTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setTitleInput(doc.filename);
                      setIsEditingTitle(true);
                    }}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <Badge variant="secondary" className="capitalize text-[10px]">
                  {doc.document_type}
                </Badge>
                <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                <span>• Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${doc.is_favorite ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`}
              onClick={() => favoriteMutation.mutate({ id: doc.id, is_favorite: !doc.is_favorite })}
            >
              <Star className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${doc.is_archived ? 'text-blue-500' : 'text-muted-foreground'}`}
              onClick={() => archiveMutation.mutate({ id: doc.id, is_archived: !doc.is_archived })}
            >
              <Archive className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content Body Split (Viewer + Metadata Panel) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Document Display Area */}
          <div className="flex-1 bg-black/5 dark:bg-black/40 flex flex-col relative overflow-hidden">
            {/* Viewer Floating Controls */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-background/90 backdrop-blur border border-border rounded-full px-3 py-1 flex items-center gap-1 shadow-md text-xs">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleZoomOut}>
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="font-mono text-[11px] px-1 min-w-[40px] text-center">{zoomLevel}%</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleZoomIn}>
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <div className="h-3 w-[1px] bg-border mx-1" />
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRotateRight}>
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleResetZoom}>
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Document Render Canvas */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-6 min-h-[300px]">
              {isImage ? (
                <div
                  className="transition-transform duration-200 ease-out origin-center"
                  style={{
                    transform: `scale(${zoomLevel / 100}) rotate(${rotationDegree}deg)`,
                  }}
                >
                  <img
                    src={doc.signed_url || doc.thumbnail_path || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=60'}
                    alt={doc.filename}
                    className="max-h-[60vh] rounded-lg shadow-xl object-contain border border-border"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-card rounded-xl p-8 border border-border max-w-xl text-center space-y-4">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <FileText className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{doc.filename}</h3>
                    <p className="text-xs text-muted-foreground mt-1">PDF / Document File Preview</p>
                  </div>
                  <Button size="sm" onClick={handleDownload} className="font-semibold text-xs">
                    <Download className="h-4 w-4 mr-2" />
                    Download File to View
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Metadata & OCR Panel */}
          <div className="w-full md:w-80 border-l border-border bg-card p-4 overflow-y-auto flex flex-col space-y-5 shrink-0">
            <Tabs defaultValue="ocr" className="w-full">
              <TabsList className="w-full grid grid-cols-2 h-8 text-xs">
                <TabsTrigger value="ocr" className="text-xs">
                  <Sparkles className="h-3.5 w-3.5 mr-1 text-primary" />
                  OCR Extraction
                </TabsTrigger>
                <TabsTrigger value="details" className="text-xs">
                  Details & Tags
                </TabsTrigger>
              </TabsList>

              {/* OCR Tab */}
              <TabsContent value="ocr" className="space-y-4 pt-3">
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-primary flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      OCR Status
                    </span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                      {doc.ocr_confidence ? `${doc.ocr_confidence}% confidence` : 'Completed'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Provider: <span className="font-mono text-foreground">{doc.ocr_provider || 'ledgerly_local_ocr'}</span>
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-2 rounded bg-muted/40">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Store className="h-3.5 w-3.5" /> Merchant
                    </span>
                    <span className="font-semibold">{doc.extracted_merchant || doc.merchant_name || 'Not detected'}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-muted/40">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5" /> Total Extracted
                    </span>
                    <span className="font-bold text-foreground">
                      {doc.extracted_total ? `$${doc.extracted_total.toFixed(2)}` : 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-muted/40">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Document Date
                    </span>
                    <span className="font-medium">{doc.extracted_date || 'N/A'}</span>
                  </div>
                </div>

                {doc.extracted_raw_text && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Extracted Raw Text</label>
                    <div className="p-2.5 rounded-lg bg-muted/50 border border-border font-mono text-[11px] leading-relaxed max-h-36 overflow-y-auto text-foreground/80">
                      {doc.extracted_raw_text}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Details & Tags Tab */}
              <TabsContent value="details" className="space-y-4 pt-3">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-primary" /> Tags
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {doc.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs py-0.5 px-2">
                        #{t}
                        <button
                          onClick={() => handleRemoveTag(t)}
                          className="ml-1 text-muted-foreground hover:text-foreground"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>

                  <Input
                    placeholder="Add tag and press Enter..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Notes & Evidence Details</label>
                  <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border leading-relaxed">
                    {doc.notes || 'No notes added to this document.'}
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
