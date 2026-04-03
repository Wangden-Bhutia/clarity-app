type LearningData = {
  totalDecisions: number;
  totalOccurred: number;

  categoryStats: Record<string, { total: number; occurred: number }>;

  confidenceStats: {
    highConfidenceTotal: number;
    highConfidenceOccurred: number;
  };
};

const STORAGE_KEY = "clarity_learning_v1";

export function getLearningData(): LearningData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);

  return {
    totalDecisions: 0,
    totalOccurred: 0,
    categoryStats: {},
    confidenceStats: {
      highConfidenceTotal: 0,
      highConfidenceOccurred: 0,
    },
  };
}

export function updateLearningData(decisions: any[]) {
  const data = getLearningData();

  decisions.forEach((d) => {
    if (d.worstOutcomeOccurred === undefined) return;

    data.totalDecisions += 1;
    if (d.worstOutcomeOccurred) data.totalOccurred += 1;

    // Category learning
    const cat = (d.category || "unknown").toLowerCase();
    if (!data.categoryStats[cat]) {
      data.categoryStats[cat] = { total: 0, occurred: 0 };
    }

    data.categoryStats[cat].total += 1;
    if (d.worstOutcomeOccurred) data.categoryStats[cat].occurred += 1;

    // Confidence learning
    if ((d.confidence || 0) >= 0.7) {
      data.confidenceStats.highConfidenceTotal += 1;
      if (d.worstOutcomeOccurred) {
        data.confidenceStats.highConfidenceOccurred += 1;
      }
    }
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}