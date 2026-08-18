import { z } from "zod";

export const matchSubmissionSchema = z.object({
  seasonSlug: z.string().min(1).max(160),
  winnerGamePlayerId: z.string().min(1).max(191),
  loserGamePlayerId: z.string().min(1).max(191),
  playedAt: z.string().min(1),
});
