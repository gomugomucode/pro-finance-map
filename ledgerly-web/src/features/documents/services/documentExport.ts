import { DocumentItem } from '@/types/documents';

/**
 * Export Document Metadata as JSON file
 */
export function exportDocumentsToJson(documents: DocumentItem[], filename = 'ledgerly_documents_backup.json') {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(documents, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Generate Printable PDF / HTML Package Summary for Financial Audits & Tax Filing
 */
export function exportDocumentSummaryReport(documents: DocumentItem[], reportTitle = 'Ledgerly Financial Evidence Audit Report') {
  const reportWindow = window.open('', '_blank');
  if (!reportWindow) {
    alert('Please allow popups to generate the printable document report.');
    return;
  }

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalValue = documents.reduce((sum, d) => sum + (d.extracted_total || 0), 0);

  const rowsHtml = documents
    .map(
      (doc, i) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${i + 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
        <strong style="display: block; color: #0f172a;">${escapeHtml(doc.filename)}</strong>
        <span style="font-size: 11px; color: #64748b;">${escapeHtml(doc.mime_type)} • ${(doc.file_size / 1024).toFixed(1)} KB</span>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-transform: capitalize;">
        <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; background-color: #f1f5f9; font-size: 11px; font-weight: 600; color: #475569;">
          ${doc.document_type}
        </span>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(doc.extracted_merchant || doc.merchant_name || '—')}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${doc.extracted_date || new Date(doc.uploaded_at).toLocaleDateString()}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">
        ${doc.extracted_total ? '$' + doc.extracted_total.toFixed(2) : '—'}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
        ${doc.tags && doc.tags.length > 0 ? doc.tags.map(t => `#${t}`).join(', ') : 'None'}
      </td>
    </tr>
  `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${escapeHtml(reportTitle)}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; color: #1e293b; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
          .logo { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
          .meta { text-align: right; font-size: 12px; color: #64748b; }
          .stats { display: flex; gap: 20px; margin-bottom: 24px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .stat-card { flex: 1; }
          .stat-title { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
          .stat-value { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
          th { text-align: left; padding: 10px; background: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-weight: 700; color: #334155; }
          .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center; }
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="background: #0f172a; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;">
            Print / Save as PDF
          </button>
        </div>
        <div class="header">
          <div>
            <div class="logo">LEDGERLY</div>
            <div style="font-size: 14px; font-weight: 600; color: #475569; margin-top: 4px;">Receipt & Document Vault Audit Summary</div>
          </div>
          <div class="meta">
            <div>Generated: <strong>${dateStr}</strong></div>
            <div>Total Records: <strong>${documents.length}</strong></div>
          </div>
        </div>

        <div class="stats">
          <div class="stat-card">
            <div class="stat-title">Total Documents</div>
            <div class="stat-value">${documents.length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Extracted Total Sum</div>
            <div class="stat-value">$${totalValue.toFixed(2)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Receipts Count</div>
            <div class="stat-value">${documents.filter((d) => d.document_type === 'receipt').length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Invoices & Bills</div>
            <div class="stat-value">${documents.filter((d) => d.document_type === 'invoice' || d.document_type === 'bill').length}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Document Name</th>
              <th>Type</th>
              <th>Merchant / Entity</th>
              <th>Date</th>
              <th>Extracted Amount</th>
              <th>Tags</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          Ledgerly Financial OS — Confidential Document Package Report. Generated automatically.
        </div>
      </body>
    </html>
  `;

  reportWindow.document.write(htmlContent);
  reportWindow.document.close();
}

/**
 * Package documents into ZIP Archive manifest & trigger batch download
 */
export async function downloadDocumentsZipArchive(documents: DocumentItem[]) {
  if (documents.length === 0) return;

  // Create a manifest JSON file inside the download batch
  const manifest = {
    generated_at: new Date().toISOString(),
    document_count: documents.length,
    documents: documents.map((d) => ({
      id: d.id,
      filename: d.filename,
      type: d.document_type,
      storage_path: d.storage_path,
      extracted_merchant: d.extracted_merchant,
      extracted_total: d.extracted_total,
      tags: d.tags,
    })),
  };

  // Export metadata backup alongside instructing batch download
  exportDocumentsToJson(documents, `ledgerly_archive_manifest_${Date.now()}.json`);

  // Trigger browser file download for documents with URLs or download links
  for (const doc of documents) {
    if (doc.signed_url) {
      const a = document.createElement('a');
      a.href = doc.signed_url;
      a.download = doc.filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Brief pause between downloads to avoid browser popup blocks
      await new Promise((r) => setTimeout(r, 200));
    }
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
