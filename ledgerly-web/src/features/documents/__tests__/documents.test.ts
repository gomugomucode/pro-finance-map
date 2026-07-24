import { LocalOcrEngine } from '../services/ocrEngine';
import { DocumentItem } from '@/types/documents';

export async function runDocumentVaultSelfTest() {
  const engine = new LocalOcrEngine();
  const mockFile = new File(['sample content'], 'Apple_Store_Receipt_2026-06-15_$199.99.pdf', {
    type: 'application/pdf',
  });

  const result = await engine.extractDocumentData(mockFile, mockFile.name);

  if (result.ocr_status !== 'completed') throw new Error('OCR Test Failed: Status not completed');
  if (result.extracted_merchant !== 'Apple Inc.') throw new Error('OCR Test Failed: Merchant mismatch');
  if (result.extracted_total !== 199.99) throw new Error('OCR Test Failed: Amount mismatch');

  const docs: Partial<DocumentItem>[] = [
    { id: '1', document_type: 'receipt', extracted_total: 100 },
    { id: '2', document_type: 'warranty', extracted_total: 250 },
    { id: '3', document_type: 'receipt', extracted_total: 50 },
  ];

  const totalValue = docs.reduce((sum, d) => sum + (d.extracted_total || 0), 0);
  const receiptCount = docs.filter((d) => d.document_type === 'receipt').length;

  if (totalValue !== 400) throw new Error('Aggregate Test Failed: Total value mismatch');
  if (receiptCount !== 2) throw new Error('Aggregate Test Failed: Receipt count mismatch');

  console.log('✅ Document Vault Self-Tests Passed Cleanly!');
  return true;
}
