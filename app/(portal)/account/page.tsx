import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABEL, SIDE_LABEL } from "@/lib/constants";
import { requireUser } from "@/lib/session";
import { doSignOut } from "@/app/(portal)/sign-out-action";
import { Button } from "@/components/ui/button";

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-8 py-8">
      <header className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          Account
        </p>
        <h1 className="font-serif text-3xl font-light tracking-tight text-[var(--text-primary)]">
          {user.name}
        </h1>
      </header>

      <Card>
        <CardContent className="grid gap-0 p-0">
          <Row label="Email" value={user.email} />
          <Separator />
          <Row label="Title" value={user.title ?? "Not set"} />
          <Separator />
          <Row label="Side" value={SIDE_LABEL[user.side] ?? user.side} />
          <Separator />
          <Row label="Role" value={ROLE_LABEL[user.role] ?? user.role} />
          <Separator />
          <Row
            label="Can Approve"
            value={
              <Badge variant={user.canApprove ? "green" : "default"}>
                {user.canApprove ? "Yes" : "No"}
              </Badge>
            }
          />
        </CardContent>
      </Card>

      <form action={doSignOut}>
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 px-6 py-4">
      <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
        {label}
      </span>
      <span className="text-sm text-[var(--text-primary)]">{value}</span>
    </div>
  );
}
