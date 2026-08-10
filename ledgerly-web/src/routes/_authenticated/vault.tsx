import { createFileRoute } from "@tanstack/react-router";
import { ReceiptVault } from "@/features/documents/components/ReceiptVault";

import { CapabilityGuard } from "@/components/CapabilityGuard";

export const Route = createFileRoute("/_authenticated/vault")({
  component: () => (
    <CapabilityGuard capability="vault">
      <ReceiptVault />
    </CapabilityGuard>
  ),
});
