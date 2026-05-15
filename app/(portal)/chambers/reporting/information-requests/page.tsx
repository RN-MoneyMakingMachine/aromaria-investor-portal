import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { InformationRequestStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatTimestamp } from "@/lib/dates";
import { isNikaidoFamilyMember, isOmoyInvestor } from "@/lib/rbac";
import { requireUser } from "@/lib/session";
import {
  getQuarterlySubstantiveCount,
  listInformationRequests,
} from "@/lib/services/information-requests";

const STATUS_LABEL: Record<InformationRequestStatus, string> = {
  SUBMITTED: "Submitted",
  ACKNOWLEDGED: "Acknowledged",
  IN_PROGRESS: "In progress",
  DELIVERED: "Delivered",
  DECLINED: "Declined",
};

const STATUS_TONE: Record<InformationRequestStatus, string> = {
  SUBMITTED: "var(--text-tertiary)",
  ACKNOWLEDGED: "var(--accent-blue)",
  IN_PROGRESS: "var(--accent-amber)",
  DELIVERED: "var(--accent-green)",
  DECLINED: "var(--accent-red)",
};

export default async function InformationRequestsPage() {
  const user = await requireUser();
  const [requests, counter] = await Promise.all([
    listInformationRequests(100),
    getQuarterlySubstantiveCount(),
  ]);
  const canRequest = isNikaidoFamilyMember(user) || isOmoyInvestor(user);

  return (
    <div className="flex flex-col gap-10 py-6">
      <div>
        <Link
          href="/chambers/reporting"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
        >
          <ArrowLeft className="h-3 w-3" />
          Reporting
        </Link>
      </div>

      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            Reporting Policy · Investor information requests
          </p>
          <h1 className="font-serif text-3xl font-light tracking-tight text-[var(--text-primary)] md:text-4xl">
            Information requests
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {counter.used} of {counter.cap} substantive requests this quarter (
            {counter.quarterLabel}). SLA: acknowledged within 3 business days,
            delivered within 30 business days.
          </p>
        </div>
        {canRequest ? (
          <Button asChild variant="primary" size="sm">
            <Link href="/chambers/reporting/information-requests/new">
              Make a request
            </Link>
          </Button>
        ) : null}
      </header>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-xs uppercase tracking-widest text-[var(--text-tertiary)]">
            No information requests on file.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-col gap-2 p-5 md:p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="font-serif text-lg font-light tracking-tight text-[var(--text-primary)]">
                    {r.subject}
                  </h2>
                  <span
                    className="text-[10px] uppercase tracking-widest"
                    style={{ color: STATUS_TONE[r.status] }}
                  >
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-[var(--text-secondary)]">
                  {r.body}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                  <span>{r.author.name}</span>
                  <span>·</span>
                  <span>{formatTimestamp(r.createdAt)}</span>
                  {r.isSubstantive ? (
                    <>
                      <span>·</span>
                      <span>Substantive</span>
                    </>
                  ) : null}
                  {r.acknowledgedAt ? (
                    <>
                      <span>·</span>
                      <span>Ack {formatTimestamp(r.acknowledgedAt)}</span>
                    </>
                  ) : null}
                  {r.deliveredAt ? (
                    <>
                      <span>·</span>
                      <span>Delivered {formatTimestamp(r.deliveredAt)}</span>
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
