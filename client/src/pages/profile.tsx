import { getCalibrationSummary, getUserProfile } from "@/lib/stats";

export default function ProfilePage() {
  const summary = getCalibrationSummary();
  const profile = getUserProfile();

  const getIdentityLine = () => {
    if (profile === "overestimator") return "You tend to expect things to go worse than they do.";
    if (profile === "underestimator") return "You tend to underestimate how things will unfold.";
    if (profile === "balanced") return "Your expectations are fairly well calibrated.";
    return "Keep logging decisions to understand your patterns.";
  };

  const getInterpretation = () => {
    if (profile === "overestimator") return "Your expectations lean slightly pessimistic.";
    if (profile === "underestimator") return "Your expectations lean slightly optimistic.";
    if (profile === "balanced") return "You tend to judge situations with balance.";
    return "More data will reveal your thinking pattern.";
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">
      
      {/* Identity */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-serif text-foreground/90">Your Thinking Pattern</h1>
        <p className="text-lg font-light text-foreground/80">
          {getIdentityLine()}
        </p>
      </div>

      {/* Calibration Summary */}
      <div className="space-y-4 p-5 rounded-2xl bg-card/40 border border-border/40 shadow-sm">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground">
          Calibration Summary
        </h2>

        <div className="space-y-2 text-sm font-light text-foreground/80">
          <p>Total decisions: {summary.total}</p>
          <p>Less severe than expected: {summary.lessSevereThanExpected}</p>
          <p>Matched expectation: {summary.matchedExpectation}</p>
          <p>Worse than expected: {summary.worseThanExpected}</p>
        </div>
      </div>

      {/* Interpretation */}
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground/80 italic">
          {getInterpretation()}
        </p>
        <p className="text-xs text-muted-foreground/60 italic">
          Awareness improves judgment.
        </p>
      </div>

    </div>
  );
}