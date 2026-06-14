import { Decision } from "@/lib/db";
import { getCalibrationBreakdown, getDominantBias, getBehavioralNudge } from "./core";
import { getConfidenceInsight } from "./messaging";
import resolveArchetype from "./resolver";
import { ARCHETYPE_DEFINITIONS, InsightArchetype } from "./archetypes";

export function getDecisionInsights(
  decision: Decision,
  allDecisions: Decision[]
) {
  const calibrationBreakdown = getCalibrationBreakdown(allDecisions);

  const dominant = calibrationBreakdown.total
    ? getDominantBias(calibrationBreakdown)
    : null;

  const nudge = calibrationBreakdown.total
    ? getBehavioralNudge(decision, calibrationBreakdown)
    : null;

  const confidenceInsight = getConfidenceInsight(decision);

  const probabilityLabel =
    typeof decision.worstOutcomeProbability === "number"
      ? decision.worstOutcomeProbability >= 80
        ? "Very Likely"
        : decision.worstOutcomeProbability >= 60
          ? "Likely"
          : decision.worstOutcomeProbability >= 40
            ? "Uncertain"
            : decision.worstOutcomeProbability >= 20
              ? "Unlikely"
              : "Very Unlikely"
      : undefined;

  const { primary } = resolveArchetype({
    worry: decision.primaryConcern,
    probability: probabilityLabel
  });

  // "low_signal" is not a key in ARCHETYPE_DEFINITIONS — guard against it
  const archetypeInsight =
    primary !== ("low_signal" as any)
      ? ARCHETYPE_DEFINITIONS[primary as InsightArchetype]
      : null;

  return {
    calibrationBreakdown,
    dominant,
    nudge,
    confidenceInsight,
    archetype: primary,
    archetypeInsight
  };
}