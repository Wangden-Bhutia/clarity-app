import { UserProfile, getStats, getUserProfile } from "./stats";

export function getPreDecisionNudge(prediction?: number): string | null {
  const stats = getStats();
  
  if (stats.totalPredictions < 5) return null;
  
  const profile = getUserProfile();
  if (profile === "insufficient_data") return null;

  // Context-aware nudge based on current prediction
  if (typeof prediction === "number") {
    if (profile === "overestimator" && prediction >= 70) {
      return "You’re expecting a high risk here. You’ve often overestimated in similar situations.";
    }
    if (profile === "underestimator" && prediction <= 30) {
      return "You’re expecting low risk here. You’ve sometimes underestimated outcomes in similar situations.";
    }
  }
  
  // 30% chance to show the nudge
  if (Math.random() > 0.3) return null;
  
  const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  
  if (profile === "overestimator") {
    return getRandom([
      "You often expect things to go worse than they do.",
      "You may be leaning a bit pessimistic here.",
      "Your estimates tend to run slightly high."
    ]);
  } else if (profile === "underestimator") {
    return getRandom([
      "You may be overlooking some downside here.",
      "You sometimes rate risks lower than they turn out.",
      "You might be slightly underweighting risk."
    ]);
  } else if (profile === "balanced") {
    return getRandom([
      "Your judgment has been steady lately.",
      "You’ve been fairly well calibrated."
    ]);
  }
  
  return null;
}
