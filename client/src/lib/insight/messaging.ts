import { InsightArchetype } from "./archetypes";
function pickVariant(options: string[], seed?: string | number) {
  if (!options.length) return "";

  const s = String(seed || "");
  let hash = 0;

  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }

  return options[Math.abs(hash) % options.length];
}

export function getConfidenceInsight(decision: {
  worstOutcomeProbability?: number;
  worstOutcomeOccurred?: boolean;
  seed?: string | number;
}) {
  const p = decision.worstOutcomeProbability;

  if (p === undefined || decision.worstOutcomeOccurred === undefined) {
    return null;
  }

  if (decision.worstOutcomeOccurred) {
    if (p < 40) {
      return pickVariant([
        `This outcome was less expected than you thought (${p}%).`,
        `You did not expect this (${p}%) — yet it still happened.`,
        `The result caught you more off guard than expected (${p}%).`
      ], decision.seed);
    }

    if (p < 70) {
      return pickVariant([
        `There was uncertainty (${p}%), and the concern did play out.`,
        `Mixed expectations were present (${p}%), and it happened.`,
        `The situation was uncertain (${p}%), and events leaned toward the concern.`
      ], decision.seed);
    }

    return pickVariant([
      `This was strongly expected (${p}%), and your judgment proved accurate.`,
      `The outcome was anticipated (${p}%), and your expectation proved right.`,
      `Strong expectation was present (${p}%), and events aligned with it.`
    ], decision.seed);
  }

  if (p > 70) {
    return pickVariant([
      `This seemed likely to go wrong (${p}%) — but it didn’t.`,
      `A negative outcome felt highly likely (${p}%), yet it did not occur.`,
      `Difficulty was strongly expected (${p}%), but things went better than feared.`
    ], decision.seed);
  }

  if (p > 40) {
    return pickVariant([
      `There was uncertainty (${p}%), but things turned out better than expected.`,
      `Some doubt was present (${p}%), though the outcome was better than feared.`,
      `Uncertainty existed (${p}%), but events resolved more positively than expected.`
    ], decision.seed);
  }

  return pickVariant([
    `Major issues were not expected (${p}%) — and that held true.`,
    `Things were expected to go fairly smoothly (${p}%), and they did.`,
    `Calm expectation was present (${p}%), and reality matched it.`
  ], decision.seed);
}

export function getOutcomePatternInsight(params: {
  occurred?: number;
  total?: number;
  fearProfile?: string;
  decisionId?: string | number;
}) {
  const rate = params.total && params.total > 0
    ? (params.occurred || 0) / params.total
    : 0;

  let focus = "";
  if (params.fearProfile === "judgment") focus = "what others think";
  if (params.fearProfile === "money") focus = "money and outcomes";
  if (params.fearProfile === "control") focus = "losing control";
  if (params.fearProfile === "regret") focus = "making the wrong choice";

  const mainLine = rate <= 0.3
    ? `You tend to expect the worst around ${focus || "this"}.`
    : rate >= 0.7
    ? `Your concerns often align with reality.`
    : `Your expectations vary over time.`;

  const deepLine = rate <= 0.3
    ? `This may be harsher than the situation requires.`
    : `Notice what shapes this pattern over time.`;

  return { mainLine, deepLine };
}


export function getPreDecisionInsight(params: {
  probability?: number;
  fearProfile?: string;
  seed?: string | number;
}) {
  const p = params.probability;

  if (typeof p !== "number") {
    return "Notice what is shaping your judgment right now.";
  }

  if (p >= 80 && params.fearProfile === "regret") {
    return pickVariant([
      "You may be weighing this more by fear of making the wrong choice than by the choice itself.",
      "Concern about making the wrong decision may be shaping your judgment here.",
      "Fear of choosing wrongly seems to be influencing this decision."
    ], params.seed);
  }

  if (p >= 80 && params.fearProfile === "judgment") {
    return pickVariant([
      "Concern about how this may be perceived seems to be influencing you.",
      "Part of this hesitation may come from worrying how others will view the decision.",
      "Fear of judgment may be weighing on this choice."
    ], params.seed);
  }

  if (p >= 70) {
    return pickVariant([
      "You may be focusing more on what could go wrong than what is likely.",
      "Your attention seems drawn more toward possible downside than probable outcome.",
      "The mind may be emphasizing worst-case possibilities over likely ones."
    ], params.seed);
  }

  if (p >= 50) {
    return pickVariant([
      "Part of you seems drawn toward this, while another part remains cautious.",
      "This appears to involve tension between desire and caution.",
      "There seems to be conflict between interest and hesitation here."
    ], params.seed);
  }

  if (p <= 30) {
    return pickVariant([
      "There appears to be little inner resistance around this choice.",
      "This decision seems driven more by clarity than hesitation.",
      "This may feel clearer to you than more emotionally charged decisions."
    ], params.seed);
  }

  return pickVariant([
    "You appear to be weighing this with measured caution.",
    "This seems to be receiving thoughtful consideration.",
    "Your judgment appears measured, though some uncertainty remains."
  ], params.seed);
}

export function getDecisionMindset(probability?: number) {
  if (typeof probability !== "number") {
    return null;
  }

  if (probability >= 80) {
    return "What evidence suggests this fear is probable—not just possible?";
  }

  if (probability >= 50) {
    return "What evidence supports this concern beyond instinct alone?";
  }

  return "What evidence supports your confidence in this outcome?";
}

export function getPreOutcomeFooter(probability?: number) {
  if (typeof probability !== "number") {
    return "Return later to compare expectation with reality.";
  }

  if (probability >= 80) {
    return "Return later and see whether caution matched reality.";
  }

  if (probability >= 50) {
    return "Return later to compare expectation with reality.";
  }

  return "Return later and see whether confidence was justified.";
}

export function getCalibrationSummary(params: {
  calibrationScore: number;
  recentOccurred?: number;
  recentTotal?: number;
  overallOccurred?: number;
  overallTotal?: number;
}) {
  return {
    scoreText:
      params.calibrationScore < 0.15
        ? "Your expectations usually match reality."
        : params.calibrationScore < 0.3
        ? "Your expectations are sometimes slightly off."
        : "Your expectations often differ from how things unfold.",
    trendText: null
  };
}

export function getPredictiveInsight(params: {
  occurred?: number;
  total?: number;
  seed?: string | number;
}) {
  if (
    typeof params.occurred !== "number" ||
    typeof params.total !== "number" ||
    params.total <= 0
  ) {
    return null;
  }

  const rate = params.occurred / params.total;

  if (rate <= 0.25) return "This concern rarely plays out in your past decisions.";
  if (rate <= 0.5) return "This concern comes up sometimes, but not often.";
  if (rate <= 0.75) return "This concern may have some basis.";

  return "This concern is often justified by past outcomes.";
}

export function getArchetypeInsight(
  input: { primary: InsightArchetype | "low_signal"; secondary: InsightArchetype | null },
  category?: string,
  primaryConcern?: string
) {
  const { primary, secondary } = input;

  // Not enough signal to classify confidently
  if (primary === "low_signal") {
    return {
      title: "Reflect",
      mainLine: "There isn't enough signal yet to identify a clear pattern in this decision.",
      deepLine: "Notice what feels most uncertain — that is often where the real question lives."
    };
  }

  const mapConcern = (c?: string) => {
    const t = c?.toLowerCase();
    if (t === "too risky") return "this is too risky";
    if (t === "will regret it") return "regretting this later";
    if (t === "might regret not trying") return "missing out if you don’t try";
    if (t === "can't afford it") return "not being able to afford it";
    if (t === "not worth it") return "this not being worth it";
    if (t === "might not stick to it") return "sticking with it";
    if (t === "low energy") return "low energy";
    // fallback: lowercase first letter for natural phrasing
    return c ? c.charAt(0).toLowerCase() + c.slice(1) : c;
  };

  switch (primary) {
    case "fear_based_avoidance":
      if (category === "Finances") {
        return {
          title: "Fear-Driven",
          mainLine: primaryConcern
            ? `You might be seeing more risk here than there actually is.`
            : "Financial caution may be weighing more heavily than the evidence requires.",
          deepLine: "Check whether the risk is truly substantial—or simply feels uncomfortable."
        };
      }

      if (category === "Relationships") {
        // Default fear framing for Relationships (no keyword-based branches)
        return {
          title: "Fear-Driven",
          mainLine: primaryConcern
            ? `This may feel riskier than it actually is, especially when it comes to ${mapConcern(primaryConcern)}.`
            : "Fear may be making connection feel riskier than it truly is.",
          deepLine: "Check whether you are protecting yourself wisely—or avoiding vulnerability."
        };
      }

      if (category === "Health") {
        return {
          title: "Fear-Driven",
          mainLine: primaryConcern
            ? `Your current state may be shaping how risky this feels, especially if you're dealing with ${mapConcern(primaryConcern)}.`
            : "Your current state may be shaping how risky this feels.",
          deepLine: "Check whether this reflects a real limitation—or a momentary condition you can work around."
        };
      }

      return {
        title: "Fear-Driven",
        mainLine: primaryConcern
          ? `Your concern that ${mapConcern(primaryConcern)} may be shaping this decision more than the evidence warrants.${
              secondary
                ? ` There may also be an element of ${secondary.replace(/_/g, " ")} influencing how this feels.`
                : ""
            }`
          : "Fear may be shaping this decision more than the evidence warrants.",
        deepLine: "Check whether the risk is truly likely—or simply feels vivid in your mind."
      };

    case "validation_seeking":
      if (category === "Relationships") {
        return {
          title: "Seeking Approval",
          mainLine: "Concern over how you are perceived may be shaping this relationship decision.",
        deepLine: "Check whether your choice reflects genuine connection—or fear of how you may be judged."
        };
      }

      if (category === "Career") {
        return {
          title: "Seeking Approval",
          mainLine: "Part of this career decision may be influenced by how it reflects on you to others.",
        deepLine: "Check whether you are pursuing what matters to you—or what earns approval."
        };
      }

      return {
        title: "Seeking Approval",
        mainLine: "Part of this decision may be driven by how it reflects on you to others.",
      deepLine: "Check whether this choice serves your judgment—or your image."
      };

    case "scarcity_mindset":
      if (category === "Finances") {
        return {
          title: "Loss Focus",
          mainLine: primaryConcern
            ? `You may be focusing more on what you could lose here than what you might gain, especially when it comes to ${mapConcern(primaryConcern)}.`
            : "You may be focusing more on what you could lose here than what you might gain.",
          deepLine: "Check whether your caution reflects real tradeoffs—or just discomfort with uncertainty."
        };
      }

      if (category === "Career") {
        return {
          title: "Loss Focus",
          mainLine: primaryConcern
            ? `You may be focusing more on what you could lose than what you might gain, especially when it comes to ${mapConcern(primaryConcern)}.`
            : "You may be focusing more on what you could lose than what you might gain.",
          deepLine: "Check whether your caution reflects real tradeoffs—or fear of giving something up."
        };
      }

      if (category === "Relationships") {
        // Default loss framing for Relationships (no keyword-based branches)
        return {
          title: "Loss Focus",
          mainLine: primaryConcern
            ? `You may be focusing more on what you could lose in this connection than what you might build, especially around ${mapConcern(primaryConcern)}.`
            : "You may be focusing more on what you could lose in this connection than what you might build.",
          deepLine: "Check whether your caution reflects reality—or fear of emotional loss."
        };
      }

      return {
        title: "Loss Focus",
        mainLine: primaryConcern
          ? `You may be focusing more on what you could lose than what you might gain, especially when it comes to ${mapConcern(primaryConcern)}.`
          : "You may be focusing more on what you could lose than what you might gain.",
        deepLine: "Check whether your caution reflects real risk—or just discomfort with uncertainty."
      };

    case "identity_conflict":
      if (category === "Personal Growth") {
        return {
          title: "Inner Conflict",
          mainLine: "This may reflect tension between who you want to become and how you currently see yourself.",
        deepLine: "Check whether resistance comes from true limitation—or difficulty embracing growth."
        };
      }

      if (category === "Health") {
        return {
          title: "Inner Conflict",
          mainLine: "Part of this struggle may reflect tension between your intentions and your habits.",
        deepLine: "Check whether the challenge is the goal itself—or difficulty aligning with it consistently."
        };
      }

      if (category === "Career") {
        return {
          title: "Inner Conflict",
          mainLine: "This may reflect tension between your ambitions and how ready you feel to pursue them.",
        deepLine: "Check whether hesitation comes from practical limits—or self-doubt."
        };
      }

      return {
        title: "Inner Conflict",
        mainLine: "This may reflect tension between what feels right to you and what your life currently allows.",
      deepLine: "Check whether the discomfort comes from the decision—or from feeling out of alignment."
      };

    case "ambition_tension":
      if (category === "Career") {
        return {
          title: "Overextended",
          mainLine: "You may feel pulled between professional growth and the pressure that growth creates.",
        deepLine: "Check whether your strain comes from healthy ambition—or stretching beyond your limits."
        };
      }

      if (category === "Personal Growth") {
        return {
          title: "Overextended",
          mainLine: "You may be pushing yourself toward growth faster than your current capacity allows.",
        deepLine: "Check whether your expectations are motivating—or becoming self-imposed pressure."
        };
      }

      if (category === "Productivity") {
        return {
          title: "Overextended",
          mainLine: "Part of your pressure may come from expecting more of yourself than is sustainable.",
        deepLine: "Check whether your standards are helping performance—or creating strain."
        };
      }

      return {
        title: "Overextended",
        mainLine: "You may feel torn between the desire to grow and the limits of your current capacity.",
      deepLine: "Check whether the pressure comes from ambition—or from overextension."
      };

    case "emotional_attachment":
      if (category === "Relationships") {
        // Default emotional attachment for Relationships (no keyword-based branches)
        return {
          title: "Emotion-Led",
          mainLine:
            `You may feel strongly about this.${
              secondary
                ? ` There may also be an element of ${secondary.replace(/_/g, " ")} influencing how this feels.`
                : ""
            }`,
          deepLine:
            "Check whether this reflects clear judgment—or emotion making things feel more certain than they are."
        };
      }

      if (category === "Career") {
        return {
          title: "Emotion-Led",
          mainLine: "Emotion may be influencing this career decision more than pure judgment.",
        deepLine: "Check whether your choice reflects long-term thinking—or current feeling."
        };
      }

      if (category === "Personal Growth") {
        return {
          title: "Emotion-Led",
          mainLine: "Emotion may be shaping your self-view alongside reason here.",
        deepLine: "Check whether your judgment reflects truth—or temporary feeling."
        };
      }

      return {
        title: "Emotion-Led",
        mainLine: "Strong emotion may be shaping this decision alongside reason.",
      deepLine: "Check whether your judgment is coming from clarity—or emotional need."
      };

    case "impulse_restlessness":
      if (category === "Productivity") {
        return {
          title: "Restless",
          mainLine: primaryConcern
            ? `You may be struggling to follow through on this.`
            : "You may be struggling to follow through despite wanting progress.",
          deepLine: "Check whether this is a matter of clarity—or difficulty staying with the effort long enough."
        };
      }

      if (category === "Lifestyle") {
        return {
          title: "Restless",
          mainLine: "The urge for change may be driven more by discomfort than by true dissatisfaction.",
        deepLine: "Check whether you are improving your environment—or reacting against unease."
        };
      }

      if (category === "Health") {
        return {
          title: "Restless",
          mainLine: "Part of this push may come from pressure to keep improving rather than genuine need.",
        deepLine: "Check whether your effort is disciplined—or driven by discomfort with slowing down."
        };
      }

      return {
        title: "Restless",
        mainLine: primaryConcern
          ? `You may be leaning toward what feels easier right now rather than what matters longer term, especially when it comes to following through on this.`
          : "You may be leaning toward what feels easier right now rather than what matters longer term.",
        deepLine: "Check whether this is a clear choice—or just avoiding the effort this change requires."
      };

    case "clear_conviction":
    default: {
      const t = primaryConcern?.toLowerCase();

      // Mild career self-doubt
      if (category === "Career" && t === "not good enough") {
        return {
          title: "Clear-Headed",
          mainLine: "You may be holding yourself back more than the situation requires.",
          deepLine: "Check whether your hesitation reflects real limits—or underestimating yourself."
        };
      }

      // Mild financial restraint
      if (category === "Finances" && t === "not worth it") {
        return {
          title: "Clear-Headed",
          mainLine: "This may be more about avoiding waste than evaluating value clearly.",
          deepLine: "Check whether you're dismissing something useful—or simply being cautious."
        };
      }

      // Mild regret anticipation
      if (category === "Finances" && t === "will regret it") {
        return {
          title: "Clear-Headed",
          mainLine: "You may be overestimating how much this will matter later.",
          deepLine: "Check whether this will actually feel significant over time—or just seems that way now."
        };
      }

      // Fallback neutral
      return {
        title: "Clear-Headed",
        mainLine: "Your judgment here seems steady and well balanced.",
        deepLine: "Proceed—but keep testing the assumptions behind your confidence."
      };
    }
  }
}

export function getPostOutcomeInsight(
  worstOutcomeOccurred?: boolean,
  probability?: number
): string {
  if (typeof probability === "number") {
    if (worstOutcomeOccurred) {
      if (probability < 40) {
        return "You expected this to be unlikely, yet it still happened. Check what signals you may have underestimated.";
      }
      if (probability < 70) {
        return "There was uncertainty, and the outcome did occur. Check what tipped the balance.";
      }
      return "You expected this strongly, and it did occur. Check whether your judgment was based on solid signals or assumption.";
    } else {
      if (probability > 70) {
        return "You expected this to go wrong, but it didn’t. Check whether you tend to overestimate risk in similar situations.";
      }
      if (probability > 40) {
        return "There was some concern, but things turned out better. Check what made the outcome more favorable than expected.";
      }
      return "You expected things to go smoothly, and they did. Check whether this reflects a reliable pattern or a single instance.";
    }
  }

  if (worstOutcomeOccurred) {
    return "The feared outcome occurred. Compare your confidence with reality and note what signals you relied on.";
  }

  return "The feared outcome did not occur. Notice the gap between expectation and reality and what drove the expectation.";
}