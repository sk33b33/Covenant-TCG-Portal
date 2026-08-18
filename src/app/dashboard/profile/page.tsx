import type { Metadata } from "next";
import { requireUser, getUserWithProfile } from "@/lib/auth/current-user";
import { Card } from "@/components/ui/Card";
import { UpdateProfileForm } from "@/components/dashboard/UpdateProfileForm";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false },
};

export default async function ProfilePage() {
  const authUser = await requireUser();
  const user = await getUserWithProfile(authUser.id);

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl text-parchment">Profile</h1>
      <p className="mt-1 text-sm text-muted">
        This is your public identity — the name and bio shown on leaderboards and, eventually,
        in-game.
      </p>

      <Card className="mt-6 p-6">
        <UpdateProfileForm displayName={user.profile?.displayName ?? ""} bio={user.profile?.bio ?? null} />
      </Card>
    </div>
  );
}
