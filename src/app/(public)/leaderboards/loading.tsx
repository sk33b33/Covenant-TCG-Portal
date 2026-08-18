import { Container } from "@/components/layout/Container";
import { LoadingState } from "@/components/ui/DataStates";

export default function Loading() {
  return (
    <Container className="py-16">
      <LoadingState label="Loading leaderboard…" />
    </Container>
  );
}
