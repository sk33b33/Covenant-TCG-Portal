import { cn } from "@/lib/cn";
import type { LeaderboardRow } from "@/lib/leaderboard";

export function LeaderboardTable({
  rows,
  highlightGamePlayerId,
}: {
  rows: LeaderboardRow[];
  highlightGamePlayerId?: string | null;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-panel-2 text-left text-xs uppercase tracking-wide text-muted">
            <th scope="col" className="px-4 py-3 font-medium">
              Rank
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Player
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Rating
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              W / L
            </th>
            <th scope="col" className="hidden px-4 py-3 text-right font-medium sm:table-cell">
              Matches
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isSelf = highlightGamePlayerId && row.gamePlayerId === highlightGamePlayerId;
            return (
              <tr
                key={row.gamePlayerId}
                className={cn(
                  "border-b border-line-soft last:border-0",
                  isSelf ? "bg-gold/10" : "bg-transparent",
                )}
              >
                <td className="px-4 py-3 font-display text-gold-bright">{row.rank}</td>
                <td className="px-4 py-3 text-parchment">
                  {row.displayName}
                  {isSelf ? <span className="ml-2 text-xs text-gold">(you)</span> : null}
                </td>
                <td className="px-4 py-3 text-right font-medium text-parchment">{row.rating}</td>
                <td className="px-4 py-3 text-right text-muted">
                  {row.wins} / {row.losses}
                </td>
                <td className="hidden px-4 py-3 text-right text-muted sm:table-cell">
                  {row.matchesPlayed}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
