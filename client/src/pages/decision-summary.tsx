import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { ArrowLeft, CheckCircle2, Trash2, Calendar, ShieldAlert, TrendingUp } from "lucide-react";
import { db, Decision } from "@/lib/db";
import { updateLearningData } from "@/lib/learningStore";
import type { OutcomeData } from "@/components/outcomeModal.types";
import { useDecisionStats } from "@/hooks/useDecisionStats";
import { useInsightEngine } from "@/lib/insightEngine";
import { useToast } from "@/hooks/use-toast";
import TruthReveal from "@/components/truth-reveal";
import OutcomeModal from "@/components/OutcomeModal";
import { getOutcomePatternInsight } from "@/lib/insight/messaging";
import { DECISION_CATEGORIES } from '@/lib/chipReference';
import { OUTCOME_OPTIONS, REFLECTION_OPTIONS, ATTRIBUTION_OPTIONS } from '@/components/outcomeModal.config';

// =============================
// Types
// =============================
type DecisionSummaryOutcomeData = OutcomeData & {
  longTermOutcomeReflection?: string;
};


type OutcomePatternInsight = {
  mainLine: string;
  deepLine: string;
};

type OutcomeEditingState = {
  isEditingOutcome: boolean;
  setIsEditingOutcome: React.Dispatch<React.SetStateAction<boolean>>;
  isFocused: boolean;
  setIsFocused: React.Dispatch<React.SetStateAction<boolean>>;
};

type OutcomeHandlers = {
  outcomeData: DecisionSummaryOutcomeData;
  setOutcomeData: React.Dispatch<React.SetStateAction<DecisionSummaryOutcomeData>>;
  handleOutcomeChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>) => void;
  saveOutcome: () => void;
};


type DecisionInsightsInput = {
  decision: Decision;
  calibrationScore: number | null;
  recentStats: { occurred: number; total: number } | null;
  primaryConcernStats: { occurred: number; total: number } | null;
  fearProfile: Parameters<typeof getOutcomePatternInsight>[0]["fearProfile"];
};

type OutcomeSectionProps = {
  decision: Decision;
  primaryConcernStats: { occurred: number; total: number } | null;
  editing: OutcomeEditingState;
  outcome: OutcomeHandlers;
};

// =============================
// Utilities / Helpers
// =============================
function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    document.body.style.overflow = isLocked ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isLocked]);
}

function getRelativeTime(timestamp: number) {
  const diff = Date.now() - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week(s) ago`;
  if (days < 365) return `${Math.floor(days / 30)} month(s) ago`;
  return `${Math.floor(days / 365)} year(s) ago`;
}

function formatDecisionDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}


function LongTermReflectionBlock({
  decision,
  outcomeData,
  setOutcomeData,
  saveLongTermReflection
}: {
  decision: Decision;
  outcomeData: DecisionSummaryOutcomeData;
  setOutcomeData: React.Dispatch<React.SetStateAction<DecisionSummaryOutcomeData>>;
  saveLongTermReflection: () => void;
}) {
  return (
    <div className="mt-8 pt-8 border-t border-border">
      <h2 className="text-xl font-serif mb-6">Long-Term Reflection</h2>
      {decision.longTermOutcomeReflection ? (
        <div className="p-5 rounded-2xl bg-secondary/10 border border-border/40 shadow-sm">
          <p className="font-light leading-relaxed text-foreground/90">
            {decision.longTermOutcomeReflection}
          </p>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-card/40 border border-border/40 shadow-sm">
          <p className="text-sm text-muted-foreground mb-4">
            Looking back, how did this decision actually turn out in the longer term?
          </p>
          <textarea
            value={outcomeData.longTermOutcomeReflection || ""}
            onChange={(e) =>
              setOutcomeData((prev) => ({
                ...prev,
                longTermOutcomeReflection: e.target.value
              }))
            }
            placeholder="What is the ultimate result of this choice?"
            className="w-full p-4 rounded-xl bg-secondary/30 border border-border focus:border-primary/50 outline-none min-h-[100px] resize-none font-light mb-4"
          ></textarea>
          <button
            onClick={saveLongTermReflection}
            className="px-6 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs uppercase tracking-widest"
          >
            Save Long-Term Reflection
          </button>
        </div>
      )}
    </div>
  );
}

function ClarityInsightBlock({
  decision,
  patternInsight,
  outcomePatternInsight,
  archetypeInsight
}: {
  decision: Decision;
  patternInsight: string | null;
  outcomePatternInsight: OutcomePatternInsight;
  archetypeInsight?: {
    title: string;
    summary: string;
    coaching: string;
  };
}) {
  const preInsightParts = decision.preInsight?.split("||") || [];

  if (decision.outcomeStatus !== "recorded") {
    return (
      <div className="mt-6 px-5 py-5 sm:p-5 rounded-2xl bg-primary/10 border border-primary/30 text-center shadow-md mx-1">
        <p className="text-[10px] uppercase tracking-widest text-primary/80 mb-4 font-medium">
          Clarity
        </p>

        <p className="text-sm font-medium text-foreground/80 mb-4 leading-relaxed">
          {archetypeInsight?.summary || preInsightParts[0] || "Clarity Insight"}
        </p>

        {archetypeInsight && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-background/60 border border-primary/20">
            <p className="text-[10px] uppercase tracking-widest text-primary/70 mb-1">
              {archetypeInsight.title}
            </p>
            <p className="text-xs font-medium text-foreground/90">
              {archetypeInsight.coaching}
            </p>
          </div>
        )}

        {!archetypeInsight && patternInsight && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-background/60 border border-primary/20">
            <p className="text-[10px] uppercase tracking-widest text-primary/70 mb-1">
              Your Pattern
            </p>
            <p className="text-xs font-medium text-foreground/90">
              {patternInsight}
            </p>
          </div>
        )}

        {!archetypeInsight && (
          <p className="text-xs font-normal text-foreground/75 leading-relaxed">
            {preInsightParts[1] || ""}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 px-5 py-5 sm:p-5 rounded-2xl bg-primary/10 border border-primary/25 shadow-md mx-1">
      <p className="text-[10px] uppercase tracking-widest text-primary/80 mb-4 font-medium text-center">
        Outcome Insight
      </p>

      <div className="space-y-4">
        <div className="px-4 py-4 rounded-xl bg-background/70">
          <p className="text-[10px] uppercase tracking-widest text-primary/70 mb-1">
            Reflection
          </p>
          {/* Confidence Score */}
          {typeof decision.worstOutcomeProbabilityValue === "number" && (
            <div className="mb-2">
              <p className="text-[10px] uppercase tracking-widest text-primary/70">
                Confidence Signal
              </p>
              <div className="w-full h-1.5 bg-primary/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/60"
                  style={{
                    width: `${decision.worstOutcomeProbabilityValue}%`
                  }}
                />
              </div>
            </div>
          )}
          <p className="text-base font-medium text-foreground/90 leading-relaxed">
            {outcomePatternInsight.mainLine}
            {typeof decision.worstOutcomeProbabilityValue === "number" && (
              <>
                {" "}
                {decision.worstOutcomeOccurred
                  ? decision.worstOutcomeProbabilityValue < 50
                    ? "You underestimated this risk."
                    : "Your expectation aligned with the outcome."
                  : decision.worstOutcomeProbabilityValue > 50
                    ? "You overestimated this risk."
                    : "Your expectation aligned with the outcome."}
              </>
            )}
          </p>

          <p className="text-xs text-muted-foreground/70 leading-relaxed mt-2">
            {outcomePatternInsight.deepLine}
          </p>
        </div>

        <div className="px-4 py-3 rounded-xl bg-background/50">
          <p className="text-[10px] uppercase tracking-widest text-primary/70 mb-1">
            Prediction vs Reality
          </p>
          <div className="space-y-1 text-xs text-muted-foreground/80">
            <p>
              <span className="font-medium text-foreground/80">Predicted Concern:</span>{" "}
              {decision.worstOutcomeProbability || 0}%
            </p>
            <p>
              <span className="font-medium text-foreground/80">Actual Result:</span>{" "}
              {decision.worstOutcomeOccurred ? "Concern Materialized" : "Did Not Occur"}
            </p>
            {typeof decision.worstOutcomeProbabilityValue === "number" && (
              <p>
                <span className="font-medium text-foreground/80">Calibration:</span>{" "}
                {decision.worstOutcomeOccurred
                  ? `${100 - decision.worstOutcomeProbabilityValue}% underestimation`
                  : `${decision.worstOutcomeProbabilityValue}% overestimation`}
              </p>
            )}
            {/* Confidence vs Outcome Visualization */}
            {typeof decision.worstOutcomeProbabilityValue === "number" && (
              <div className="mt-2">
                <div className="w-full h-2 bg-primary/10 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-primary/60"
                    style={{
                      width: `${decision.worstOutcomeProbabilityValue}%`
                    }}
                  />
                  <div
                    className={`absolute top-0 h-full w-1 ${
                      decision.worstOutcomeOccurred ? "bg-red-400" : "bg-green-400"
                    }`}
                    style={{
                      left: decision.worstOutcomeOccurred ? "calc(100% - 2px)" : "2px"
                    }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  Your expectation vs actual outcome
                </p>
              </div>
            )}
          </div>
        </div>

        {(decision.outcomeResult || decision.surprises || decision.outcomeAttribution) && (
          <div className="px-4 py-3 rounded-xl bg-background/50">
            <p className="text-[10px] uppercase tracking-widest text-primary/70 mb-2">
              Reflection Notes
            </p>

            <div className="space-y-1 text-xs text-muted-foreground/80">
              {decision.outcomeResult && (
                <p>
                  <span className="font-medium text-foreground/80">Outcome:</span>{" "}
                  {decision.outcomeResult}
                </p>
              )}

              {decision.surprises && (
                <p>
                  <span className="font-medium text-foreground/80">Reflection:</span>{" "}
                  {decision.surprises}
                </p>
              )}

              {decision.outcomeAttribution && (
                <p>
                  <span className="font-medium text-foreground/80">Cause:</span>{" "}
                  {decision.outcomeAttribution}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InsightSummaryBlock({
  decision
}: {
  decision: Decision;
}) {
  if (!(decision.decisionDescription || decision.primaryConcern || decision.gutFeeling || decision.chosenAction)) {
    return null;
  }

  return (
    <section className="space-y-4 p-5 rounded-2xl bg-card/30 border border-primary/15">
      <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
        Insight Summary
      </h2>

      {decision.decisionDescription && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mb-0.5">
            Context
          </p>
          <p className="text-sm font-light text-foreground/80 leading-relaxed">
            {decision.decisionDescription}
          </p>
        </div>
      )}

      {decision.primaryConcern && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mb-0.5">
            Concern
          </p>
          <p className="text-sm font-light text-destructive/80 leading-relaxed">
            {decision.primaryConcern}
          </p>
          {decision.worryNote && (
            <p className="text-xs italic text-muted-foreground/70 leading-relaxed mt-1 pl-1">
              {decision.worryNote}
            </p>
          )}
        </div>
      )}

      {decision.gutFeeling && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mb-0.5">
            Motivation
          </p>
          <p className="text-sm italic text-foreground/70 leading-relaxed">
            {decision.gutFeeling}
          </p>
          {decision.pullNote && (
            <p className="text-xs italic text-muted-foreground/70 leading-relaxed mt-1 pl-1">
              {decision.pullNote}
            </p>
          )}
        </div>
      )}

      {decision.chosenAction && decision.chosenAction.trim() && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mb-0.5">
            Chosen Action
          </p>
          <p className="text-base font-serif text-foreground/90 leading-relaxed">
            {decision.chosenAction}
          </p>
          {decision.actionNote && (
            <p className="text-xs italic text-muted-foreground/70 leading-relaxed mt-1 pl-1">
              {decision.actionNote}
            </p>
          )}
        </div>
      )}
    </section>
  );
}


// =============================
// Derived Logic
// =============================
function buildDecisionInsights({
  decision,
  primaryConcernStats,
  fearProfile
}: DecisionInsightsInput) {
  void decision;
  const patternInsight = (() => {
    if (!primaryConcernStats || primaryConcernStats.total < 3) return null;

    const rate = primaryConcernStats.occurred / primaryConcernStats.total;

    if (rate <= 0.3) return "Risk tends to be overestimated here.";
    if (rate >= 0.7) return "Concerns here are often accurate.";
    return "Expectations here vary over time.";
  })();

  const outcomePatternInsight = getOutcomePatternInsight({
    occurred: primaryConcernStats?.occurred,
    total: primaryConcernStats?.total,
    fearProfile,
    decisionId: decision.id
  });

  return {
    patternInsight,
    outcomePatternInsight
  };
}

function OutcomeSectionBlock({
  decision,
  primaryConcernStats,
  editing,
  outcome
}: OutcomeSectionProps) {
  void decision;
  void primaryConcernStats;
  void editing;
  return (
    <div className="mt-7 border-t border-border pt-7">
      <div className="px-4 py-3 rounded-2xl border border-primary/15 bg-card/20 text-center">
        <h3 className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground/65 mb-2">
          The Outcome
        </h3>
        <p className="text-xs font-light text-muted-foreground/60 mb-4">
          When this plays out, come back and reflect.
        </p>
        {/* Centered sage pill Record Outcome button via OutcomeModal's trigger */}
        <div className="flex justify-center py-4">
          <OutcomeModal
            outcomeData={outcome.outcomeData}
            setOutcomeData={outcome.setOutcomeData}
            handleOutcomeChange={outcome.handleOutcomeChange}
            saveOutcome={outcome.saveOutcome}
            OUTCOME_OPTIONS={OUTCOME_OPTIONS}
            REFLECTION_OPTIONS={REFLECTION_OPTIONS}
            ATTRIBUTION_OPTIONS={ATTRIBUTION_OPTIONS}
            DECISION_CATEGORIES={DECISION_CATEGORIES}
          />
        </div>
      </div>
    </div>
  );
}

// =============================
// Main Page Component
// =============================
export default function DecisionSummary() {
  const [, params] = useRoute("/decision/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [decision, setDecision] = useState<Decision | null>(null);
  const [allDecisions, setAllDecisions] = useState<Decision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingOutcome, setIsEditingOutcome] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTruthReveal, setShowTruthReveal] = useState(false);

  
  const [outcomeData, setOutcomeData] = useState<DecisionSummaryOutcomeData>({
    outcomeResult: "",
    surprises: "",
    outcomeDetails: "",
    outcomeAttribution: "",
    worstOutcomeOccurred: false,
    longTermOutcomeReflection: ""
  });
  const [isFocused, setIsFocused] = useState(false);
  useBodyScrollLock(isEditingOutcome || isFocused);
  const { primaryConcernStats, fearProfile, recentStats } = useDecisionStats();
  const { calibrationScore } = useInsightEngine(allDecisions);
  useEffect(() => {
    const hydratePage = async () => {
      try {
        const [all, data] = await Promise.all([
          db.getAllDecisions(),
          params?.id ? db.getDecision(params.id) : Promise.resolve(null)
        ]);

        setAllDecisions(all);

        if (data) {
          const normalized = {
            ...data,
            primaryConcern: data.primaryConcern || ""
          };

          setDecision(normalized);
          setOutcomeData({
            outcomeResult: normalized.outcomeResult || "",
            surprises: normalized.surprises || "",
            outcomeDetails: normalized.outcomeDetails || "",
            outcomeAttribution: normalized.outcomeAttribution || "",
            worstOutcomeOccurred: normalized.worstOutcomeOccurred || false
          });
        }
      } catch (error) {
        console.error("Failed to hydrate decision page:", error);
      } finally {
        setIsLoading(false);
      }
    };

    hydratePage();
  }, [params?.id]);

  const handleOutcomeChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "worstOutcomeOccurred") {
      setOutcomeData(prev => ({ ...prev, worstOutcomeOccurred: value === "true" }));
    } else {
      setOutcomeData(prev => ({ ...prev, [name]: value }));
    }
  };

  const saveOutcome = async () => {
    if (!decision) return;
    
    try {
      const isWorseThanExpected =
        outcomeData.outcomeResult === "Worse Than Feared"
          ? true
          : outcomeData.outcomeResult === "Better Than Feared"
            ? false
            : outcomeData.outcomeResult === "About As Expected"
              ? false
              : false;

      console.log({
        predicted_probability: decision.worstOutcomeProbability,
        outcome: isWorseThanExpected
      });

      const updatedDecision: Decision = {
        ...decision,
        ...outcomeData,
        lessonsLearned: undefined,
        outcomeStatus: 'recorded',
        outcomeDate: Date.now(),
        primaryArchetype: decision.primaryArchetype,
        worstOutcomeOccurred: isWorseThanExpected
      };
      
      await db.saveDecision(updatedDecision);
      updateLearningData(updatedDecision);
      // Normalize primaryConcern before setting state
      const normalized = {
        ...updatedDecision,
        primaryConcern: updatedDecision.primaryConcern || ""
      };
      setDecision(normalized);
      
      setIsEditingOutcome(false);
      setShowTruthReveal(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save outcome.",
        variant: "destructive"
      });
    }
  };


  const deleteDecision = async () => {
    if (!decision) return;
    
    try {
      await db.deleteDecision(decision.id);
      toast({
        title: "Decision Deleted",
        description: "The record has been permanently removed.",
      });
      setLocation('/journal');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete.",
        variant: "destructive"
      });
    }
  };

  const saveLongTermReflection = async () => {
    if (!decision || !outcomeData.longTermOutcomeReflection) return;

    const updatedDecision = {
      ...decision,
      longTermOutcomeReflection: outcomeData.longTermOutcomeReflection
    };

    await db.saveDecision(updatedDecision);
    setDecision(updatedDecision);
    toast({ title: "Long-Term Reflection Saved" });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center opacity-50 min-h-[60vh]">
        <div className="w-8 h-8 border-t border-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!decision) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-serif mb-4">Record not found</h2>
        <Link href="/journal" className="text-primary hover:underline">
  Return to Journal
</Link>
      </div>
    );
  }

  const dateStr = formatDecisionDate(decision.date);

  const {
    patternInsight,
    outcomePatternInsight
  } = buildDecisionInsights({
    decision,
    calibrationScore,
    recentStats,
    primaryConcernStats,
    fearProfile
  });

  const archetypeInsight = decision.preInsightArchetype || undefined;

  return (
    <div className="w-full max-w-4xl mx-auto px-0.5 sm:px-4 py-10 space-y-6 animate-fade-in-slow pb-24">
      <Link
  href="/journal"
  className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors w-fit"
>
  <ArrowLeft size={16} /> Back to Journal
</Link>

      <header className="pb-4">
        <div className="space-y-4 p-0.5 sm:p-4 rounded-2xl bg-card/40 border border-border/40 shadow-sm w-full">
          <div className="space-y-2 mb-4">
            <div className="mt-4 ml-4 text-xs text-muted-foreground/70 flex items-center gap-2">
              <Calendar size={12} /> 
              <span>{dateStr}</span>
              <span className="text-muted-foreground/40">•</span>
              <span>{getRelativeTime(decision.date)}</span>
            </div>
          </div>
          <h1 className="ml-4 text-2xl md:text-4xl font-serif leading-tight break-words">
            {decision.title || decision.decisionDescription}
          </h1>
          <ClarityInsightBlock
            decision={decision}
            patternInsight={patternInsight}
            outcomePatternInsight={outcomePatternInsight}
            archetypeInsight={archetypeInsight}
          />
          <div className="flex flex-col gap-4 mt-4 pt-2 border-t border-border/40">
            <div className="flex items-center gap-2 text-sm tracking-widest uppercase">
              {decision.outcomeStatus === 'recorded' && (
                <span className="flex items-center gap-2 text-primary/80 bg-primary/5 px-2.5 py-1 rounded-full text-[10px]">
                  <CheckCircle2 size={16} /> Outcome Recorded
                </span>
              )}
            </div>
          </div>
        </div>
      </header>


      {/* Details Grid */}
      <div className="space-y-6 divide-y divide-border/30">
        {decision.options && (
          <section className="space-y-3 p-3 pt-5 rounded-xl bg-card/30 border border-border/30">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Considered Options</h2>
            <p className="font-light text-sm leading-relaxed whitespace-pre-wrap">{decision.options}</p>
          </section>
        )}

        {decision.outcomeStatus !== 'recorded' && (
          <InsightSummaryBlock decision={decision} />
        )}


        {decision.hopes && (
          <section className="space-y-3 p-3 pt-5 rounded-xl bg-card/30 border border-border/30">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2 text-primary/70">
              <TrendingUp size={14} /> {decision.options === "Used 10-10-10 Framework" ? "Long-term View" : "Hopes & Expectations"}
            </h2>
            <p className="font-light text-sm leading-relaxed whitespace-pre-wrap">{decision.hopes}</p>
          </section>
        )}

        {decision.recoveryPlan && (
          <section className="space-y-3 p-3 pt-5 rounded-xl bg-card/30 border border-border/30">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <ShieldAlert size={14} /> Recovery Plan
            </h2>
            <p className="font-light text-sm leading-relaxed whitespace-pre-wrap">{decision.recoveryPlan}</p>
          </section>
        )}
      </div>

      {/* Long-Term Reflection */}
      {decision.outcomeStatus === 'recorded' &&
        decision.outcomeDate &&
        Date.now() - decision.outcomeDate > 30 * 24 * 60 * 60 * 1000 && (
          <LongTermReflectionBlock
            decision={decision}
            outcomeData={outcomeData}
            setOutcomeData={setOutcomeData}
            saveLongTermReflection={saveLongTermReflection}
          />
      )}

      {/* Outcome Section */}
      {decision.outcomeStatus !== 'recorded' && (
        <OutcomeSectionBlock
          decision={decision}
          primaryConcernStats={primaryConcernStats}
          editing={{
            isEditingOutcome,
            setIsEditingOutcome,
            isFocused,
            setIsFocused
          }}
          outcome={{
            outcomeData,
            setOutcomeData,
            handleOutcomeChange,
            saveOutcome
          }}
        />
      )}

      {/* Footer Actions */}
      <div className="mt-12 flex justify-end">
        {!showDeleteConfirm ? (
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="text-xs uppercase tracking-widest text-muted-foreground/50 hover:text-destructive transition-colors flex items-center gap-2"
          >
            <Trash2 size={14} /> Delete Record
          </button>
        ) : (
          <div className="flex items-center gap-4 bg-destructive/10 px-4 py-2 rounded-lg border border-destructive/20 shadow-sm animate-fade-in-slow">
            <span className="text-xs text-destructive uppercase tracking-widest">Are you sure?</span>
            <button onClick={deleteDecision} className="text-xs font-bold text-destructive hover:underline">Yes, delete</button>
            <button onClick={() => setShowDeleteConfirm(false)} className="text-xs text-foreground hover:underline">Cancel</button>
          </div>
        )}
      </div>

      {showTruthReveal && (
        <TruthReveal
          occurred={decision.worstOutcomeOccurred || false}
          profile={fearProfile}
          onContinue={() => setShowTruthReveal(false)}
        />
      )}
    </div>
  );
}
