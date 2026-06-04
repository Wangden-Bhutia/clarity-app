type LearningData = {
  totalDecisions: number;
  totalOccurred: number;

  categoryStats: Record<string, { total: number; occurred: number }>;

  confidenceStats: {
    highConfidenceTotal: number;
    highConfidenceOccurred: number;
  };

  calibrationStats: {
    over: number;
    under: number;
    aligned: number;
  };

  categoryCalibrationStats: Record<
    string,
    { over: number; under: number; aligned: number }
  >;

  actionStats: {
    forward: number;
    avoid: number;
  };

  archetypeStats: Record<
    string,
    { correct: number; incorrect: number }
  >;
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
    calibrationStats: {
      over: 0,
      under: 0,
      aligned: 0,
    },
    categoryCalibrationStats: {},
    actionStats: {
      forward: 0,
      avoid: 0,
    },
    archetypeStats: {},
  };
}

export function updateLearningData(decisions: any | any[]) {
  const list = Array.isArray(decisions) ? decisions : [decisions];
  const data = getLearningData();

  list.forEach((d) => {
    // --- Time weight (recent decisions matter more) ---
    const now = Date.now();
    const ts = d.date ? new Date(d.date).getTime() : now;
    const ageDays = Math.max(0, (now - ts) / (1000 * 60 * 60 * 24));

    // Exponential decay: ~50% weight every 30 days
    const lambda = Math.log(2) / 30;
    const w = Math.exp(-lambda * ageDays);

    if (d.worstOutcomeOccurred === undefined) return;

    data.totalDecisions += w;
    if (d.worstOutcomeOccurred) data.totalOccurred += w;

    // Category learning
    const cat = (d.category || "unknown").toLowerCase();
    if (!data.categoryStats[cat]) {
      data.categoryStats[cat] = { total: 0, occurred: 0 };
    }
    if (!data.categoryCalibrationStats[cat]) {
      data.categoryCalibrationStats[cat] = {
        over: 0,
        under: 0,
        aligned: 0,
      };
    }

    data.categoryStats[cat].total += w;
    if (d.worstOutcomeOccurred) data.categoryStats[cat].occurred += w;

    // Confidence learning
    if ((d.confidence || 0) >= 0.7) {
      data.confidenceStats.highConfidenceTotal += w;
      if (d.worstOutcomeOccurred) {
        data.confidenceStats.highConfidenceOccurred += w;
      }
    }

    // Calibration learning
    if (typeof d.worstOutcomeProbabilityValue === "number") {
      const p = d.worstOutcomeProbabilityValue;
      const catCal = data.categoryCalibrationStats[cat];

      if (d.worstOutcomeOccurred) {
        if (p < 50) {
          data.calibrationStats.under += w;
          catCal.under += w;
        } else {
          data.calibrationStats.aligned += w;
          catCal.aligned += w;
        }
      } else {
        if (p > 50) {
          data.calibrationStats.over += w;
          catCal.over += w;
        } else {
          data.calibrationStats.aligned += w;
          catCal.aligned += w;
        }
      }
    }

    // --- Action learning (forward vs avoidance behavior) ---
    const actionText = (d.chosenAction || "").toLowerCase();

    const forwardActions = ["pursue", "move forward", "commit", "take action", "go ahead"];
    const avoidActions = ["avoid", "delay", "wait", "hold back", "stay put"];

    if (forwardActions.some(a => actionText.includes(a))) {
      data.actionStats.forward += w;
    }

    if (avoidActions.some(a => actionText.includes(a))) {
      data.actionStats.avoid += w;
    }

    // --- Archetype miscalibration tracking ---
    if (d.primaryArchetype && d.worstOutcomeOccurred !== undefined) {
      const predicted = (d.primaryArchetype || "").trim().toLowerCase();

      // Skip emotional_attachment (secondary-only, not evaluative)
      if (predicted === "emotional_attachment") {
        return;
      }

      const actual = d.worstOutcomeOccurred;

      if (!data.archetypeStats[predicted]) {
        data.archetypeStats[predicted] = {
          correct: 0,
          incorrect: 0
        };
      }

      // Skip ambition_tension (neutral outcome, not binary correct/incorrect)
      if (predicted === "ambition_tension") {
        return;
      }

      // actual === true means worst outcome happened (bad outcome)
      // actual === false means worst outcome did NOT happen (good outcome)
      const isCorrect =
        (predicted === "fear_based_avoidance" && actual === true) ||
        (predicted === "clear_conviction" && actual === false);

      if (isCorrect) {
        data.archetypeStats[predicted].correct += w;
      } else {
        data.archetypeStats[predicted].incorrect += w;
      }
    }
  });

  // Clean up legacy emotional_attachment stats (no longer used as primary)
  if (data.archetypeStats["emotional_attachment"]) {
    delete data.archetypeStats["emotional_attachment"];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}