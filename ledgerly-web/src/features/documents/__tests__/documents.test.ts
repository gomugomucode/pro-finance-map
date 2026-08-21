import { describe, it, expect } from "vitest";
import { LocalOcrEngine } from "../services/ocrEngine";
import { DocumentItem } from "@/types/documents";

describe("Document Vault & Local OCR Engine", () => {
  it("extracts merchant and amount from receipt filenames", async () => {
    const engine = new LocalOcrEngine();
    const mockFile = new File(["sample content"], "Apple_Store_Receipt_2026-06-15_$199.99.pdf", {
      type: "application/pdf",
    });

    const result = await engine.extractDocumentData(mockFile, mockFile.name);

    expect(result.ocr_status).toBe("completed");
    expect(result.extracted_merchant).toBe("Apple Inc.");
    expect(result.extracted_total).toBe(199.99);
  });

  it("calculates document vault aggregations", () => {
    const docs: Partial<DocumentItem>[] = [
      { id: "1", document_type: "receipt", extracted_total: 100 },
      { id: "2", document_type: "warranty", extracted_total: 250 },
      { id: "3", document_type: "receipt", extracted_total: 50 },
    ];

    const totalValue = docs.reduce((sum, d) => sum + (d.extracted_total || 0), 0);
    const receiptCount = docs.filter((d) => d.document_type === "receipt").length;

    expect(totalValue).toBe(400);
    expect(receiptCount).toBe(2);
  });
});
