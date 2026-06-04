import { useEffect, useState } from "react";
import { db, Decision } from "@/lib/db";
import { getCalibrationBreakdown, getDominantBias } from "@/lib/insight/core";

export default function Dashboard() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [breakdown, setBreakdown] = useState<{
    over: number;
    under: number;
    accurate: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      const all = await db.getAllDecisions();
      setDecisions(all);
      setBreakdown(getCalibrationBreakdown(all));
    };
    load();
  }, []);

  if (!breakdown || breakdown.total === 0) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Not enough data yet.
        </p>
      </div>
    );
  }


  const dominant = getDominantBias(breakdown);

  // Calculate accuracy streak (from most recent decisions)
  const withOutcomes = decisions
    .filter(d => d.worstOutcomeProbability !== undefined && d.worstOutcomeOccurred !== undefined)
    .slice(-10) // look at last 10 decisions
    .reverse();

  let streak = 0;

  for (const d of withOutcomes) {
    const p = d.worstOutcomeProbability!;
    const occurred = d.worstOutcomeOccurred;

    const correct =
      (occurred && p >= 70) ||
      (!occurred && p <= 40);

    if (correct) streak++;
    else break;
  }

  // Detect if streak was recently broken
  const last = withOutcomes[0];
  const prev = withOutcomes.slice(1);

  let streakBroken = false;

  if (last && prev.length > 0) {
    const p = last.worstOutcomeProbability!;
    const occurred = last.worstOutcomeOccurred;

    const correct =
      (occurred && p >= 70) ||
      (!occurred && p <= 40);

    const prevStreak = prev.every(d => {
      const pp = d.worstOutcomeProbability!;
      const occ = d.worstOutcomeOccurred;
      return (occ && pp >= 70) || (!occ && pp <= 40);
    });

    if (!correct && prevStreak && prev.length >= 2) {
      streakBroken = true;
    }
  }

  const streakBreakInsight = streakBroken
    ? "Your recent accuracy streak just broke — worth checking what changed."
    : null;

  // Detect confidence shift for "what changed" insight
  let changeInsight: string | null = null;

  if (streakBroken && last && prev.length > 0) {
    const lastP = last.worstOutcomeProbability!;
    const avgPrev =
      prev.reduce((sum, d) => sum + (d.worstOutcomeProbability || 0), 0) /
      prev.length;

    if (lastP - avgPrev >= 20) {
      changeInsight = "You were more confident than usual here.";
    } else if (avgPrev - lastP >= 20) {
      changeInsight = "You were less confident than usual here.";
    }
  }

  // Bias labeling
  let biasLabel: string | null = null;

  if (streakBroken && last) {
    const p = last.worstOutcomeProbability!;
    const occurred = last.worstOutcomeOccurred;

    const wasWrong =
      (occurred && p < 70) ||
      (!occurred && p > 40);

    if (wasWrong) {
      if (p >= 70) {
        biasLabel = "Possible overconfidence";
      } else if (p <= 30) {
        biasLabel = "Possible underconfidence";
      } else {
        biasLabel = "Calibration drift";
      }
    }
  }

  const streakLabel =
    streak >= 5
      ? "Strong accuracy streak"
      : streak >= 3
      ? "Building accuracy streak"
      : streak >= 1
      ? "Small accuracy streak"
      : "No current streak";

  // ---- Bias profile over all past decisions ----
  const biasCounts = {
    overconfidence: 0,
    underconfidence: 0,
    drift: 0,
  };

  const outcomes = decisions.filter(
    d => d.worstOutcomeProbability !== undefined && d.worstOutcomeOccurred !== undefined
  );

  outcomes.forEach(d => {
    const p = d.worstOutcomeProbability!;
    const occurred = d.worstOutcomeOccurred;

    const wasWrong =
      (occurred && p < 70) ||
      (!occurred && p > 40);

    if (!wasWrong) return;

    if (p >= 70) biasCounts.overconfidence++;
    else if (p <= 30) biasCounts.underconfidence++;
    else biasCounts.drift++;
  });

  const totalBias = biasCounts.overconfidence + biasCounts.underconfidence + biasCounts.drift;

  const biasProfile =
    totalBias > 0
      ? [
          {
            label: "Overconfidence",
            value: Math.round((biasCounts.overconfidence / totalBias) * 100),
            color: "text-red-600",
          },
          {
            label: "Underconfidence",
            value: Math.round((biasCounts.underconfidence / totalBias) * 100),
            color: "text-amber-600",
          },
          {
            label: "Calibration drift",
            value: Math.round((biasCounts.drift / totalBias) * 100),
            color: "text-gray-600",
          },
        ]
      : [];

  // ---- Personalized recommendation ----
  let recommendation: string | null = null;

  if (biasProfile.length > 0) {
    const top = biasProfile.reduce((a, b) => (a.value > b.value ? a : b));

    const recentAccuracy =
      withOutcomes.length >= 3
        ? withOutcomes.filter(d => {
            const p = d.worstOutcomeProbability!;
            const occurred = d.worstOutcomeOccurred;
            return (occurred && p >= 70) || (!occurred && p <= 40);
          }).length / withOutcomes.length
        : null;

    if (top.label === "Overconfidence") {
      recommendation =
        streakBroken && changeInsight
          ? "In this decision, your confidence was higher than your usual pattern — consider dialing it down slightly."
          : recentAccuracy !== null && recentAccuracy > 0.6
          ? "You tend to be overconfident, but you're improving — keep slightly lowering your estimates."
          : "You tend to overestimate certainty — try lowering your default confidence slightly.";
    } else if (top.label === "Underconfidence") {
      recommendation =
        streakBroken && changeInsight
          ? "In this decision, you were less confident than your usual pattern — consider trusting your judgment more here."
          : recentAccuracy !== null && recentAccuracy > 0.6
          ? "You tend to underestimate, but you're getting better — trust your judgment a bit more."
          : "You tend to underestimate outcomes — consider trusting your judgment a bit more.";
    } else if (top.label === "Calibration drift") {
      recommendation =
        streakBroken
          ? "In this decision, your estimate deviated from your usual pattern — try aligning it with your typical reasoning."
          : recentAccuracy !== null && recentAccuracy > 0.6
          ? "Your estimates are becoming more consistent — keep using the same reasoning pattern."
          : "Your estimates vary — try being more consistent with how you assign probabilities.";
    }
  }

  const items = [
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
  ];

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold">Calibration Dashboard</h1>

      {dominant && (
        <div className="text-sm">
          Dominant Pattern:{" "}
          <span className="font-medium">
            {dominant.label} ({dominant.value}%)
          </span>
        </div>
      )}

      <div className="text-sm">
        Streak:{" "}
        <span className="font-medium">
          {streak} ({streakLabel})
        </span>
      </div>

      {streakBreakInsight && (
        <div className="text-xs text-amber-600">
          {streakBreakInsight}
        </div>
      )}

      {changeInsight && (
        <div className="text-xs text-muted-foreground">
          {changeInsight}
        </div>
      )}

      {biasLabel && (
        <div className="text-xs text-red-600 font-medium">
          {biasLabel}
        </div>
      )}

      {biasProfile.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
            Bias Profile
          </p>
          {biasProfile.map(b => (
            <div key={b.label} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{b.label}</span>
              <span className={`font-medium ${b.color}`}>{b.value}%</span>
            </div>
          ))}
        </div>
      )}
      {recommendation && (
        <div className="text-xs text-foreground/80 border-t border-border/30 pt-3">
          {recommendation}
        </div>
      )}
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.label}>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{item.label}</span>
              <span>{item.value}%</span>
            </div>
            <div className="w-full h-2 bg-secondary/30 rounded-full overflow-hidden">
              <div
                className={`h-2 ${item.color}`}
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground">
        Based on {breakdown.total} decisions
      </div>
    </div>
  );
}