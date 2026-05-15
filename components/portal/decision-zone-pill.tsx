import type { DecisionTier, DecisionZone } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

const ZONE_LABEL: Record<DecisionZone, string> = {
  ZONE_1: "Zone 1",
  ZONE_2: "Zone 2",
  ZONE_3: "Zone 3",
  ZONE_4: "Zone 4",
  EMERGENCY: "Emergency Authority",
  THRESHOLD: "Threshold Review",
};

const ZONE_VARIANT: Record<
  DecisionZone,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  ZONE_1: "default",
  ZONE_2: "amber",
  ZONE_3: "blue",
  ZONE_4: "metal",
  EMERGENCY: "red",
  THRESHOLD: "metal",
};

const TIER_LABEL: Record<DecisionTier, string> = {
  TIER_1: "Tier 1",
  TIER_2: "Tier 2",
};

export function DecisionZonePill({
  zone,
  tier,
}: {
  zone: DecisionZone | null;
  tier?: DecisionTier | null;
}) {
  if (!zone) return null;
  const label = tier ? `${ZONE_LABEL[zone]} · ${TIER_LABEL[tier]}` : ZONE_LABEL[zone];
  return <Badge variant={ZONE_VARIANT[zone]}>{label}</Badge>;
}
