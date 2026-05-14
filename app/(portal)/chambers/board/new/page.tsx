import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { canEdit } from "@/lib/rbac";
import { requireUser } from "@/lib/session";

import { NewMeetingForm } from "./new-meeting-form";

export default async function NewMeetingPage() {
  const user = await requireUser();
  if (!canEdit(user)) redirect("/chambers/board");

  return (
    <div className="flex flex-col gap-10 py-6">
      <header className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          <Link
            href="/chambers/board"
            className="hover:text-[var(--text-secondary)]"
          >
            Board meetings
          </Link>{" "}
          / New
        </p>
        <h1 className="font-serif text-3xl font-light tracking-tight text-[var(--text-primary)]">
          Schedule a meeting
        </h1>
      </header>

      <Card className="mx-auto w-full max-w-2xl">
        <CardContent className="p-8">
          <NewMeetingForm />
        </CardContent>
      </Card>
    </div>
  );
}
