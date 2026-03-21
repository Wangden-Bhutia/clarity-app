export type UserProfile = "overestimator" | "underestimator" | "balanced" | "insufficient_data";

export interface UserStats {
  totalPredictions: number;
  overestimationCount: number;
  underestimationCount: number;
  highPredictions: number;
  lowPredictions: number;
}

const STATS_KEY = "clarity_user_stats";

export function getStats(): UserStats {
  const data = localStorage.getItem(STATS_KEY);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      // Ensure new fields exist for existing users
      return {
        ...parsed,
        highPredictions: parsed.highPredictions || 0,
        lowPredictions: parsed.lowPredictions || 0
      };
    } catch (e) {
      console.error("Failed to parse stats", e);
    }
  }
  return {
    totalPredictions: 0,
    overestimationCount: 0,
    underestimationCount: 0,
    highPredictions: 0,
    lowPredictions: 0
  };
}

export function updateStats(prediction: number, occurred: boolean) {
  const stats = getStats();
  stats.totalPredictions += 1;
  
  if (prediction >= 60) {
    stats.highPredictions += 1;
    if (!occurred) {
      stats.overestimationCount += 1;
    }
  }
  
  if (prediction <= 40) {
    stats.lowPredictions += 1;
    if (occurred) {
      stats.underestimationCount += 1;
    }
  }
  
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function getUserProfile(): UserProfile {
  const stats = getStats();
  
  if (stats.highPredictions < 3 && stats.lowPredictions < 3) {
    return "insufficient_data";
  }
  
  const overRate = stats.highPredictions > 0 ? stats.overestimationCount / stats.highPredictions : 0;
  const underRate = stats.lowPredictions > 0 ? stats.underestimationCount / stats.lowPredictions : 0;
  
  if (overRate > 0.6) return "overestimator";
  if (underRate > 0.6) return "underestimator";
  
  return "balanced";
}

export type Insight = {
  message: string;
  type: "overestimate" | "underestimate" | "balanced" | "none";
};

export function getInsight(prediction: number, occurred: boolean): Insight {
  const profile = getUserProfile();

  // Immediate decision-level insight
  if (prediction >= 60 && !occurred) {
    return {
      message: "You predicted a high risk. It did not happen.",
      type: "overestimate",
    };
  }

  if (prediction <= 40 && occurred) {
    return {
      message: "You predicted a low chance. It did happen.",
      type: "underestimate",
    };
  }

  // Profile-level gentle nudge
  if (profile === "overestimator") {
    return {
      message: "You tend to overestimate risk.",
      type: "overestimate",
    };
  }

  if (profile === "underestimator") {
    return {
      message: "You tend to underestimate outcomes.",
      type: "underestimate",
    };
  }

  if (profile === "balanced") {
    return {
      message: "Your predictions are fairly well calibrated.",
      type: "balanced",
    };
  }

  return {
    message: "Keep logging outcomes to build insight.",
    type: "none",
  };
}
export type CalibrationSummary = {
  total: number;
  lessSevereThanExpected: number; // overestimates that did NOT occur
  worseThanExpected: number;     // underestimates that DID occur
  matchedExpectation: number;    // everything else
};

export function getCalibrationSummary(): CalibrationSummary {
  const stats = getStats();

  const lessSevereThanExpected = stats.overestimationCount; // high prediction but did not occur
  const worseThanExpected = stats.underestimationCount;     // low prediction but did occur

  const matchedExpectation = Math.max(
    0,
    stats.totalPredictions - (lessSevereThanExpected + worseThanExpected)
  );

  return {
    total: stats.totalPredictions,
    lessSevereThanExpected,
    worseThanExpected,
    matchedExpectation,
  };
}