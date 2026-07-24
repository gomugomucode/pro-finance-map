import { createFileRoute } from '@tanstack/react-router';
import { ReceiptVault } from '@/features/documents/components/ReceiptVault';

export const Route = createFileRoute('/_authenticated/vault')({
  component: ReceiptVault,
});
