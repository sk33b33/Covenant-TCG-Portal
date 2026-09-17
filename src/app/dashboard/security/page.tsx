import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/current-user";
import { getCurrentSession, listSessionsForUser } from "@/lib/auth/session";
import { revokeSessionAction } from "@/lib/actions/security";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChangePasswordForm } from "@/components/dashboard/ChangePasswordForm";
import { SetPasswordForm } from "@/components/dashboard/SetPasswordForm";
import { ResendVerificationButton } from "@/components/dashboard/ResendVerificationButton";

export const metadata: Metadata = {
  title: "Account security",
  robots: { index: false },
};

export default async function SecurityPage() {
  const user = await requireUser();
  const auth = await getCurrentSession();
  const [sessions, credentials] = await Promise.all([
    listSessionsForUser(user.id),
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { passwordHash: true, googleAccount: { select: { email: true } } },
    }),
  ]);
  const hasPassword = Boolean(credentials.passwordHash);
  const googleLinked = Boolean(credentials.googleAccount);

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-3xl text-parchment">Account security</h1>
        <p className="mt-1 text-sm text-muted">Manage your password, email, and active devices.</p>
      </div>

      {!user.emailVerified ? (
        <Card className="border-arcane/30 bg-arcane/5 p-5">
          <div className="flex items-center gap-2">
            <Badge tone="arcane">Unverified</Badge>
            <span className="text-sm text-parchment">Your email address isn&apos;t verified yet.</span>
          </div>
          <div className="mt-4">
            <ResendVerificationButton />
          </div>
        </Card>
      ) : null}

      <Card className="p-6">
        <h2 className="font-display text-lg text-parchment">
          {hasPassword ? "Change password" : "Set a password"}
        </h2>
        {!hasPassword ? (
          <p className="mt-1 text-sm text-muted">
            Your account currently signs in with Google only. Set a password to also be able to
            log in with email and password.
          </p>
        ) : null}
        <div className="mt-4">{hasPassword ? <ChangePasswordForm /> : <SetPasswordForm />}</div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg text-parchment">Connected accounts</h2>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-parchment">Google</span>
          <Badge tone={googleLinked ? "success" : "neutral"}>
            {googleLinked ? "Connected" : "Not connected"}
          </Badge>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg text-parchment">Active sessions</h2>
        <p className="mt-1 text-sm text-muted">
          Every device currently signed in to your account.
        </p>
        <ul className="mt-4 divide-y divide-line-soft">
          {sessions.map((session) => {
            const isCurrent = session.id === auth?.session.id;
            return (
              <li key={session.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-parchment">
                    {session.userAgent ?? "Unknown device"}
                    {isCurrent ? <span className="ml-2 text-xs text-gold">This device</span> : null}
                  </p>
                  <p className="text-xs text-faint">
                    Signed in {session.createdAt.toLocaleDateString()} · expires{" "}
                    {session.expiresAt.toLocaleDateString()}
                  </p>
                </div>
                {!isCurrent ? (
                  <form action={revokeSessionAction}>
                    <input type="hidden" name="sessionId" value={session.id} />
                    <Button type="submit" variant="ghost" size="md">
                      Sign out
                    </Button>
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
