import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { MilkyWayCanvas } from "@/components/galaxy/MilkyWayCanvas";
import { milkyWay } from "@/lib/galaxy/milky-way-data";

export const metadata: Metadata = {
  title: "Milky Way",
  description: "A procedurally generated, top-down visualization of the Milky Way's spiral arms.",
};

export default function GalaxyPage() {
  return (
    <Container className="py-16">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl text-parchment">The Milky Way</h1>
        <p className="mt-4 text-lg text-muted">
          A logarithmic-spiral visualization of our home galaxy, generated from the same four
          major arms astronomers use to map it — each arm scattered with a Gaussian profile
          across its width and thickness.
        </p>
      </div>

      <Card className="mt-10 p-4 sm:p-6">
        <MilkyWayCanvas />
      </Card>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {milkyWay.majorArms.map((arm) => (
          <div key={arm.name} className="flex items-start gap-3 rounded-lg border border-line bg-panel/60 p-4">
            <span
              className="mt-1 size-3 shrink-0 rounded-full"
              style={{ backgroundColor: arm.color }}
              aria-hidden="true"
            />
            <div>
              <p className="font-display text-sm text-parchment">
                {arm.name}
                {arm.isSolarHome && <span className="ml-2 text-xs text-gold-bright">— our sun&apos;s spur</span>}
              </p>
              <p className="mt-1 text-xs text-muted">
                Star density {Math.round(arm.starDensity * 100)}% · angle offset {arm.angleOffset.toFixed(2)} rad
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-8 max-w-2xl text-sm text-muted">
        Galactic radius {milkyWay.dimensions.radiusLightYears.toLocaleString()} light-years, core
        radius {milkyWay.dimensions.coreRadius.toLocaleString()} light-years, disk thickness{" "}
        {milkyWay.dimensions.thickness.toLocaleString()} light-years. The marked point shows
        roughly where our solar system sits along the Orion-Cygnus Spur.
      </p>
    </Container>
  );
}
