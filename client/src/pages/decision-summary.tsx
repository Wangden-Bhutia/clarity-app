import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { ArrowLeft, CheckCircle2, Circle, Edit3, Save, Trash2, Calendar, ShieldAlert, Zap, TrendingUp, AlertTriangle } from "lucide-react";
import { db, Decision } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import TruthReveal from "@/components/truth-reveal";
import { updateStats, getUserProfile, getInsight } from "@/lib/stats";

export default function DecisionSummary() {
  const [, params] = useRoute("/decision/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [decision, setDecision] = useState<Decision | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingOutcome, setIsEditingOutcome] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTruthReveal, setShowTruthReveal] = useState(false);
  
  const [outcomeData, setOutcomeData] = useState({
    outcomeResult: "",
    surprises: "",
    lessonsLearned: "",
    worstOutcomeOccurred: false
  });

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
      
      if (decision.worstOutcomeProbability !== undefined) {
        updateStats(decision.worstOutcomeProbability, isWorseThanExpected);
      }
      
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-10 animate-fade-in-slow pb-24">
      <Link href="/journal">
        <a className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft size={16} /> Back to Journal
        </a>
      </Link>

      <header className="pb-8">
        <div className="space-y-4 p-4 rounded-2xl bg-card/40 border border-border/40 shadow-sm">
          <div className="space-y-2 mb-4">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground bg-secondary/40 px-3 py-2 rounded-full text-center w-full">
                {decision.category || 'Uncategorized'}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground bg-secondary/40 px-3 py-2 rounded-full text-center w-full">
                Importance: {decision.importanceLevel || 'Not specified'}
              </span>
            </div>
            <div className="mt-4 text-xs text-muted-foreground/70 flex items-center gap-1">
              <Calendar size={12} /> {dateStr}
            </div>
          </div>
          <h1 className="text-2xl md:text-4xl font-serif leading-tight break-words">{decision.title}</h1>
          {decision.decisionDescription && (
            <p className="text-base font-light text-foreground/70 leading-relaxed border-l-2 border-primary/20 pl-3">{decision.decisionDescription}</p>
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
            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Confidence</div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[...Array(10)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-2 h-3 rounded-sm ${i < decision.confidenceRating ? 'bg-primary/50' : 'bg-secondary/60'}`}
                    ></div>
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground/70 ml-1">{decision.confidenceRating}/10</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* The Choice Section */}
      <section className="space-y-3 relative overflow-hidden pl-4 bg-card/20 rounded-xl p-3">
        <div className="absolute top-1 left-0 w-[2px] h-8 bg-primary/40 rounded-full"></div>
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
          <Zap size={14} /> The Chosen Path
        </h2>
        <p className="text-lg md:text-xl font-serif leading-relaxed text-foreground/90">{decision.chosenAction}</p>
      </section>

      {/* Details Grid */}
      <div className="space-y-10">
        {decision.options && (
          <section className="space-y-3 p-4 rounded-xl bg-card/30 border border-border/30">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Considered Options</h2>
            <p className="font-light text-sm leading-relaxed whitespace-pre-wrap">{decision.options}</p>
          </section>
        )}
        
        {decision.gutFeeling && (
          <section className="space-y-3 p-4 rounded-xl bg-card/30 border border-border/30">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Gut Feeling</h2>
            <p className="font-light text-sm leading-relaxed whitespace-pre-wrap italic">{decision.gutFeeling}</p>
          </section>
        )}

        {decision.fears && (
          <section className="space-y-3 p-4 rounded-xl bg-card/30 border border-border/30">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2 text-destructive/70">
              <AlertTriangle size={14} /> Fears & Concerns
            </h2>
            <p className="font-light text-sm leading-relaxed whitespace-pre-wrap mb-4">{decision.fears}</p>
            {decision.worstOutcome && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">Worst Case Scenario</span>
                <p className="font-light text-sm leading-relaxed text-destructive/80">{decision.worstOutcome}</p>
              </div>
            )}
          </section>
        )}

        {!decision.fears && decision.worstOutcome && (
          <section className="space-y-3 p-4 rounded-xl bg-card/30 border border-border/30">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2 text-destructive/70">
              <AlertTriangle size={14} /> Worst Case Scenario
            </h2>
            <p className="font-light text-sm leading-relaxed text-destructive/80">{decision.worstOutcome}</p>
          </section>
        )}

        {decision.hopes && (
          <section className="space-y-3 p-4 rounded-xl bg-card/30 border border-border/30">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2 text-primary/70">
              <TrendingUp size={14} /> {decision.options === "Used 10-10-10 Framework" ? "Long-term View" : "Hopes & Expectations"}
            </h2>
            <p className="font-light text-sm leading-relaxed whitespace-pre-wrap">{decision.hopes}</p>
          </section>
        )}

        {decision.recoveryPlan && (
          <section className="space-y-3 p-4 rounded-xl bg-card/30 border border-border/30">
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
      <div className="mt-12 border-t border-border pt-12">
        <h2 className="text-2xl font-serif mt-16 mb-6 text-center text-foreground/80">The Outcome</h2>
        
        {decision.outcomeStatus === 'pending' && !isEditingOutcome ? (
          <div className="text-center p-8 rounded-3xl border border-dashed border-border/60 bg-card/40 shadow-sm">
            <p className="text-muted-foreground font-light mb-6">How did things turn out? Reflecting on outcomes builds better intuition.</p>
            <button 
              onClick={() => setIsEditingOutcome(true)}
              className="px-6 py-2.5 rounded-full bg-primary/90 text-primary-foreground tracking-widest uppercase text-xs hover:bg-primary transition-colors"
              data-testid="button-record-outcome"
            >
              Record Outcome
            </button>
          </div>
        ) : isEditingOutcome ? (
          <div className="space-y-8 animate-fade-in-slow">
            <div className="space-y-2">
              <label className="text-sm uppercase tracking-widest text-foreground/70">What actually happened?</label>
              <textarea 
                name="outcomeResult"
                value={outcomeData.outcomeResult}
                onChange={handleOutcomeChange}
                placeholder="Describe the objective result of your decision..."
                className="w-full p-3 rounded-xl bg-secondary/20 border border-border/50 focus:border-primary/40 outline-none min-h-[120px] resize-none font-light"
              ></textarea>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm uppercase tracking-widest text-foreground/70">Did your worst fear happen?</label>
              <select 
                name="worstOutcomeOccurred"
                value={outcomeData.worstOutcomeOccurred.toString()}
                onChange={handleOutcomeChange}
                className="w-full p-3 rounded-xl bg-secondary/20 border border-border/50 focus:border-primary/40 outline-none appearance-none font-light"
              >
                <option value="false">It did not happen</option>
                <option value="true">It happened</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm uppercase tracking-widest text-foreground/70">What surprised you?</label>
              <textarea 
                name="surprises"
                value={outcomeData.surprises}
                onChange={handleOutcomeChange}
                placeholder="Did your fears come true? Were there unexpected benefits?"
                className="w-full p-3 rounded-xl bg-secondary/20 border border-border/50 focus:border-primary/40 outline-none min-h-[100px] resize-none font-light"
              ></textarea>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm uppercase tracking-widest text-foreground/70">What did you learn?</label>
              <textarea 
                name="lessonsLearned"
                value={outcomeData.lessonsLearned}
                onChange={handleOutcomeChange}
                placeholder="How will this inform your future decisions?"
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
        ) : (
          <div className="space-y-6">
            <div className="space-y-6 relative p-4 rounded-2xl bg-card/20 border border-border/30">
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
                {decision.worstOutcomeProbability !== undefined && decision.outcomeStatus === 'recorded' && (
                  <div className="mt-6 pt-6 border-t border-border/40">
                    {(() => {
                      const insight = getInsight(decision.worstOutcomeProbability || 0, decision.worstOutcomeOccurred || false);
                      return (
                        <div className="space-y-2 text-center">
                          <p className="text-sm text-foreground/80 font-light">
                            {(() => {
                              const p = decision.worstOutcomeProbability || 0;
                              let expectation = "";

                              if (p >= 75) expectation = "You were almost certain this would go wrong.";
                              else if (p >= 50) expectation = "You expected this to go wrong.";
                              else if (p >= 25) expectation = "You thought this might go wrong.";
                              else expectation = "You believed this was unlikely to go wrong.";

                              const outcome = decision.worstOutcomeOccurred
                                ? "It did."
                                : "It didn’t.";

                              return `${expectation} ${outcome}`;
                            })()}
                          </p>
                          <p className="text-xs text-muted-foreground/80 italic">
                            {insight.message}
                          </p>
                          <p className="text-xs text-foreground/60 italic">
                            {(() => {
                              const p = decision.worstOutcomeProbability || 0;
                              const occurred = decision.worstOutcomeOccurred;

                              if (p >= 75 && !occurred) return "Reality was calmer than you expected.";
                              if (p <= 25 && occurred) return "Reality was harsher than you expected.";
                              if (p >= 50 && !occurred) return "Things went better than you anticipated.";
                              if (p <= 50 && occurred) return "Things turned out tougher than expected.";

                              return "Reality unfolded differently than expected.";
                            })()}
                          </p>
                          <p className="text-[11px] text-muted-foreground/70 italic mt-2">
                            Does this match how you usually expect things to go?
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}
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

      {showTruthReveal && decision.worstOutcomeProbability !== undefined && (
        <TruthReveal 
          prediction={decision.worstOutcomeProbability}
          occurred={decision.worstOutcomeOccurred || false}
          profile={getUserProfile()}
          onContinue={handleTruthRevealContinue}
        />
      )}
    </div>
  );
}
