import { BankStatements } from "@/components/portal/bank-statements";
import { BANK_ACCOUNTS_ORDER } from "@/lib/constants";
import {
  canApproveSide,
  canEdit,
  canUpload,
  type SessionUser,
} from "@/lib/rbac";
import { requireUser } from "@/lib/session";
import {
  computeCombinedStatus,
  daysUntil,
  listBankStatements,
  nextMondayDeadline,
} from "@/lib/services/bank-statements";

export const dynamic = "force-dynamic";

export default async function WireConditionsPage() {
  const user = (await requireUser()) as SessionUser;
  const rows = await listBankStatements();

  const combinedStatus = computeCombinedStatus(rows, BANK_ACCOUNTS_ORDER);
  const nextDeadline = nextMondayDeadline();
  const daysLeft = daysUntil(nextDeadline);

  return (
    <BankStatements
      accounts={BANK_ACCOUNTS_ORDER}
      combinedStatus={combinedStatus}
      daysUntilNextDeadline={daysLeft}
      nextDeadlineIso={nextDeadline.toISOString()}
      canUpload={canUpload(user)}
      canReview={canApproveSide(user, "OMOY")}
      canEdit={canEdit(user)}
      currentUserId={user.id}
      statements={rows.map((r) => ({
        id: r.id,
        account: r.account,
        weekOf: r.weekOf.toISOString(),
        fileId: r.fileId,
        filename: r.filename,
        sizeBytes: r.sizeBytes,
        uploadedAt: r.uploadedAt.toISOString(),
        uploadedBy: r.uploadedBy,
        reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
        reviewedBy: r.reviewedBy,
      }))}
    />
  );
}
