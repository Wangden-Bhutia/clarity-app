import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Search, Circle, CheckCircle2 } from "lucide-react";
import { db, Decision } from "@/lib/db";

export default function Journal() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [filteredDecisions, setFilteredDecisions] = useState<Decision[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const params = new URLSearchParams(window.location.search);
  const initialFilter = (params.get("filter") as any) || "all";
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "recorded" | "review"
  >(initialFilter);

  const [isLoading, setIsLoading] = useState(true);
  // --- Insight (based on outcomes) ---
  const decisionsWithOutcome = decisions.filter(
    (d: any) => d.worstOutcomeOccurred !== undefined
  );

  const total = decisionsWithOutcome.length;
  const hasEnoughData = total >= 3;

let insight: string | null = null;
let secondaryInsight: string | null = null;
let deepInsight: string | null = null;
let reflectionQuestion: string | null = null;

let dominantPattern: string | null = null;

  if (total >= 3 && total < 5) {
    // Early signal (gentle)
    const occurred = decisionsWithOutcome.filter(
      (d: any) => d.worstOutcomeOccurred === true
    ).length;

    insight = `A pattern is starting to form — in a few recent decisions, what you feared happened ${occurred} time${occurred !== 1 ? "s" : ""}.`;
  }

  if (total >= 5) {
    const occurred = decisionsWithOutcome.filter(
      (d: any) => d.worstOutcomeOccurred === true
    ).length;

    const rate = occurred / total;

    if (rate <= 0.25) {
      const variants = [
        `You often expect things to go wrong — but in ${total} decisions, that rarely happened (${occurred}/${total}).`,
        `You’ve been leaning toward worst-case thinking, even though outcomes rarely support it (${occurred}/${total}).`,
        `Your expectations seem more cautious than reality — most feared outcomes didn’t happen (${occurred}/${total}).`
      ];
      insight = variants[total % variants.length];
    } else if (rate <= 0.5) {
      const variants = [
        `What you worry about sometimes happens — but just as often, it doesn’t (${occurred}/${total}).`,
        `Your expectations are split — some fears play out, others don’t (${occurred}/${total}).`,
        `You’re balancing between caution and reality — outcomes don’t consistently match your fears (${occurred}/${total}).`
      ];
      insight = variants[total % variants.length];
    } else {
      const variants = [
        `Lately, many of the things you worry about have been playing out (${occurred}/${total}).`,
        `Your concerns have often matched reality in recent decisions (${occurred}/${total}).`,
        `What you anticipate tends to happen more often than not (${occurred}/${total}).`
      ];
      insight = variants[total % variants.length];
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

    const rate = occurred / total;

    // Base layer (5+)
    if (total < 10) {
      if (rate <= 0.25) {
        deepInsight = "You’re often reacting to imagined outcomes more than actual ones.";
      } else if (rate <= 0.5) {
        deepInsight = "Your sense of risk seems influenced as much by feeling as by reality.";
      } else {
        deepInsight = "Your expectations may be shaped by past negative experiences more than present evidence.";
      }
    }

    // Stronger framing (10+)
    else if (total < 15) {
      if (rate <= 0.25) {
        deepInsight = "You keep expecting the worst — but your own outcomes don’t support that.";
      } else if (rate <= 0.5) {
        deepInsight = "Your sense of risk isn’t stable — you’re reacting more to feeling than to what actually happens.";
      } else {
        deepInsight = "You expect negative outcomes — and your decisions may be reinforcing that pattern.";
      }
    }

    // Deepest framing (15+)
    else {
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

    const trend =
      recentRate > overallRate + 0.2
        ? "worsening"
        : recentRate < overallRate - 0.2
        ? "improving"
        : "stable";

    // --- Pattern break detection ---
    let patternBreak: string | null = null;

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

      let categoryShift = "";

      for (const [key, regex] of Object.entries(categoryKeywords)) {
        const lastCount = (last3Categories.match(regex) || []).length;
        const prevCount = (prev3Categories.match(regex) || []).length;

        if (Math.abs(lastCount - prevCount) >= 2) {
          categoryShift = ` — your recent decisions are more about ${key} than before.`;
          break;
        }
      }

      // --- Decision type vs outcome mismatch ---
      let mismatch = "";

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
      let stakesMismatch = "";

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
      let confidenceMismatch = "";

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
      let speedMismatch = "";

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
      let repeatPattern = "";

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
      let biasLoop = "";

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

      if (Math.abs(last3Rate - prev3Rate) >= 0.5) {
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

        let cause = "";

        if (top && top[1] > 0) {
          if (top[0] === "regret") {
            cause = " — you may be reacting more to fear of regret.";
          } else if (top[0] === "money") {
            cause = " — financial concerns might be influencing you more than before.";
          } else if (top[0] === "judgment") {
            cause = " — concern about how others see your decisions may be playing a bigger role.";
          } else if (top[0] === "control") {
            cause = " — uncertainty or lack of control might be affecting your choices more.";
          }
        }

        if (last3Rate > prev3Rate) {
          patternBreak = "Your recent decisions are turning out worse than before — something may have shifted" + cause + categoryShift + mismatch + stakesMismatch + confidenceMismatch + speedMismatch + repeatPattern + biasLoop;
        } else {
          patternBreak = "Your recent decisions are turning out better than before — this is different from your usual pattern" + cause + categoryShift + mismatch + stakesMismatch + confidenceMismatch + speedMismatch + repeatPattern + biasLoop;
        }
      }
    }

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

    let questions: string[] = [];

    if (top && top[1] > 0) {
      if (top[0] === "regret") {
        questions = [
          "What would choosing without fear of regret look like?",
          "Are you trying to avoid regret — or make a good decision?",
          "If regret wasn’t a concern, what would you do?"
        ];
      } else if (top[0] === "money") {
        questions = [
          "Are you overweighing financial downside compared to actual risk?",
          "What would this decision look like if money wasn’t the main concern?",
          "Are you protecting against loss — or avoiding opportunity?"
        ];
      } else if (top[0] === "judgment") {
        questions = [
          "How much of this decision is shaped by how others might see it?",
          "Would you choose differently if no one else knew?",
          "Are you optimizing for approval or for outcome?"
        ];
      } else if (top[0] === "control") {
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

    // Show occasionally
    if (total % 3 === 0) {
      reflectionQuestion = questions[total % questions.length];
    }

    // Override with pattern break if detected
    if (patternBreak) {
      reflectionQuestion = patternBreak;
    }
  }

  // --- Review-ready count ---
  const nowTs = Date.now();
  const reviewReadyCount = decisions.filter((d: any) =>
    d.outcomeStatus === "pending" && d.reviewDate && d.reviewDate <= nowTs
  ).length;

 

  useEffect(() => {
    const loadData = async () => {
      const all = await db.getAllDecisions();
      all.sort((a, b) => b.date - a.date);
      setDecisions(all);
      setFilteredDecisions(all);
      setIsLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    let result = decisions;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          d.options.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      if (statusFilter === "review") {
        const now = Date.now();
        result = result.filter(
          (d) =>
            d.outcomeStatus === "pending" &&
            d.reviewDate &&
            d.reviewDate <= now
        );
      } else {
        result = result.filter((d) => d.outcomeStatus === statusFilter);
      }
    }

    setFilteredDecisions(result);
  }, [searchQuery, statusFilter, decisions]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-t border-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto flex flex-col gap-6 py-6 px-4 max-w-2xl mx-auto w-full pb-32">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-light mb-3">Journal</h1>
          <p className="text-muted-foreground/60 text-xs">
            A quiet record of your choices.
          </p>
        </div>

      </header>
      {/* Pattern Signal merged into Insight card below */}
      {hasEnoughData && insight && (
        <div className="mt-4 px-5 py-5 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
          <p className="text-[11px] uppercase tracking-widest text-primary/50 mb-2">
            Insight
          </p>
          <p className="text-[15px] font-medium text-primary/90 leading-relaxed text-justify">
            {insight}
          </p>
          {secondaryInsight && (
            <p className="text-[13px] text-primary/70 font-light leading-relaxed text-justify">
              {secondaryInsight}
            </p>
          )}
          {deepInsight && (
            <p className="text-[12px] text-muted-foreground/70 font-light leading-relaxed text-justify">
              {deepInsight}
            </p>
          )}
          {reflectionQuestion && (
            <p className="pt-2 text-[12px] text-muted-foreground/80 font-light leading-relaxed text-justify">
              {reflectionQuestion}
            </p>
          )}
        </div>
      )}
      {decisions.length === 0 && (
        <div className="mt-2 px-4 py-4 rounded-2xl bg-secondary/30 border border-border/50 space-y-3">
          <p className="text-sm text-foreground/80 font-light leading-relaxed">
            Start with one decision you’re unsure about.
          </p>
          <Link href="/framework">
            <button className="px-4 py-2 rounded-full bg-primary/10 text-primary text-xs active:scale-[0.97] transition-all">
              Log first decision
            </button>
          </Link>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search decisions..."
          className="w-full pl-9 pr-3 py-2 rounded-full bg-secondary/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>

      {/* Tabs 1x3 */}
      <div className="relative flex justify-between gap-1 bg-secondary/20 rounded-full p-1">
        <div
          className="absolute top-1 bottom-1 left-0 w-1/3 rounded-full bg-primary/20 transition-all duration-300 ease-out"
          style={{
            transform: `translateX(${
              statusFilter === 'all'
                ? '0%'
                : statusFilter === 'pending'
                ? '100%'
                : '200%'
            })`
          }}
        />
        {["all", "pending", "recorded"].map((key) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key as any)}
            className={`relative z-10 flex-1 text-center py-2 text-[11px] rounded-full transition-all duration-300 ease-out active:scale-[0.95] ${
              statusFilter === key
                ? "text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {key === "all"
              ? "All"
              : key === "pending"
              ? "Pending"
              : "Done"}
          </button>
        ))}
      </div>

      {reviewReadyCount > 0 && (
        <div
          onClick={() => setStatusFilter("review")}
          className="mt-2 px-4 py-3 rounded-2xl bg-secondary/30 border border-border/50 cursor-pointer active:scale-[0.98] transition-all"
        >
          <p className="text-xs text-muted-foreground leading-relaxed">
            {reviewReadyCount} decision{reviewReadyCount > 1 ? 's are' : ' is'} ready for review
          </p>
        </div>
      )}


      {/* Empty */}
      {filteredDecisions.length === 0 && decisions.length === 0 && (
        <div className="text-center py-16 px-6">
          <p className="text-sm text-muted-foreground/80 mb-3 leading-relaxed">
            This is where your decisions start to reveal patterns.
          </p>
        </div>
      )}

      {/* List */}
      <div className="space-y-6">
        {statusFilter === "all" ? (
          <>
            {/* Takeaway line */}
            {hasEnoughData && (() => {
              const occurred = decisionsWithOutcome.filter(
                (d: any) => d.worstOutcomeOccurred === true
              ).length;

              const rate = occurred / total;

              let signature = "";

              // --- Early stage (3–6 decisions) ---
              if (total < 7) {
                if (rate <= 0.25) {
                  signature = `Early pattern: your fears rarely play out (${occurred}/${total}).`;
                } else if (rate <= 0.5) {
                  signature = `Early pattern: your fears are mixed (${occurred}/${total}).`;
                } else {
                  signature = `Early pattern: what you fear often happens (${occurred}/${total}).`;
                }
              }

              // --- Mid stage (7–14 decisions) ---
              else if (total < 15) {
                if (rate <= 0.25) {
                  signature = `Your fears are consistently overstated (${occurred}/${total}).`;
                } else if (rate <= 0.5) {
                  signature = `Your fears are only partly reliable (${occurred}/${total}).`;
                } else {
                  signature = `Your fears are frequently accurate (${occurred}/${total}).`;
                }
              }

              // --- Mature stage (15+ decisions) ---
              else {
                if (rate <= 0.25) {
                  signature = `You systematically expect worse outcomes than reality delivers (${occurred}/${total}).`;
                } else if (rate <= 0.5) {
                  signature = `Your sense of risk is inconsistent — not fully aligned with outcomes (${occurred}/${total}).`;
                } else {
                  signature = `Your expectations tend to match reality — you may be anticipating correctly (${occurred}/${total}).`;
                }
              }

              return (
                <p className="text-sm text-primary/90 font-medium mb-2">
                  {signature}
                </p>
              );
            })()}
            {/* Didn’t happen */}
            {filteredDecisions.filter(d => d.worstOutcomeOccurred === false).length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground/50 mb-2">
                  Didn’t happen ({filteredDecisions.filter(d => d.worstOutcomeOccurred === false).length})
                </p>
                <div className="space-y-4">
                  {filteredDecisions
                    .filter(d => d.worstOutcomeOccurred === false)
                    .map((d) => (
                      <Link key={d.id} href={`/decision/${d.id}`}>
                        <div className={`p-4 border rounded-2xl transition-all active:scale-[0.98] ${
                          d.outcomeStatus === "pending" && d.reviewDate && d.reviewDate <= Date.now()
                            ? "bg-primary/5 border-primary/20 shadow-sm"
                            : "bg-background"
                        }`}>
                          <div className="flex justify-between">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                {d.outcomeStatus === "pending" && d.reviewDate && d.reviewDate <= Date.now() && (
                                  <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                                )}
                                <h2>{d.title}</h2>
                              </div>

                              {(d.worstCase || d.chosenAction) && (
                                <p className="mt-1 text-xs text-muted-foreground/70 font-light">
                                  {d.worstCase
                                    ? `Worried about ${d.worstCase}`
                                    : `Leaning toward ${d.chosenAction}`}
                                </p>
                              )}
                            </div>
                            {d.outcomeStatus === "recorded" ? (
                              <CheckCircle2 size={18} />
                            ) : (
                              <Circle size={18} />
                            )}
                          </div>

                          {d.outcomeStatus === "recorded" && (
                            <p className="mt-2 text-xs text-green-600 font-light">
                              Didn’t happen
                            </p>
                          )}
                          {d.outcomeStatus === "recorded" && (d.worstCase || d.chosenAction) && (
                            <p className="mt-1 text-[11px] text-muted-foreground/70 font-light leading-relaxed">
                              {d.worstCase
                                ? `Despite fearing "${d.worstCase}", outcome is ${d.worstOutcomeOccurred ? "it happened" : "it didn’t happen"}.`
                                : `Despite leaning toward "${d.chosenAction}", outcome is ${d.worstOutcomeOccurred ? "it happened" : "it didn’t happen"}.`}
                            </p>
                          )}

                          {d.outcomeStatus === "recorded" && (
                            <p className="mt-1 text-xs text-primary/80 flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-primary/70" />
                              Feared, didn’t happen
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            )}

            {/* Happened */}
            {filteredDecisions.filter(d => d.worstOutcomeOccurred === true).length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground/50 mb-2">
                  Happened ({filteredDecisions.filter(d => d.worstOutcomeOccurred === true).length})
                </p>
                <div className="space-y-4">
                  {filteredDecisions
                    .filter(d => d.worstOutcomeOccurred === true)
                    .map((d) => (
                      <Link key={d.id} href={`/decision/${d.id}`}>
                        <div className={`p-4 border rounded-2xl transition-all active:scale-[0.98] ${
                          d.outcomeStatus === "pending" && d.reviewDate && d.reviewDate <= Date.now()
                            ? "bg-primary/5 border-primary/20 shadow-sm"
                            : "bg-background"
                        }`}>
                          <div className="flex justify-between">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                {d.outcomeStatus === "pending" && d.reviewDate && d.reviewDate <= Date.now() && (
                                  <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                                )}
                                <h2>{d.title}</h2>
                              </div>

                              {(d.worstCase || d.chosenAction) && (
                                <p className="mt-1 text-xs text-muted-foreground/70 font-light">
                                  {d.worstCase
                                    ? `Worried about ${d.worstCase}`
                                    : `Leaning toward ${d.chosenAction}`}
                                </p>
                              )}
                            </div>
                            {d.outcomeStatus === "recorded" ? (
                              <CheckCircle2 size={18} />
                            ) : (
                              <Circle size={18} />
                            )}
                          </div>

                          {d.outcomeStatus === "recorded" && (
                            <p className="mt-2 text-xs text-amber-600 font-light">
                              Happened
                            </p>
                          )}
                          {d.outcomeStatus === "recorded" && (d.worstCase || d.chosenAction) && (
                            <p className="mt-1 text-[11px] text-muted-foreground/70 font-light leading-relaxed">
                              {d.worstCase
                                ? `Despite fearing "${d.worstCase}", outcome is ${d.worstOutcomeOccurred ? "it happened" : "it didn’t happen"}.`
                                : `Despite leaning toward "${d.chosenAction}", outcome is ${d.worstOutcomeOccurred ? "it happened" : "it didn’t happen"}.`}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            {filteredDecisions.map((d) => (
              <Link key={d.id} href={`/decision/${d.id}`}>
                <div
                  className={`p-4 border rounded-2xl transition-all active:scale-[0.98] ${
                    d.outcomeStatus === "pending" && d.reviewDate && d.reviewDate <= Date.now()
                      ? "bg-primary/5 border-primary/20 shadow-sm"
                      : "bg-background"
                  } ${
                    d.outcomeStatus === "recorded" &&
                    d.worstOutcomeOccurred === false &&
                    d.worstCase
                      ? "bg-emerald-50/40 border-emerald-200/40"
                      : ""
                  }`}
                >
                  <div className="flex justify-between">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        {d.outcomeStatus === "pending" && d.reviewDate && d.reviewDate <= Date.now() && (
                          <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                        )}
                        <h2>{d.title}</h2>
                      </div>

                      {/* Memory cue */}
                      {(d.worstCase || d.chosenAction) && (
                        <p className="mt-1 text-xs text-muted-foreground/70 font-light">
                          {d.worstCase
                            ? `Worried about ${d.worstCase}`
                            : `Leaning toward ${d.chosenAction}`}
                        </p>
                      )}
                    </div>
                    {d.outcomeStatus === "recorded" ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <Circle size={18} />
                    )}
                  </div>
                  {/* Outcome signal */}
                  {d.outcomeStatus === "recorded" && d.worstOutcomeOccurred !== undefined && (
                    <p
                      className={`mt-2 text-xs font-light ${
                        d.worstOutcomeOccurred
                          ? "text-amber-600"
                          : "text-green-600"
                      }`}
                    >
                      {d.worstOutcomeOccurred ? "Happened" : "Didn’t happen"}
                    </p>
                  )}
                  {d.outcomeStatus === "recorded" && (d.worstCase || d.chosenAction) && (
                    <p className="mt-1 text-[11px] text-muted-foreground/70 font-light leading-relaxed">
                      {d.worstCase
                        ? `Despite fearing "${d.worstCase}", outcome is ${d.worstOutcomeOccurred ? "it happened" : "it didn’t happen"}.`
                        : `Despite leaning toward "${d.chosenAction}", outcome is ${d.worstOutcomeOccurred ? "it happened" : "it didn’t happen"}.`}
                    </p>
                  )}
                  {/* Contradiction cue */}
                  {d.outcomeStatus === "recorded" &&
                    d.worstOutcomeOccurred === false && (
                      <p className="mt-1 text-xs text-primary/80 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-primary/70" />
                        Feared, didn’t happen
                      </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
