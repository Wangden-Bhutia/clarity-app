import { Decision } from "@/lib/db";
import { getDecisionInsights } from "@/lib/insight/engine";

export default function CalibrationPanel({
  decision,
  fearStats,
  calibrationBreakdown,
  allDecisions
}: {
  decision: Decision;
  fearStats: { total: number; occurred: number };
  calibrationBreakdown: {
    over: number;
    under: number;
    accurate: number;
    total: number;
  } | null;
  allDecisions: Decision[];
}) {
  // Persistent insight history (last 5)
  const insightHistory: string[] =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("insightHistory") || "[]")
      : [];

  // Detect recurring insight pattern
  let recurringInsight: string | null = null;

  if (insightHistory.length >= 3) {
    const counts: Record<string, number> = {};
    insightHistory.forEach(i => {
      counts[i] = (counts[i] || 0) + 1;
    });

    const [text, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

    if (count >= 5) {
      recurringInsight = `This keeps repeating strongly: ${text}`;
    } else if (count >= 3) {
      recurringInsight = `This pattern keeps showing up: ${text}`;
    }
  }

  if (!fearStats || fearStats.total < 3) return null;

  const baseRate = (fearStats.occurred / fearStats.total) * 100;
  const confidence = decision.worstOutcomeProbability ?? 50;
  const diff = Math.round(confidence - baseRate);

  const calibrationMessage =
    diff > 20
      ? "You tend to overestimate risk."
      : diff < -20
      ? "You tend to underestimate risk."
      : "Your expectations are fairly well calibrated.";

  const insights = getDecisionInsights(decision, allDecisions);

  // Calculate average deviation across past decisions
  const pastWithOutcomes = allDecisions.filter(
    d => d.worstOutcomeProbability !== undefined && d.worstOutcomeOccurred !== undefined
  );

  const avgDeviation =
    pastWithOutcomes.length >= 3
      ? Math.round(
          pastWithOutcomes.reduce((sum, d) => {
            const p = d.worstOutcomeProbability!;
            const occurred = d.worstOutcomeOccurred;
            const actual = occurred ? 100 : 0;
            return sum + Math.abs(p - actual);
          }, 0) / pastWithOutcomes.length
        )
      : null;

  // Calculate recent deviation (last 5 decisions)
  const recent = pastWithOutcomes.slice(-5);

  const recentDeviation =
    recent.length >= 3
      ? Math.round(
          recent.reduce((sum, d) => {
            const p = d.worstOutcomeProbability!;
            const occurred = d.worstOutcomeOccurred;
            const actual = occurred ? 100 : 0;
            return sum + Math.abs(p - actual);
          }, 0) / recent.length
        )
      : null;

  const deviationTrend =
    avgDeviation !== null && recentDeviation !== null
      ? recentDeviation < avgDeviation
        ? "Improving accuracy"
        : recentDeviation > avgDeviation
        ? "Accuracy slipping"
        : "No change in accuracy"
      : null;

  // Self-comparison insight (current vs typical)
  let selfComparisonInsight: string | null = null;

  if (avgDeviation !== null) {
    const currentDeviation = Math.abs(diff);

    if (currentDeviation + 10 < avgDeviation) {
      selfComparisonInsight = "This is more accurate than your usual pattern.";
    } else if (currentDeviation > avgDeviation + 10) {
      selfComparisonInsight = "This is less accurate than your usual pattern.";
    }
  }

  // ---- Calibration curve (confidence buckets) ----
  const buckets = [
    { min: 0, max: 30, label: "0–30%" },
    { min: 30, max: 60, label: "30–60%" },
    { min: 60, max: 80, label: "60–80%" },
    { min: 80, max: 100, label: "80–100%" },
  ];

  const calibrationCurve = buckets
    .map(b => {
      const items = pastWithOutcomes.filter(d => {
        const p = d.worstOutcomeProbability!;
        return p >= b.min && p < b.max;
      });

      if (items.length < 3) return null;

      const accuracy =
        items.filter(d => {
          const p = d.worstOutcomeProbability!;
          const occurred = d.worstOutcomeOccurred;
          return (occurred && p >= 70) || (!occurred && p <= 40);
        }).length / items.length;

      const avgConfidence =
        items.reduce((sum, d) => sum + d.worstOutcomeProbability!, 0) /
        items.length;

      return {
        label: b.label,
        accuracy: Math.round(accuracy * 100),
        confidence: Math.round(avgConfidence),
      };
    })
    .filter(Boolean) as { label: string; accuracy: number; confidence: number }[];

  const dominant = insights.dominant;
  const breakdown = insights.calibrationBreakdown;

  return (
    <div className="mt-4 text-center">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">
        Your Calibration
      </p>

      <p className="text-xs text-foreground/80 font-medium">
        {calibrationMessage}
      </p>

      <p className="text-[10px] text-muted-foreground/70 mt-1">
        {diff > 0
          ? `You overestimated by +${diff}%`
          : diff < 0
          ? `You underestimated by ${diff}%`
          : "Your estimate matched reality"}
      </p>

      <p className="text-[10px] text-muted-foreground/70 mt-1">
        Based on your past {fearStats.total} decisions
      </p>

      {avgDeviation !== null && (
        <>
          <p className="text-[10px] text-muted-foreground/70">
            Avg deviation: {avgDeviation}%
          </p>

          {deviationTrend && (
            <p
              className={`text-[10px] ${
                deviationTrend === "Improving accuracy"
                  ? "text-green-600"
                  : deviationTrend === "Accuracy slipping"
                  ? "text-red-600"
                  : "text-muted-foreground/70"
              }`}
            >
              {deviationTrend}
            </p>
          )}

          {selfComparisonInsight && (
            <p className="text-[10px] text-foreground/80">
              {selfComparisonInsight}
            </p>
          )}
        </>
      )}

      {calibrationCurve.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
            Calibration Curve
          </p>

          {calibrationCurve.map(c => (
            <div key={c.label} className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {c.label}
              </span>
              <span className="font-medium">
                {c.confidence}% → {c.accuracy}%
              </span>
            </div>
          ))}

          {(() => {
            const items = calibrationCurve
              .map(c => {
                const gap = c.confidence - c.accuracy;

                let text: string | null = null;

                if (c.label === "80–100%" && gap > 20) {
                  text = "Overconfident at high certainty.";
                } else if (c.label === "0–30%" && gap < -20) {
                  text = "Underestimating low-risk situations.";
                } else if (c.label === "30–60%" && Math.abs(gap) > 20) {
                  text = "Inconsistent in moderate confidence decisions.";
                }

                return text
                  ? { text, severity: Math.abs(gap) }
                  : null;
              })
              .filter(Boolean) as { text: string; severity: number }[];

            if (items.length === 0) return null;

            // sort by severity (largest gap first)
            items.sort((a, b) => b.severity - a.severity);

            // show top 1–2 insights only
            let top = items.slice(0, 2);

            // avoid repeating recent insights
            if (top.length > 0 && insightHistory.includes(top[0].text) && items.length > 1) {
              // find first item not in recent history
              const alternative = items.find(i => !insightHistory.includes(i.text));
              if (alternative) {
                top = [alternative, top[0]];
              } else {
                top = [items[1], items[0]]; // fallback swap
              }
            }

            // persist history (keep last 5)
            if (top.length > 0 && typeof window !== "undefined") {
              const updated = [top[0].text, ...insightHistory.filter(t => t !== top[0].text)].slice(0, 5);
              localStorage.setItem("insightHistory", JSON.stringify(updated));
            }

            return (
              <div className="mt-1 space-y-1">
                {top.map((item, i) => (
                  <p
                    key={i}
                    className={
                      (i === 0
                        ? "text-[11px] font-medium text-foreground/90"
                        : "text-[10px] text-muted-foreground/60") +
                      " transition-all duration-300 ease-out opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]"
                    }
                  >
                    {item.text}
                  </p>
                ))}
              </div>
            );
          })()}
          {recurringInsight && (
            <p
              className={
                "text-[10px] mt-2 font-medium " +
                (recurringInsight.includes("strongly")
                  ? "text-red-600"
                  : "text-foreground/70")
              }
            >
              {recurringInsight}
            </p>
          )}
          {recurringInsight && recurringInsight.includes("strongly") && (() => {
            let intervention = "Pause and reconsider how you're estimating this — this pattern is not random.";

            const improving = deviationTrend === "Improving accuracy";

            if (recurringInsight.includes("Overconfident")) {
              intervention = improving
                ? "You're improving — keep slightly lowering your confidence in similar situations."
                : "Try lowering your confidence by 10–15% in similar situations.";
            } else if (recurringInsight.includes("Underestimating")) {
              intervention = improving
                ? "You're getting better — trust your judgment a bit more in similar cases."
                : "Consider raising your baseline expectation slightly in similar cases.";
            } else if (recurringInsight.includes("Inconsistent")) {
              intervention = improving
                ? "Your consistency is improving — keep using the same reasoning approach."
                : "Use a more consistent rule when assigning probabilities — avoid gut swings.";
            }

            return (
              <p className="text-[10px] text-red-500/80 mt-1">
                {intervention}
              </p>
            );
          })()}
        </div>
      )}

      {breakdown && breakdown.total >= 3 && (
        <div className="mt-4 space-y-2">
          {dominant && (() => {
            const toneMap: Record<string, string> = {
              Overestimated: "text-red-600 bg-red-500/10 border-red-500/30",
              Underestimated: "text-amber-600 bg-amber-500/10 border-amber-500/30",
              Accurate: "text-green-600 bg-green-500/10 border-green-500/30",
            };

            return (
              <div className="mb-2 flex items-center justify-center">
                <span className={`px-2.5 py-1 rounded-full text-[10px] border ${toneMap[dominant.label]}`}>
                  Dominant: {dominant.label} ({dominant.value}%)
                </span>
              </div>
            );
          })()}

          {[
            {
              label: "Overestimated",
              value: Math.round((breakdown.over / breakdown.total) * 100),
              color: "bg-red-500/60"
            },
            {
              label: "Underestimated",
              value: Math.round((breakdown.under / breakdown.total) * 100),
              color: "bg-amber-500/60"
            },
            {
              label: "Accurate",
              value: Math.round((breakdown.accurate / breakdown.total) * 100),
              color: "bg-green-500/60"
            }
          ].map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{item.label}</span>
                <span>{item.value}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-secondary/30 overflow-hidden">
                <div
                  className={`transition-all duration-500 ${item.color} ${
                    item.label === dominant?.label ? "h-3" : "h-2"
                  }`}
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}

          <div className="mt-4 pt-3 border-t border-border/30 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">
              Nudge
            </p>
            <p className="text-xs text-foreground/80 font-medium">
              {insights.nudge}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}