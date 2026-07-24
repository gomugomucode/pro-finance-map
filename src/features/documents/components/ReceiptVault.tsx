import React, { useState } from 'react';
import { useDocuments, useDeleteDocument } from '../hooks/useDocuments';
import { DocumentItem, DocumentType, DocumentFilterOptions } from '@/types/documents';
import { DocumentViewerModal } from './DocumentViewerModal';
import { UploadModal } from './UploadModal';
import {
  exportDocumentsToJson,
  exportDocumentSummaryReport,
  downloadDocumentsZipArchive,
} from '../services/documentExport';
import {
  Search,
  Plus,
  Grid,
  List,
  Filter,
  FileText,
  Download,
  FileSpreadsheet,
  Archive,
  Star,
  Tag,
  Store,
  DollarSign,
  Calendar,
  Sparkles,
  Layers,
  Trash2,
  Eye,
  Paperclip,
  FolderArchive,
  CheckSquare,
  Square,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const ReceiptVault: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [activeTab, setActiveTab] = useState<'all' | 'receipts' | 'warranties' | 'taxes' | 'favorites' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<DocumentType | 'all'>('all');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  // Compute filters
  const filters: DocumentFilterOptions = {
    searchQuery,
    documentType: selectedType !== 'all' ? selectedType : undefined,
    isFavorite: activeTab === 'favorites' ? true : undefined,
    isArchived: activeTab === 'archived' ? true : false,
  };

  const { data: documents = [], isLoading, isError, refetch } = useDocuments(filters);
  const deleteMutation = useDeleteDocument();

  // Tab filtering logic override
  const filteredDocs = documents.filter((d) => {
    if (activeTab === 'receipts') return d.document_type === 'receipt';
    if (activeTab === 'warranties') return d.document_type === 'warranty';
    if (activeTab === 'taxes') return d.document_type === 'tax';
    if (activeTab === 'favorites') return d.is_favorite;
    if (activeTab === 'archived') return d.is_archived;
    return true;
  });

  // Calculate vault overview metrics
  const totalItems = filteredDocs.length;
  const totalValue = filteredDocs.reduce((acc, curr) => acc + (curr.extracted_total || 0), 0);
  const totalReceipts = filteredDocs.filter((d) => d.document_type === 'receipt').length;
  const totalWarranties = filteredDocs.filter((d) => d.document_type === 'warranty').length;

  const handleSelectAll = () => {
    if (selectedDocIds.length === filteredDocs.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(filteredDocs.map((d) => d.id));
    }
  };

  const toggleSelectDoc = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectedDocsList = filteredDocs.filter((d) => selectedDocIds.includes(d.id));

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Top Header & Core Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Receipt & Document Vault
            </h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-semibold text-xs">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Verified Repository
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Central evidence repository for receipts, warranties, tax files, invoices, and financial records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportDocumentSummaryReport(selectedDocsList.length > 0 ? selectedDocsList : filteredDocs)}
            className="text-xs font-semibold"
          >
            <FileSpreadsheet className="h-4 w-4 mr-1.5 text-emerald-600" />
            PDF Package
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadDocumentsZipArchive(selectedDocsList.length > 0 ? selectedDocsList : filteredDocs)}
            className="text-xs font-semibold"
          >
            <FolderArchive className="h-4 w-4 mr-1.5 text-blue-600" />
            ZIP Archive
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => exportDocumentsToJson(selectedDocsList.length > 0 ? selectedDocsList : filteredDocs)}
            className="text-xs font-semibold"
          >
            <Download className="h-4 w-4 mr-1.5" />
            JSON Backup
          </Button>

          <Button
            size="sm"
            onClick={() => setUploadModalOpen(true)}
            className="text-xs font-bold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vault Files</p>
              <h3 className="text-xl font-bold text-foreground mt-1">{totalItems}</h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Value</p>
              <h3 className="text-xl font-bold text-foreground mt-1">${totalValue.toFixed(2)}</h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Receipts</p>
              <h3 className="text-xl font-bold text-foreground mt-1">{totalReceipts}</h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Paperclip className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Warranties</p>
              <h3 className="text-xl font-bold text-foreground mt-1">{totalWarranties}</h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Search Filter Header */}
      <div className="space-y-3 bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Quick Filter Tabs */}
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full md:w-auto">
            <TabsList className="h-9 p-1 bg-muted/60 text-xs w-full md:w-auto grid grid-cols-3 sm:grid-cols-6">
              <TabsTrigger value="all" className="text-xs">All Files</TabsTrigger>
              <TabsTrigger value="receipts" className="text-xs">Receipts</TabsTrigger>
              <TabsTrigger value="warranties" className="text-xs">Warranties</TabsTrigger>
              <TabsTrigger value="taxes" className="text-xs">Tax Files</TabsTrigger>
              <TabsTrigger value="favorites" className="text-xs">Favorites</TabsTrigger>
              <TabsTrigger value="archived" className="text-xs">Archive</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search Input & View Switcher */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search filename, merchant, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <Select value={selectedType} onValueChange={(val: any) => setSelectedType(val)}>
              <SelectTrigger className="h-9 w-[130px] text-xs">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Types</SelectItem>
                <SelectItem value="receipt" className="text-xs">Receipt</SelectItem>
                <SelectItem value="invoice" className="text-xs">Invoice</SelectItem>
                <SelectItem value="bill" className="text-xs">Bill</SelectItem>
                <SelectItem value="warranty" className="text-xs">Warranty</SelectItem>
                <SelectItem value="tax" className="text-xs">Tax Document</SelectItem>
                <SelectItem value="statement" className="text-xs">Statement</SelectItem>
                <SelectItem value="insurance" className="text-xs">Insurance</SelectItem>
              </SelectContent>
            </Select>

            <div className="border border-border rounded-lg p-0.5 flex items-center bg-muted/40">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode('table')}
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Batch Selection Banner */}
        {selectedDocIds.length > 0 && (
          <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg p-2.5 text-xs">
            <span className="font-semibold text-primary">
              {selectedDocIds.length} item(s) selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs bg-background"
                onClick={() => downloadDocumentsZipArchive(selectedDocsList)}
              >
                Download Selected
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => setSelectedDocIds([])}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Vault Content Grid/Table Display */}
      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold">Loading Vault documents...</p>
        </div>
      ) : isError ? (
        <div className="py-12 text-center text-destructive space-y-2 border border-destructive/20 rounded-xl bg-destructive/5 p-6">
          <p className="font-semibold text-sm">Failed to load documents</p>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs">
            Retry
          </Button>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-xl py-16 px-4 text-center bg-card space-y-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
            <Layers className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">No documents found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Upload your first receipt, warranty card, or tax document to begin organizing your evidence repository.
            </p>
          </div>
          <Button size="sm" onClick={() => setUploadModalOpen(true)} className="text-xs font-bold">
            <Plus className="h-4 w-4 mr-1.5" />
            Upload Document
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View Card Layout */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocs.map((doc) => {
            const isSelected = selectedDocIds.includes(doc.id);
            return (
              <Card
                key={doc.id}
                className={`group relative overflow-hidden transition-all duration-200 hover:shadow-md border-border bg-card ${
                  isSelected ? 'ring-2 ring-primary border-primary' : ''
                }`}
              >
                {/* Selection Checkbox */}
                <button
                  onClick={() => toggleSelectDoc(doc.id)}
                  className="absolute top-3 left-3 z-10 text-muted-foreground hover:text-primary transition"
                >
                  {isSelected ? (
                    <CheckSquare className="h-5 w-5 text-primary fill-primary-foreground" />
                  ) : (
                    <Square className="h-5 w-5 opacity-0 group-hover:opacity-100 bg-background/80 rounded" />
                  )}
                </button>

                {/* Card Thumbnail / Header */}
                <div
                  className="h-36 bg-muted/40 flex items-center justify-center relative cursor-pointer overflow-hidden border-b border-border"
                  onClick={() => {
                    setSelectedDoc(doc);
                    setViewerOpen(true);
                  }}
                >
                  {doc.mime_type.startsWith('image/') || doc.thumbnail_path ? (
                    <img
                      src={doc.signed_url || doc.thumbnail_path || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=60'}
                      alt={doc.filename}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="h-10 w-10 text-primary/70" />
                      <span className="text-[11px] font-mono font-medium">PDF Document</span>
                    </div>
                  )}

                  <Badge className="absolute top-3 right-3 bg-background/90 text-foreground border border-border backdrop-blur text-[10px] capitalize font-semibold shadow-xs">
                    {doc.document_type}
                  </Badge>
                </div>

                {/* Card Details */}
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h4
                      className="font-bold text-xs sm:text-sm text-foreground truncate cursor-pointer hover:text-primary transition"
                      onClick={() => {
                        setSelectedDoc(doc);
                        setViewerOpen(true);
                      }}
                    >
                      {doc.filename}
                    </h4>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Store className="h-3 w-3 text-primary shrink-0" />
                      {doc.extracted_merchant || doc.merchant_name || 'Unassigned Merchant'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                    <span className="font-extrabold text-foreground">
                      {doc.extracted_total ? `$${doc.extracted_total.toFixed(2)}` : 'No amount'}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Tags */}
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {doc.tags.slice(0, 2).map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px] py-0 px-1.5 font-medium">
                          #{t}
                        </Badge>
                      ))}
                      {doc.tags.length > 2 && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          +{doc.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Table View Layout */
        <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="p-3 w-10">
                    <button onClick={handleSelectAll}>
                      {selectedDocIds.length === filteredDocs.length ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3">Document Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Merchant</th>
                  <th className="p-3">Extracted Amount</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDocs.map((doc) => {
                  const isSelected = selectedDocIds.includes(doc.id);
                  return (
                    <tr key={doc.id} className="hover:bg-muted/30 transition">
                      <td className="p-3">
                        <button onClick={() => toggleSelectDoc(doc.id)}>
                          {isSelected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                        </button>
                      </td>
                      <td className="p-3 font-semibold text-foreground">
                        <button
                          onClick={() => {
                            setSelectedDoc(doc);
                            setViewerOpen(true);
                          }}
                          className="hover:text-primary text-left truncate max-w-xs font-semibold block"
                        >
                          {doc.filename}
                        </button>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="capitalize text-[10px]">
                          {doc.document_type}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {doc.extracted_merchant || doc.merchant_name || '—'}
                      </td>
                      <td className="p-3 font-bold text-foreground">
                        {doc.extracted_total ? `$${doc.extracted_total.toFixed(2)}` : '—'}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setViewerOpen(true);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal open={uploadModalOpen} onOpenChange={setUploadModalOpen} />

      {/* Viewer Modal */}
      <DocumentViewerModal document={selectedDoc} open={viewerOpen} onOpenChange={setViewerOpen} />
    </div>
  );
};
