import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { ArrowLeft, CheckCircle2, Circle, Edit3, Save, Trash2, Calendar, ShieldAlert, Zap, TrendingUp, AlertTriangle } from "lucide-react";
import { db, Decision } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import TruthReveal from "@/components/truth-reveal";
import { getUserProfile } from "@/lib/stats";

export default function DecisionSummary() {
  const [, params] = useRoute("/decision/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [decision, setDecision] = useState<Decision | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingOutcome, setIsEditingOutcome] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTruthReveal, setShowTruthReveal] = useState(false);
  // Disable background scroll when outcome modal is open
  useEffect(() => {
    if (isEditingOutcome) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isEditingOutcome]);
  
  const [outcomeData, setOutcomeData] = useState({
    outcomeResult: "",
    surprises: "",
    lessonsLearned: "",
    worstOutcomeOccurred: false
  });
  const [historySurprises, setHistorySurprises] = useState<string[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const past = await db.getAllDecisions();
        const surprises = past
          .map(d => d.surprises)
          .filter((v): v is string => Boolean(v));

        // simple frequency sort
        const freq: Record<string, number> = {};
        surprises.forEach(s => {
          const key = s.split(" — ")[0]; // normalize
          freq[key] = (freq[key] || 0) + 1;
        });

        const top = Object.entries(freq)
          .sort((a,b) => b[1] - a[1])
          .map(([k]) => k)
          .slice(0, 2);

        setHistorySurprises(top);
      } catch {}
    })();
  }, []);
  const [isFocused, setIsFocused] = useState(false);
  const [fearStats, setFearStats] = useState<{ total: number; occurred: number } | null>(null);
  const [fearProfile, setFearProfile] = useState<string | null>(null);
  const [showDeepInsight, setShowDeepInsight] = useState(false);
  useEffect(() => {
    const loadStats = async () => {
      try {
        const all = await db.getAllDecisions();
        const withOutcomes = all.filter(d => d.worstOutcomeOccurred !== undefined);

        // Simple keyword-based fear profiling
        const counts: Record<string, number> = {
          judgment: 0,
          money: 0,
          control: 0,
          regret: 0
        };

        withOutcomes.forEach(d => {
          const text = (d.fears || d.worstCase || "").toLowerCase();

          if (text.includes("judge") || text.includes("people")) counts.judgment++;
          if (text.includes("money") || text.includes("loss")) counts.money++;
          if (text.includes("control")) counts.control++;
          if (text.includes("regret")) counts.regret++;
        });

        // find dominant
        let dominant: string | null = null;
        let max = 0;

        Object.entries(counts).forEach(([key, val]) => {
          if (val > max) {
            max = val;
            dominant = key;
          }
        });

        if (dominant && max > 1) {
          setFearProfile(dominant);
        }

        const total = withOutcomes.length;
        const occurred = withOutcomes.filter(d => d.worstOutcomeOccurred).length;

        if (total > 0) {
          setFearStats({ total, occurred });
        }
      } catch (e) {
        console.error("Failed to load stats");
      }
    };

    loadStats();
  }, []);

  useEffect(() => {
    const loadDecision = async () => {
      if (!params?.id) return;
      
      try {
        const data = await db.getDecision(params.id);
        if (data) {
          setDecision(data);
          setOutcomeData({
            outcomeResult: data.outcomeResult || "",
            surprises: data.surprises || "",
            lessonsLearned: data.lessonsLearned || "",
            worstOutcomeOccurred: data.worstOutcomeOccurred || false
          });
        }
      } catch (error) {
        console.error("Failed to load decision:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDecision();
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
      const isWorseThanExpected = outcomeData.worstOutcomeOccurred;

      console.log({
        predicted_probability: decision.worstOutcomeProbability,
        outcome: isWorseThanExpected
      });

      const updatedDecision: Decision = {
        ...decision,
        ...outcomeData,
        outcomeStatus: 'recorded',
        outcomeDate: Date.now(),
        worstOutcomeOccurred: isWorseThanExpected
      };
      
      await db.saveDecision(updatedDecision);
      setDecision(updatedDecision);
      
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

  const handleTruthRevealContinue = () => {
    setShowTruthReveal(false);
    setLocation('/');
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
        <Link href="/journal">
          <a className="text-primary hover:underline">Return to Journal</a>
        </Link>
      </div>
    );
  }

  const dateStr = new Date(decision.date).toLocaleDateString(undefined, { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  const getRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} week(s) ago`;
    if (days < 365) return `${Math.floor(days / 30)} month(s) ago`;
    return `${Math.floor(days / 365)} year(s) ago`;
  };

  const getReflectionChips = (base: string[], history: string[]) => {
    const result: string[] = [];

    // keep 3 stable
    result.push(...base.slice(0, 3));

    // add 1 from history if unique
    const extra = history.find(h => !result.includes(h));
    if (extra) result.push(extra);

    // fill if needed
    for (const item of base) {
      if (result.length >= 4) break;
      if (!result.includes(item)) result.push(item);
    }

    return result.slice(0, 4);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6 animate-fade-in-slow pb-24">
      <Link href="/journal">
        <a className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft size={16} /> Back to Journal
        </a>
      </Link>

      <header className="pb-4">
        <div className="space-y-4 p-4 rounded-2xl bg-card/40 border border-border/40 shadow-sm">
          <div className="space-y-2 mb-4">
            <div className="mt-4 text-xs text-muted-foreground/70 flex items-center gap-2">
              <Calendar size={12} /> 
              <span>{dateStr}</span>
              <span className="text-muted-foreground/40">•</span>
              <span>{getRelativeTime(decision.date)}</span>
            </div>
          </div>
          <h1 className="text-2xl md:text-4xl font-serif leading-tight break-words">
            {decision.title || decision.decisionDescription}
          </h1>
          {decision.decisionDescription && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
                You were thinking
              </p>
              <p className="text-base font-light text-foreground/70 leading-relaxed border-l-2 border-primary/20 pl-3">
                {decision.decisionDescription}
              </p>
            </div>
          )}
          <div className="flex flex-col gap-4 mt-4 pt-2 border-t border-border/40">
            <div className="flex items-center gap-2 text-sm tracking-widest uppercase">
              {decision.outcomeStatus === 'recorded' ? (
                <span className="flex items-center gap-2 text-primary/80 bg-primary/5 px-2.5 py-1 rounded-full text-[10px]">
                  <CheckCircle2 size={16} /> Outcome Recorded
                </span>
              ) : (
                <span className="flex items-center gap-2 text-muted-foreground bg-secondary/40 px-2.5 py-1 rounded-full text-[10px]">
                  <Circle size={16} /> Outcome Pending
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

        {(decision.fears || decision.worstCase) && (
          <section className="space-y-3 p-3 pt-5 rounded-xl bg-card/30 border border-border/30">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2 text-destructive/70">
              <AlertTriangle size={14} /> Fears & Concerns
            </h2>
            <p className="font-light text-sm leading-relaxed whitespace-pre-wrap mb-4">
              {decision.fears || decision.worstCase}
            </p>
            {decision.worstOutcome && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">Worst Case Scenario</span>
                <p className="font-light text-sm leading-relaxed text-destructive/80">{decision.worstOutcome}</p>
              </div>
            )}
          </section>
        )}

        {decision.gutFeeling && (
          <section className="space-y-3 p-3 pt-5 rounded-xl bg-card/30 border border-border/30">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Gut Feeling</h2>
            <p className="font-light text-sm leading-relaxed whitespace-pre-wrap italic">{decision.gutFeeling}</p>
          </section>
        )}
        {/* The Choice Section (Leaning) - moved after Gut Feeling */}
        {decision.chosenAction && decision.chosenAction.trim() && (
          <section className="space-y-3 relative overflow-hidden pl-4 bg-primary/5 rounded-xl p-3 pt-5">
            <div className="absolute top-1 left-0 w-[2px] h-8 bg-primary/40 rounded-full"></div>
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <Zap size={14} /> Leaning
            </h2>
            <p className="text-lg md:text-xl font-serif leading-relaxed text-foreground/90">
              {decision.chosenAction}
            </p>
          </section>
        )}

        {!decision.fears && decision.worstOutcome && (
          <section className="space-y-3 p-3 pt-5 rounded-xl bg-card/30 border border-border/30">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2 text-destructive/70">
              <AlertTriangle size={14} /> Worst Case Scenario
            </h2>
            <p className="font-light text-sm leading-relaxed text-destructive/80">{decision.worstOutcome}</p>
          </section>
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
      {decision.outcomeStatus === 'recorded' && decision.outcomeDate && (Date.now() - decision.outcomeDate) > 30 * 24 * 60 * 60 * 1000 && (
        <div className="mt-8 pt-8 border-t border-border">
          <h2 className="text-xl font-serif mb-6">Long-Term Reflection</h2>
          {decision.longTermOutcomeReflection ? (
            <div className="p-5 rounded-2xl bg-secondary/10 border border-border/40 shadow-sm">
              <p className="font-light leading-relaxed text-foreground/90">{decision.longTermOutcomeReflection}</p>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-card/40 border border-border/40 shadow-sm">
              <p className="text-sm text-muted-foreground mb-4">Looking back, how did this decision actually turn out in the longer term?</p>
              <textarea
                value={(outcomeData as any).longTermOutcomeReflection || ""}
                onChange={(e) => setOutcomeData(prev => ({ ...prev, longTermOutcomeReflection: e.target.value }))}
                placeholder="What is the ultimate result of this choice?"
                className="w-full p-4 rounded-xl bg-secondary/30 border border-border focus:border-primary/50 outline-none min-h-[100px] resize-none font-light mb-4"
              ></textarea>
              <button 
                onClick={async () => {
                  if (!decision || !(outcomeData as any).longTermOutcomeReflection) return;
                  const updatedDecision = {
                    ...decision,
                    longTermOutcomeReflection: (outcomeData as any).longTermOutcomeReflection
                  };
                  await db.saveDecision(updatedDecision);
                  setDecision(updatedDecision);
                  toast({ title: "Long-Term Reflection Saved" });
                }}
                className="px-6 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs uppercase tracking-widest"
              >
                Save Long-Term Reflection
              </button>
            </div>
          )}
        </div>
      )}

      {/* Outcome Section */}
      <div className="mt-8 border-t border-border pt-8">
        <h2 className="text-xl font-serif mt-10 mb-4 text-center text-foreground/60">The Outcome</h2>
        
        {decision.outcomeStatus === 'pending' && !isEditingOutcome ? (
          <div className="text-center py-6">
            {/* Predictive Insight */}
            {fearStats && decision.worstCase && (
              <div className="mb-5">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-2">
                  Based on your past decisions
                </p>
                <p className="text-sm font-medium text-foreground/90">
                  {(() => {
                    const rate = fearStats.occurred / fearStats.total;

                    if (rate <= 0.25) {
                      return "This will likely turn out better than you expect.";
                    }

                    if (rate <= 0.5) {
                      return "This may not unfold as badly as it feels right now.";
                    }

                    if (rate <= 0.75) {
                      return "There’s a fair chance your concern may play out.";
                    }

                    return "Your concern often proves right — pay attention here.";
                  })()}
                </p>

                <p className="text-xs text-muted-foreground/70 mt-1 font-light">
                  {decision.worstCase
                    ? `You’re expecting: "${decision.worstCase}"`
                    : ""}
                </p>
              </div>
            )}
            <p className="text-sm text-muted-foreground/80 font-light mb-4">
              When this plays out, come back and reflect.
            </p>
            <button 
              onClick={() => setIsEditingOutcome(true)}
              className="px-5 py-2 rounded-full bg-primary/90 text-primary-foreground tracking-widest uppercase text-xs hover:bg-primary transition-colors"
              data-testid="button-record-outcome"
            >
              Record Outcome
            </button>
          </div>
        ) : isEditingOutcome ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-background rounded-2xl border border-border shadow-xl p-6 space-y-8 animate-fade-in-slow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-serif">Record Outcome</h3>
                <button
                  onClick={() => setIsEditingOutcome(false)}
                  className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-sm uppercase tracking-widest text-foreground/70">What actually happened?</label>
                <textarea 
                  name="outcomeResult"
                  value={outcomeData.outcomeResult}
                  onChange={handleOutcomeChange}
                  placeholder="What happened (optional)… just a few words if you want"
                  className="w-full p-3 rounded-xl bg-secondary/20 border border-border/50 focus:border-primary/40 outline-none min-h-[120px] resize-none font-light"
                ></textarea>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm uppercase tracking-widest text-foreground/70">Did your worst fear happen?</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: "It didn’t happen", value: false },
                    { label: "It happened", value: true }
                  ].map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() =>
                        setOutcomeData((prev) => ({
                          ...prev,
                          worstOutcomeOccurred: option.value === true
                        }))
                      }
                      className={`px-3 py-1.5 rounded-full text-xs border ${
                        outcomeData.worstOutcomeOccurred === option.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary/30 border-border"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm uppercase tracking-widest text-foreground/70">Anything worth noting?</label>

                {/* Quick chips */}
                <div className="flex flex-wrap gap-2">
                  {getReflectionChips(
                    [
                      "Unexpected benefit",
                      "Unexpected problem",
                      "Nothing surprising",
                      "Learned something",
                      "Went as expected"
                    ],
                    historySurprises
                  ).map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() =>
                        setOutcomeData((prev) => ({
                          ...prev,
                          surprises: chip + " — "
                        }))
                      }
                      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                        outcomeData.surprises.startsWith(chip)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary/30 border-border hover:bg-secondary/50"
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                <textarea 
                  name="surprises"
                  value={outcomeData.surprises}
                  onChange={handleOutcomeChange}
                  placeholder="Something unexpected… or something you learned"
                  className="w-full p-3 rounded-xl bg-secondary/20 border border-border/50 focus:border-primary/40 outline-none min-h-[100px] resize-none font-light"
                ></textarea>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={saveOutcome}
                  className="flex-1 py-2.5 rounded-full bg-primary/90 text-primary-foreground tracking-widest uppercase text-xs hover:bg-primary transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={16} /> Save Reflection
                </button>
                <button 
                  onClick={() => setIsEditingOutcome(false)}
                  className="px-5 py-2.5 rounded-full border border-border/60 text-foreground tracking-widest uppercase text-xs hover:bg-secondary/40 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsFocused(true);
              }}
              className={`space-y-6 relative p-4 rounded-2xl border transition-all ${
                isFocused
                  ? "bg-card shadow-xl scale-[1.02] z-50"
                  : "bg-card/20 border-border/30"
              }`}
            >
              <button 
                onClick={() => setIsEditingOutcome(true)}
                className="absolute top-6 right-6 text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 text-xs uppercase tracking-widest"
              >
                <Edit3 size={14} /> Edit
              </button>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">The Result</h3>
                  <p className="font-light leading-relaxed text-foreground">{decision.outcomeResult || "Not specified."}</p>
                </div>
                
                {decision.surprises && (
                  <div>
                    <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Surprises</h3>
                    <p className="font-light leading-relaxed text-foreground italic">"{decision.surprises}"</p>
                  </div>
                )}
                
                {decision.lessonsLearned && (
                  <div>
                    <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Lessons Learned</h3>
                    <p className="font-light leading-relaxed text-foreground">{decision.lessonsLearned}</p>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground/50 pt-4 border-t border-border/50">
                  Recorded on {decision.outcomeDate ? new Date(decision.outcomeDate).toLocaleDateString() : 'Unknown date'}
                </div>
                {/* Decision Resolution Moment */}
                {decision.worstOutcomeOccurred !== undefined && (
                  <div className="mt-8 pt-6 border-t border-border/40 text-center space-y-4">
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground/60">
                      Expected vs Reality
                    </p>

                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-left">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                          You Expected
                        </p>
                        <p className="text-sm font-light text-foreground/90 leading-relaxed">
                          {decision.worstCase || "—"}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-left">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                          What Happened
                        </p>
                        <p className="text-sm font-light leading-relaxed">
                          {decision.worstOutcomeOccurred ? (
                            <span className="text-amber-600">It happened</span>
                          ) : (
                            <span className="text-primary/80">It didn’t happen</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground/70 italic mt-2">
                      Notice the gap.
                    </p>
                  </div>
                )}
                {/* Combined Insight */}
                {fearStats && fearStats.total >= 3 && (
                  <div className="mt-4 pt-4 border-t border-border/30 text-center space-y-3">
                    {(() => {
                      const rate = fearStats.occurred / fearStats.total;

                      let tonePrefix = "";
                      if (rate <= 0.25) tonePrefix = "Gently note:";
                      else if (rate <= 0.5) tonePrefix = "Worth noticing:";
                      else if (rate <= 0.75) tonePrefix = "Be mindful:";
                      else tonePrefix = "Pay attention:";

                      let frequency = "";
                      if (rate <= 0.25) frequency = "rarely come true";
                      else if (rate <= 0.5) frequency = "don’t come true that often";
                      else if (rate <= 0.75) frequency = "come true fairly often";
                      else frequency = "come true more often than not";

                      let focus = "";
                      if (fearProfile === "judgment") focus = "what others think";
                      if (fearProfile === "money") focus = "money and outcomes";
                      if (fearProfile === "control") focus = "losing control";
                      if (fearProfile === "regret") focus = "making the wrong choice";

                      const mainLine = focus
                        ? `You keep coming back to ${focus}.`
                        : `This pattern keeps repeating.`;

                      const deeperLines = [
                        focus
                          ? `You keep worrying about ${focus} — but it doesn’t play out that way.`
                          : `This keeps showing up — but reality doesn’t match it.`,
                        focus
                          ? `Something about ${focus} pulls your attention… is it justified?`
                          : `You’ve seen this pattern before — is it real?`,
                        focus
                          ? `You expect the worst around ${focus} — but how often is that true?`
                          : `You expect this — but how often does it actually happen?`,
                      ];

                      // Occasional blunt lines (low probability)
                      const bluntLines = [
                        focus
                          ? `You keep expecting the worst about ${focus} — and you’re often wrong.`
                          : `You keep expecting this — and you’re often wrong.`,
                        focus
                          ? `Your fear around ${focus} doesn’t match reality.`
                          : `This fear doesn’t match reality.`,
                        `You’re harder on this than the situation actually is.`
                      ];

                      // ~25% chance to show blunt line
                      const useBlunt = Math.random() < 0.25;

                      const deep = useBlunt
                        ? bluntLines[Math.floor(Math.random() * bluntLines.length)]
                        : deeperLines[Math.floor(Math.random() * deeperLines.length)];

                      return (
                        <>
                          <p className="text-sm font-medium text-foreground/90">
                            {mainLine}
                          </p>

                          {!showDeepInsight && (
                            <button
                              onClick={() => setShowDeepInsight(true)}
                              className="text-[11px] text-primary/70 underline"
                            >
                              See deeper insight
                            </button>
                          )}

                          {showDeepInsight && (
                            <p className="text-xs font-light text-muted-foreground/80 leading-relaxed">
                              {deep}
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Decision Weight Insight */}
                {typeof decision.importance === "number" && (
                  <div className="mt-3 text-center">
                    <p className="text-xs text-muted-foreground/80 font-light">
                      {decision.importance >= 7
                        ? "This was a high-stakes decision — notice how it actually turned out."
                        : "This was a lower-stakes decision — compare your reaction vs reality."}
                    </p>
                  </div>
                )}

                {/* Confidence vs Outcome Insight */}
                {typeof decision.worstOutcomeProbability === "number" && decision.worstOutcomeOccurred !== undefined && (
                  <div className="mt-3 text-center">
                    <p className="text-xs text-muted-foreground/80 font-light">
                      {(() => {
                        const confidence = decision.worstOutcomeProbability;

                        if (confidence >= 70 && decision.worstOutcomeOccurred === false) {
                          return "You were quite certain this would go wrong — but it didn’t.";
                        }

                        if (confidence <= 30 && decision.worstOutcomeOccurred === true) {
                          return "You didn’t expect this to go wrong — but it did.";
                        }

                        if (confidence >= 70 && decision.worstOutcomeOccurred === true) {
                          return "You expected this — and it happened.";
                        }

                        if (confidence <= 30 && decision.worstOutcomeOccurred === false) {
                          return "You weren’t too worried — and things turned out fine.";
                        }

                        return "Your expectation and reality were not fully aligned.";
                      })()}
                    </p>
                  </div>
                )}

                {/* Pattern Break Insight */}
                {fearStats && decision.worstOutcomeOccurred !== undefined && (() => {
                  const rate = fearStats.occurred / fearStats.total;

                  let message: string | null = null;

                  if (rate <= 0.3 && decision.worstOutcomeOccurred === true) {
                    message = "This stands out — usually your fears don’t happen, but this time it did.";
                  }

                  if (rate >= 0.7 && decision.worstOutcomeOccurred === false) {
                    message = "This breaks your pattern — you usually expect correctly, but not this time.";
                  }

                  if (!message) return null;

                  return (
                    <div className="mt-3 text-center">
                      <p className="text-xs text-muted-foreground/80 font-light">
                        {message}
                      </p>
                    </div>
                  );
                })()}

                {/* Repeated Pattern / Bias Loop Insight */}
                {fearStats && fearStats.total >= 4 && (() => {
                  const rate = fearStats.occurred / fearStats.total;

                  let message: string | null = null;

                  // Loop: fears rarely happen but keep repeating
                  if (rate <= 0.3) {
                    message = "You keep expecting this — even though it rarely happens.";
                  }

                  // Loop: fears often happen but still repeated
                  else if (rate >= 0.7) {
                    message = "This keeps happening — but the same pattern repeats.";
                  }

                  // Mixed loop
                  else {
                    message = "This pattern keeps coming back — it may be worth questioning it.";
                  }

                  return (
                    <div className="mt-3 text-center">
                      <p className="text-xs text-muted-foreground/80 font-light">
                        {message}
                      </p>
                    </div>
                  );
                })()}

                {/* Decision Speed vs Outcome Insight */}
                {decision.outcomeDate && decision.date && decision.worstOutcomeOccurred !== undefined && (() => {
                  const timeDiff = decision.outcomeDate - decision.date;
                  const days = timeDiff / (1000 * 60 * 60 * 24);

                  let message: string | null = null;

                  // Fast resolution (same day or next day)
                  if (days <= 1) {
                    if (decision.worstOutcomeOccurred === false) {
                      message = "You moved quickly — and things turned out fine.";
                    } else {
                      message = "You moved quickly — and it didn’t go as expected.";
                    }
                  }

                  // Slower resolution
                  else {
                    if (decision.worstOutcomeOccurred === false) {
                      message = "Even with time to think, your fear didn’t play out.";
                    } else {
                      message = "Even with time, the outcome matched your concern.";
                    }
                  }

                  return (
                    <div className="mt-3 text-center">
                      <p className="text-xs text-muted-foreground/80 font-light">
                        {message}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>

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

      {isFocused && (
        <div
          onClick={() => setIsFocused(false)}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        />
      )}
      {showTruthReveal && (
        <TruthReveal 
          occurred={decision.worstOutcomeOccurred || false}
          profile={getUserProfile()}
          onContinue={handleTruthRevealContinue}
        />
      )}
    </div>
  );
}
