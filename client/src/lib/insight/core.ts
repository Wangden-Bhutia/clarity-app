import { Decision } from "@/lib/db";

export function getCalibrationBreakdown(decisions: Decision[]) {
  const withOutcomes = decisions.filter(
    d =>
      typeof d.worstOutcomeProbability === "number" &&
      d.worstOutcomeOccurred !== undefined
  );

  let over = 0;
  let under = 0;
  let accurate = 0;

  withOutcomes.forEach(d => {
    const p = d.worstOutcomeProbability!;

    if (d.worstOutcomeOccurred) {
      if (p < 40) under++;
      else if (p >= 70) accurate++;
    } else {
      if (p > 70) over++;
      else if (p <= 40) accurate++;
    }
  });

  return {
    over,
    under,
    accurate,
    total: withOutcomes.length
  };
}

export function getDominantBias(breakdown: {
  over: number;
  under: number;
  accurate: number;
  total: number;
}) {
  if (!breakdown.total) return null;

  const overPct = Math.round((breakdown.over / breakdown.total) * 100);
  const underPct = Math.round((breakdown.under / breakdown.total) * 100);
  const accPct = Math.round((breakdown.accurate / breakdown.total) * 100);

  const entries = [
    { label: "Overestimated", value: overPct },
    { label: "Underestimated", value: underPct },
    { label: "Accurate", value: accPct }
  ];

  return entries.sort((a, b) => b.value - a.value)[0];
}

export function getBehavioralNudge(
  decision: Decision,
  breakdown: {
    over: number;
    under: number;
    accurate: number;
    total: number;
  }
) {
  const dominant = getDominantBias(breakdown);
  if (!dominant) return null;

  const focus = (decision.primaryConcern || "").toLowerCase();

  const isSocial = focus.includes("people") || focus.includes("judge");
  const isMoney = focus.includes("money") || focus.includes("loss");
  const isControl = focus.includes("control");

  if (dominant.label === "Overestimated" && dominant.value >= 40) {
    if (isSocial) return "You may be overestimating social risk — most people aren’t judging as much as it feels.";
    if (isMoney) return "You may be overestimating financial risk — check the actual downside.";
    if (isControl) return "You may be overestimating loss of control — focus on what you can influence.";
    return "You tend to overestimate risk — check the evidence.";
  }

  if (dominant.label === "Underestimated" && dominant.value >= 40) {
    if (isMoney) return "You may be underestimating financial risk — evaluate downside clearly.";
    return "You tend to underestimate risk — think through what could go wrong.";
  }

  if (dominant.label === "Accurate") {
    return "Your judgment is fairly balanced — keep checking assumptions.";
  }

  return "Stay aware of your patterns.";
}