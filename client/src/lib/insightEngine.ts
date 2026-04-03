import { getLearningData } from "@/lib/learningStore";
export function useInsightEngine(decisions: any[]) {
  const decisionsWithOutcome = decisions.filter(
    (d: any) => d.worstOutcomeOccurred !== undefined
  );

  const total = decisionsWithOutcome.length;
  const hasEnoughData = total >= 3;
  const occurredNow = decisionsWithOutcome.filter(
    (d: any) => d.worstOutcomeOccurred === true
  ).length;
  const learning = getLearningData();

  let insight: string | null = null;
  let secondaryInsight: string | null = null;
  let dominantPattern: string | null = null;
  let dominantTheme: string | null = null;
  let deepInsight: string | null = null;
  let reflectionQuestion: string | null = null;
  let patternBreak: string | null = null;
  let trend: "improving" | "worsening" | "stable" = "stable";
  let finalInsight: string | null = null;
  let finalNudge: string | null = null;
  let middleInsight: string | null = null;
  let actionSuggestion: string | null = null;
  let mismatch = "";
  let stakesMismatch = "";
  let confidenceMismatch = "";
  let speedMismatch = "";
  let repeatPattern = "";
  let biasLoop = "";
  let categoryShift = "";
  let categoryLearningInsight: string | null = null;
  let confidenceInsight: string | null = null;
  // --- Base insight (moved) ---
  if (total >= 3 && total < 5) {
    const occurred = decisionsWithOutcome.filter(
      (d: any) => d.worstOutcomeOccurred === true
    ).length;

    insight = `A pattern is starting to form — in a few recent decisions, what you feared happened ${occurred} time${occurred !== 1 ? "s" : ""}.`;
  }

  if (total >= 5) {
    const occurred = decisionsWithOutcome.filter(
      (d: any) => d.worstOutcomeOccurred === true
    ).length;

    const sessionRate = occurred / total;

    const historicalRate =
      learning.totalDecisions > 5
        ? learning.totalOccurred / learning.totalDecisions
        : null;

    // Blend session + history
    const rate = historicalRate
      ? (sessionRate + historicalRate) / 2
      : sessionRate;

    // --- Confidence learning signal ---

    if (learning.confidenceStats.highConfidenceTotal >= 5) {
      const confidenceRate =
        learning.confidenceStats.highConfidenceOccurred /
        learning.confidenceStats.highConfidenceTotal;

      if (confidenceRate > rate + 0.2) {
        confidenceInsight =
          "You tend to feel confident in decisions that don’t always turn out well.";
      } else if (confidenceRate < rate - 0.2) {
        confidenceInsight =
          "When you feel confident, your decisions tend to work out better than usual.";
      }
    }

    // --- Category learning signal ---
    if (learning.categoryStats) {
      let strongestCategory: string | null = null;
      let strongestDiff = 0;

      Object.entries(learning.categoryStats).forEach(([cat, stats]: any) => {
        if (stats.total >= 5) {
          const catRate = stats.occurred / stats.total;

          if (Math.abs(catRate - rate) > strongestDiff) {
            strongestDiff = Math.abs(catRate - rate);
            strongestCategory = cat;
          }
        }
      });

      if (strongestCategory && strongestDiff >= 0.2) {
        const stats = learning.categoryStats[strongestCategory];
        const catRate = stats.occurred / stats.total;

        if (catRate > rate) {
          categoryLearningInsight =
            `Your ${strongestCategory} decisions tend to turn out worse than your usual pattern.`;
        } else {
          categoryLearningInsight =
            `Your ${strongestCategory} decisions tend to turn out better than your usual pattern.`;
        }
      }
    }

    if (rate <= 0.25) {
      const variants = [
        `You often expect things to go wrong — but in ${total} decisions, that rarely happened (${occurred}/${total}).`,
        `You’ve been leaning toward worst-case thinking, even though outcomes rarely support it (${occurred}/${total}).`,
        `Your expectations seem more cautious than reality — most feared outcomes didn’t happen (${occurred}/${total}).`
      ];
      insight = variants[(total + occurred) % variants.length];
    } else if (rate <= 0.5) {
      const variants = [
        `What you worry about sometimes happens — but just as often, it doesn’t (${occurred}/${total}).`,
        `Your expectations are split — some fears play out, others don’t (${occurred}/${total}).`,
        `You’re balancing between caution and reality — outcomes don’t consistently match your fears (${occurred}/${total}).`
      ];
      insight = variants[(total + occurred) % variants.length];
    } else {
      const variants = [
        `Lately, many of the things you worry about have been playing out (${occurred}/${total}).`,
        `Your concerns have often matched reality in recent decisions (${occurred}/${total}).`,
        `What you anticipate tends to happen more often than not (${occurred}/${total}).`
      ];
      insight = variants[(total + occurred) % variants.length];
    }
  }

  // --- Secondary behavioral insight (simple heuristic) ---
  if (total >= 3) {
    const texts = decisions
      .map((d: any) => (d.worstCase || d.title || "").toLowerCase())
      .join(" ");

    const score = {
      regret: (texts.match(/regret|miss|wrong choice/g) || []).length,
      money: (texts.match(/money|loss|cost|pay/g) || []).length,
      judgment: (texts.match(/people|think|judge|embarrass/g) || []).length,
      control: (texts.match(/control|uncertain|unknown|risk/g) || []).length,
    };

    const top = Object.entries(score).sort((a, b) => b[1] - a[1])[0];

    // New: single source of truth for theme
    dominantTheme = top && top[1] > 0 ? (top[0] as string) : null;

    // Dominant Pattern Insight
    if (top && top[1] > 0) {
      const recent = decisions.slice(0, 3)
        .map((d: any) => d.title || "")
        .filter(Boolean)
        .slice(0, 2);

      const examples = recent.length
        ? ` (e.g., ${recent.join(", ")})`
        : "";

      if (top[0] === "regret") {
        dominantPattern = `You repeatedly fear making the wrong choice${examples}.`;
      } else if (top[0] === "money") {
        dominantPattern = `Money-related concerns show up frequently${examples}.`;
      } else if (top[0] === "judgment") {
        dominantPattern = `Concern about others’ opinions appears often${examples}.`;
      } else if (top[0] === "control") {
        dominantPattern = `Uncertainty and lack of control keep recurring${examples}.`;
      }
    }

    if (top && top[1] > 0) {
      if (top[0] === "regret") {
        secondaryInsight = "You often worry about making the wrong choice.";
      } else if (top[0] === "money") {
        secondaryInsight = "Financial downside tends to weigh on your decisions.";
      } else if (top[0] === "judgment") {
        secondaryInsight = "You seem sensitive to how others might see your decisions.";
      } else if (top[0] === "control") {
        secondaryInsight = "Uncertainty and lack of control seem to bother you.";
      }
    }
  }

  // --- Fallback secondary insight (based on outcomes) ---
  if (total >= 3 && !secondaryInsight) {
    const occurred = decisionsWithOutcome.filter(
      (d: any) => d.worstOutcomeOccurred === true
    ).length;

    const rate = occurred / total;

    if (rate <= 0.25) {
      secondaryInsight = "You tend to overestimate how often things go wrong.";
    } else if (rate <= 0.5) {
      secondaryInsight = "Your expectations are fairly balanced between risk and outcome.";
    } else {
      secondaryInsight = "You may be underestimating how often things can go wrong.";
    }
  }

  // --- Deep insight (progressive depth) ---
  if (total >= 5) {
    const occurred = decisionsWithOutcome.filter(
      (d: any) => d.worstOutcomeOccurred === true
    ).length;

    const sessionRate = occurred / total;

    const historicalRate =
      learning.totalDecisions > 5
        ? learning.totalOccurred / learning.totalDecisions
        : null;

    const rate = historicalRate
      ? (sessionRate + historicalRate) / 2
      : sessionRate;

    if (total < 10) {
      if (rate <= 0.25) {
        deepInsight = "You’re often reacting to imagined outcomes more than actual ones.";
      } else if (rate <= 0.5) {
        deepInsight = "Your sense of risk seems influenced as much by feeling as by reality.";
      } else {
        deepInsight = "Your expectations may be shaped by past negative experiences more than present evidence.";
      }
    } else if (total < 15) {
      if (rate <= 0.25) {
        deepInsight = "You keep expecting the worst — but your own outcomes don’t support that.";
      } else if (rate <= 0.5) {
        deepInsight = "Your sense of risk isn’t stable — you’re reacting more to feeling than to what actually happens.";
      } else {
        deepInsight = "You expect negative outcomes — and your decisions may be reinforcing that pattern.";
      }
    } else {
      if (rate <= 0.25) {
        deepInsight = "You’re acting on imagined risk — not on evidence. Your own data keeps proving that.";
      } else if (rate <= 0.5) {
        deepInsight = "Your decisions are being shaped by how things feel, not by how they actually turn out.";
      } else {
        deepInsight = "You’re expecting negative outcomes — and that expectation may be shaping the results you get.";
      }
    }
  }

  // --- Occasional reflection question (pattern-adaptive) ---
  if (total >= 5) {
    // --- Trend calculation ---
    const recentSlice = decisionsWithOutcome.slice(0, 5);
    const recentOccurred = recentSlice.filter(
      (d: any) => d.worstOutcomeOccurred === true
    ).length;
    const recentRate =
      recentSlice.length > 0 ? recentOccurred / recentSlice.length : 0;

    const overallOccurred = decisionsWithOutcome.filter(
      (d: any) => d.worstOutcomeOccurred === true
    ).length;
    const overallRate = overallOccurred / total;

    trend =
      recentRate > overallRate + 0.2
        ? "worsening"
        : recentRate < overallRate - 0.2
        ? "improving"
        : "stable";


    if (decisionsWithOutcome.length >= 6) {
      const last3 = decisionsWithOutcome.slice(0, 3);
      const prev3 = decisionsWithOutcome.slice(3, 6);

      // --- Category shift detection ---
      const last3Categories = last3.map((d: any) => d.category || "").join(" ").toLowerCase();
      const prev3Categories = prev3.map((d: any) => d.category || "").join(" ").toLowerCase();

      const categoryKeywords = {
        career: /(job|career|work|promotion|switch)/g,
        money: /(money|cost|salary|pay|expense)/g,
        relationships: /(relationship|family|friend|partner)/g,
        health: /(health|fitness|exercise|diet)/g,
      };

      for (const [key, regex] of Object.entries(categoryKeywords)) {
        const lastCount = (last3Categories.match(regex) || []).length;
        const prevCount = (prev3Categories.match(regex) || []).length;

        if (Math.abs(lastCount - prevCount) >= 2) {
          categoryShift = ` — your recent decisions are more about ${key} than before.`;
          break;
        }
      }

      // --- Decision type vs outcome mismatch ---
      const categories = ["career", "money", "relationships", "health"];

      for (const cat of categories) {
        const lastCat = last3.filter((d: any) =>
          (d.category || "").toLowerCase().includes(cat)
        );

        if (lastCat.length >= 2) {
          const lastCatRate =
            lastCat.filter((d: any) => d.worstOutcomeOccurred === true).length /
            lastCat.length;

          const overallRate =
            decisionsWithOutcome.filter((d: any) => d.worstOutcomeOccurred === true)
              .length / total;

          if (Math.abs(lastCatRate - overallRate) >= 0.4) {
            if (lastCatRate > overallRate) {
              mismatch = ` — your recent ${cat} decisions are turning out worse than your usual pattern.`;
            } else {
              mismatch = ` — your recent ${cat} decisions are turning out better than your usual pattern.`;
            }
            break;
          }
        }
      }

      // --- High-stakes vs low-stakes mismatch ---
      const lastHighStakes = last3.filter((d: any) => (d.importance || 0) >= 4);
      if (lastHighStakes.length >= 2) {
        const highStakesRate =
          lastHighStakes.filter((d: any) => d.worstOutcomeOccurred === true).length /
          lastHighStakes.length;

        const overallRate =
          decisionsWithOutcome.filter((d: any) => d.worstOutcomeOccurred === true)
            .length / total;

        if (Math.abs(highStakesRate - overallRate) >= 0.4) {
          if (highStakesRate > overallRate) {
            stakesMismatch =
              " — higher-stakes decisions seem to be turning out worse than usual.";
          } else {
            stakesMismatch =
              " — higher-stakes decisions are turning out better than your usual pattern.";
          }
        }
      }

      // --- Confidence vs outcome mismatch ---
      const lastHighConfidence = last3.filter((d: any) => (d.confidence || 0) >= 0.7);
      if (lastHighConfidence.length >= 2) {
        const confidenceRate =
          lastHighConfidence.filter((d: any) => d.worstOutcomeOccurred === true)
            .length / lastHighConfidence.length;

        const overallRate =
          decisionsWithOutcome.filter((d: any) => d.worstOutcomeOccurred === true)
            .length / total;

        if (Math.abs(confidenceRate - overallRate) >= 0.4) {
          if (confidenceRate > overallRate) {
            confidenceMismatch =
              " — you seem more confident in decisions that don’t always turn out well.";
          } else {
            confidenceMismatch =
              " — when you're confident, outcomes tend to be better than usual.";
          }
        }
      }

      // --- Decision speed vs outcome ---
      const lastFast = last3.filter((d: any) => (d.decisionTime || 0) <= 2); // fast decisions (e.g. quick)
      if (lastFast.length >= 2) {
        const fastRate =
          lastFast.filter((d: any) => d.worstOutcomeOccurred === true).length /
          lastFast.length;

        const overallRate =
          decisionsWithOutcome.filter((d: any) => d.worstOutcomeOccurred === true)
            .length / total;

        if (Math.abs(fastRate - overallRate) >= 0.4) {
          if (fastRate > overallRate) {
            speedMismatch =
              " — quicker decisions seem to lead to worse outcomes.";
          } else {
            speedMismatch =
              " — quicker decisions seem to work better than your usual pattern.";
          }
        }
      }

      // --- Repeated mistake patterns ---
      const recentWorstCases = last3.map((d: any) =>
        (d.worstCase || "").toLowerCase()
      );

      const duplicates = recentWorstCases.filter(
        (item, index) => item && recentWorstCases.indexOf(item) !== index
      );

      if (duplicates.length >= 2) {
        repeatPattern =
          " — you seem to be encountering the same feared outcome repeatedly.";
      }

      // --- Bias loop detection ---
      const fearTexts = decisionsWithOutcome
        .slice(0, 6)
        .map((d: any) => (d.worstCase || "").toLowerCase());

      const loopMatches = fearTexts.filter(
        (item, index) => item && fearTexts.indexOf(item) !== index
      );

      if (loopMatches.length >= 3) {
        biasLoop =
          " — a similar fear keeps coming up again and again, suggesting a pattern loop.";
      }

      const last3Rate =
        last3.filter((d: any) => d.worstOutcomeOccurred === true).length /
        last3.length;

      const prev3Rate =
        prev3.filter((d: any) => d.worstOutcomeOccurred === true).length /
        prev3.length;

      const threshold = total < 10 ? 0.25 : 0.3;

      if (Math.abs(last3Rate - prev3Rate) >= threshold) {
        const openers = [
          "Something seems to have shifted — ",
          "There’s a noticeable change — ",
          "Your recent decisions show a shift — "
        ];
        const opener = openers[(total + occurredNow) % openers.length];
        let cause = "";
        if (dominantTheme) {
          if (dominantTheme === "regret") {
            cause = " — you may be reacting more to fear of regret.";
          } else if (dominantTheme === "money") {
            cause = " — financial concerns might be influencing you more than before.";
          } else if (dominantTheme === "judgment") {
            cause = " — concern about how others see your decisions may be playing a bigger role.";
          } else if (dominantTheme === "control") {
            cause = " — uncertainty or lack of control might be affecting your choices more.";
          }
        }

        const signals = [
          mismatch,
          stakesMismatch,
          confidenceMismatch,
          speedMismatch,
          repeatPattern,
          biasLoop,
          categoryShift
        ].filter(Boolean);

        const strongestSignal = signals.slice(0, 2).join("");

        if (last3Rate > prev3Rate) {
          const trendHint = trend === "worsening" ? " This decline seems recent." : "";
          patternBreak =
            opener +
            "decisions are turning out worse than before — something may have shifted" +
            cause +
            strongestSignal +
            trendHint;
        } else {
          const trendHint = trend === "improving" ? " This improvement seems recent." : "";
          patternBreak =
            opener +
            "decisions are turning out better than before — this is different from your usual pattern" +
            cause +
            strongestSignal +
            trendHint;
        }
      }
    }

    let questions: string[] = [];

    if (dominantTheme) {
      if (dominantTheme === "regret") {
        questions = [
          "What would choosing without fear of regret look like?",
          "Are you trying to avoid regret — or make a good decision?",
          "If regret wasn’t a concern, what would you do?"
        ];
      } else if (dominantTheme === "money") {
        questions = [
          "Are you overweighing financial downside compared to actual risk?",
          "What would this decision look like if money wasn’t the main concern?",
          "Are you protecting against loss — or avoiding opportunity?"
        ];
      } else if (dominantTheme === "judgment") {
        questions = [
          "How much of this decision is shaped by how others might see it?",
          "Would you choose differently if no one else knew?",
          "Are you optimizing for approval or for outcome?"
        ];
      } else if (dominantTheme === "control") {
        questions = [
          "Are you avoiding this because it feels uncertain?",
          "How much control do you actually need before deciding?",
          "What would you do if you accepted some uncertainty here?"
        ];
      }
    }

    // Fallback (trend-aware)
    if (questions.length === 0) {
      if (trend === "improving") {
        questions = [
          "Your recent decisions are going better — are you noticing that shift?",
          "What changed in how you're approaching decisions lately?",
          "Can you trust this recent trend more?"
        ];
      } else if (trend === "worsening") {
        questions = [
          "Something seems to have shifted — are you becoming more cautious or reactive?",
          "Are recent fears influencing you more than before?",
          "What changed in how you're evaluating risk lately?"
        ];
      } else {
        questions = [
          "Your pattern is steady — do you want to challenge it or continue it?",
          "Are you comfortable with how your decisions are playing out?",
          "What would it take to shift this pattern?"
        ];
      }
    }

    // Show more consistently (but not too often)
    if (total % 2 === 0) {
      reflectionQuestion = questions[total % questions.length];
    }

    // --- Learning-aware reflection refinement ---
    if (reflectionQuestion) {
      if (confidenceInsight) {
        if (confidenceInsight.includes("don’t always turn out well")) {
          reflectionQuestion += " Are you trusting your confidence more than your actual outcomes?";
        } else if (confidenceInsight.includes("work out better")) {
          reflectionQuestion += " Are you underestimating situations where your confidence is actually reliable?";
        }
      }

      if (categoryLearningInsight) {
        if (categoryLearningInsight.includes("worse")) {
          reflectionQuestion += " What is different about this type of decision that leads to worse outcomes?";
        } else if (categoryLearningInsight.includes("better")) {
          reflectionQuestion += " What are you doing differently in this area that works well?";
        }
      }
    }

    // Occasionally elevate pattern break into reflection (not always)
    if (patternBreak && total % 2 === 0) {
      reflectionQuestion = patternBreak;
    }
  }

  // --- Smart composition layer ---
  // Compose orchestrated outputs
  const rateNow = total > 0 ? occurredNow / total : 0;

  if (total >= 5) {
    if (rateNow <= 0.25) {
      actionSuggestion = "Next time: write a quick probability estimate before deciding.";
    } else if (rateNow > 0.5) {
      actionSuggestion = "Next time: stress-test the worst case and define a fallback.";
    }
  }

  // Pattern-specific action (overrides generic if present)
  if (dominantPattern) {
    if (dominantPattern.toLowerCase().includes("money")) {
      actionSuggestion = "Next time: separate financial risk from emotional discomfort.";
    } else if (dominantPattern.toLowerCase().includes("wrong choice")) {
      actionSuggestion = "Next time: choose based on values, not fear of regret.";
    } else if (dominantPattern.toLowerCase().includes("opinions")) {
      actionSuggestion = "Next time: decide as if no one else would know.";
    } else if (dominantPattern.toLowerCase().includes("uncertainty")) {
      actionSuggestion = "Next time: decide with a small step instead of waiting for certainty.";
    }
  }

  // Signal-specific action (multi-signal aware)
  const actionSignals = [
    confidenceMismatch && "calibrate your confidence — pause and reassess",
    speedMismatch && "adjust your pace — don’t rush important decisions",
    stakesMismatch && "match effort to stakes — treat high-impact decisions more carefully",
    mismatch && "notice which areas are going worse — adjust your approach there",
    repeatPattern && "break the loop — try a different response to the same fear",
    biasLoop && "question recurring fears — they may not reflect reality"
  ].filter(Boolean) as string[];

  if (actionSignals.length > 0) {
    actionSuggestion = "Next time: " + actionSignals.slice(0, 2).join(" and ") + ".";
  }

  // Merge learning with signal-based actions (augment, not replace)
  if (actionSignals.length > 0) {
    const extras: string[] = [];

    if (categoryLearningInsight) {
      if (categoryLearningInsight.includes("worse")) {
        extras.push("be more cautious in this type of decision");
      } else if (categoryLearningInsight.includes("better")) {
        extras.push("trust your approach in this area");
      }
    }

    if (confidenceInsight) {
      if (confidenceInsight.includes("don’t always turn out well")) {
        extras.push("double-check decisions you feel very confident about");
      } else if (confidenceInsight.includes("work out better")) {
        extras.push("lean into decisions where you feel confident");
      }
    }

    if (extras.length > 0) {
      // append up to one extra to keep it concise
      actionSuggestion =
        (actionSuggestion || "Next time:") +
        " Also, " +
        extras.slice(0, 1).join(" and ") +
        ".";
    }
  }

  // Learning-aware action refinement
  if (!actionSignals.length && categoryLearningInsight) {
    if (categoryLearningInsight.includes("worse")) {
      actionSuggestion = "Next time: be more cautious in this type of decision — your past data shows higher risk.";
    } else if (categoryLearningInsight.includes("better")) {
      actionSuggestion = "Next time: trust your approach in this area — it tends to work well.";
    }
  }

  if (!actionSignals.length && confidenceInsight) {
    if (confidenceInsight.includes("don’t always turn out well")) {
      actionSuggestion = "Next time: pause and double-check decisions you feel very confident about.";
    } else if (confidenceInsight.includes("work out better")) {
      actionSuggestion = "Next time: lean into decisions where you feel confident — your judgment there is reliable.";
    }
  }

  // Trend-aware action (only if no strong signal-based action)
  if (actionSignals.length === 0 && total >= 7) {
    if (trend === "worsening") {
      actionSuggestion = "Next time: slow down and review your recent decisions before acting.";
    } else if (trend === "improving") {
      actionSuggestion = "Next time: trust what you're doing differently — something is working.";
    }
  }

  // --- Insight Orchestrator ---
  // PRIORITY 1 — pattern break (strongest signal)
  if (patternBreak && total >= 7) {
    finalInsight = patternBreak;
  }
  // PRIORITY 2 — category shift (context signal)
  else if (!patternBreak && total >= 7 && categoryShift) {
    finalInsight = "Your focus seems to have shifted recently" + categoryShift;
  }
  // PRIORITY 3 — trend signal (now modifies insight instead of being standalone)
  else if (!patternBreak && total >= 7 && trend !== "stable" && insight) {
    const trendHint =
      trend === "worsening"
        ? " — and this seems to be getting slightly worse recently."
        : " — and this seems to be improving recently.";

    finalInsight = insight + trendHint;
  }
  // PRIORITY 4 — loop awareness (behavioral pattern)
  else if (!patternBreak && total >= 7 && (repeatPattern || biasLoop)) {
    finalInsight =
      "You seem to be repeating a pattern in your decisions" +
      (repeatPattern || biasLoop);
  }
  // PRIORITY 5 — personalized insight
  else if (dominantPattern && insight) {
    const dp = dominantPattern.trim().endsWith(".")
      ? dominantPattern.trim()
      : `${dominantPattern.trim()}.`;

    finalInsight = `${dp} ${insight}`;
  }
  // PRIORITY 6 — fallback
  else {
    finalInsight = insight;
  }

  // Adaptive middle layer (avoid repetition with main insight)
  if (patternBreak && total >= 7) {
    middleInsight = null; // already strong
  } else if (
    deepInsight &&
    finalInsight &&
    !finalInsight.toLowerCase().includes(deepInsight.slice(0, 20).toLowerCase())
  ) {
    middleInsight = deepInsight;
  } else {
    middleInsight = secondaryInsight;
  }

  // Base nudge (use lighter guidance; keep deepInsight as WHY layer)
  if (secondaryInsight) {
    finalNudge = secondaryInsight;
  }

  // Occasionally reflection (slightly more visible)
  if (reflectionQuestion && total >= 5 && total % 4 === 0) {
    finalNudge = `Pause: ${reflectionQuestion}`;
  }

  // Prefer action when strong signal (but not always)
  if (actionSuggestion && total >= 7 && total % 3 !== 0) {
    finalNudge = actionSuggestion;
  }

  // Occasionally allow reflection to surface even with strong signals
  if (patternBreak && total >= 7) {
    if (total % 3 === 0 && reflectionQuestion) {
      finalNudge = `Pause: ${reflectionQuestion}`;
    } else {
      finalNudge = actionSuggestion || null;
    }
  }

  // --- Global learning integration (avoid overloading strong insights) ---
  if (finalInsight && !patternBreak) {
    if (confidenceInsight) {
      finalInsight += " " + confidenceInsight;
    }

    if (categoryLearningInsight) {
      finalInsight += " " + categoryLearningInsight;
    }
  }

  return {
    hasEnoughData,
    finalInsight,
    middleInsight,
    finalNudge
  };
}