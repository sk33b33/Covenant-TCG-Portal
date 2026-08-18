import type { Metadata } from "next";
import { requireUser, getUserWithProfile } from "@/lib/auth/current-user";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Connected game",
  robots: { index: false },
};

const statusCopy: Record<string, { label: string; tone: "neutral" | "arcane" | "success" }> = {
  NOT_LINKED: { label: "Not linked", tone: "neutral" },
  PENDING: { label: "Pending", tone: "arcane" },
  LINKED: { label: "Linked", tone: "success" },
};

export default async function GameConnectionPage() {
  const authUser = await requireUser();
  const user = await getUserWithProfile(authUser.id);
  const status = user.gameLink?.status ?? "NOT_LINKED";
  const { label, tone } = statusCopy[status] ?? statusCopy.NOT_LINKED;

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl text-parchment">Connected game</h1>
      <p className="mt-1 text-sm text-muted">
        The status of your website account&apos;s connection to your in-game player identity.
      </p>

      <Card className="mt-6 p-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-parchment">Status</span>
          <Badge tone={tone}>{label}</Badge>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted">
          Covenant&apos;s game client doesn&apos;t exist yet, so there&apos;s nothing to link to
          today. When it does, you&apos;ll be able to sign in to the game with this same account,
          and this page will show your linked in-game identity, game version, and when the
          connection was made — instead of this placeholder.
        </p>

        {user.gameLink?.gamePlayerId ? (
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted">Game player ID</dt>
              <dd className="mt-0.5 text-parchment">{user.gameLink.gamePlayerId}</dd>
            </div>
            {user.gameLink.linkedAt ? (
              <div>
                <dt className="text-muted">Linked</dt>
                <dd className="mt-0.5 text-parchment">
                  {user.gameLink.linkedAt.toLocaleDateString()}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </Card>
    </div>
  );
}
