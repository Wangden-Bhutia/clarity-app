import { Decision } from "@/lib/db";
import {
  getCalibrationBreakdown,
  getDominantBias,
  getBehavioralNudge,
  getConfidenceInsight
} from "./core";
import resolveArchetype from "./resolver";
import { ARCHETYPE_DEFINITIONS } from "./archetypes";

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

  const archetype = resolveArchetype({
    worry: decision.primaryConcern,
    probability: probabilityLabel
  });

  const archetypeInsight = ARCHETYPE_DEFINITIONS[archetype];

  return {
    calibrationBreakdown,
    dominant,
    nudge,
    confidenceInsight,
    archetype,
    archetypeInsight
  };
}