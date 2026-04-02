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

      {/* What this is */}
      <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 shadow-sm space-y-2">
        <p className="text-sm text-primary/90 font-normal leading-relaxed">
          Clarity helps you compare what you expect with what actually happens.
        </p>
        <p className="text-sm text-foreground/80 font-light leading-relaxed">
          Log a decision, note your worst-case expectation, then record the outcome.
        </p>
        <p className="text-sm text-foreground/80 font-light leading-relaxed">
          Over time, patterns emerge — showing whether your thinking is accurate, too cautious, or overly optimistic.
        </p>
      </div>

      {/* Interpretation */}
      <div className="text-center space-y-2">
        <p className="text-sm text-primary/80 italic">
          Log a few more decisions — your pattern will start to reveal itself.
        </p>
        <p className="text-xs text-muted-foreground/60 italic">
          Awareness improves judgment.
        </p>
      </div>

    </div>
  );
}