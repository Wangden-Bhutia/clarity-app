import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { db, Decision } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import resolver from "@/lib/insight/resolver";
import { getArchetypeInsight } from "@/lib/insight/messaging";
import { DECISION_CATEGORIES } from "@/lib/chipReference";
// removed unused nudge

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);


export default function FrameworkFlow() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [category, setCategory] = useState("");
  useEffect(() => {
    const draft = localStorage.getItem("clarity_draft");
    if (draft) {
      setFormData(prev => ({
        ...prev,
        decisionDescription: draft
      }));

      setOpenNotes(prev => ({
        ...prev,
        decision: true
      }));
    }
  }, []);
  const [overthinkingScoreUI, setOverthinkingScoreUI] = useState<number | null>(null);
  const [openNotes, setOpenNotes] = useState({
    decision: false,
    worry: false,
    gut: false,
    action: false
  });
  
  const [formData, setFormData] = useState({
    decisionCategory: "",
    decisionDescription: "",
    // Standard
    options: "",
    gutFeeling: "",
    pullNote: "",
    // 10-10-10
    tenDays: "",
    tenMonths: "",
    tenYears: "",
    // Inversion
    guaranteedFailure: "",
    avoidancePlan: "",
    // Fear Setting
    worstCase: "",
    worryNote: "",
    prevention: "",
    repair: "",
    // Common
    worstOutcomeProbability: null as number | null,
    importance: null as number | null,
    chosenAction: "",
    actionNote: "",
    confidenceRating: 5
  });


  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      return updated;
    });
  };



  const handleSave = async () => {
    if (!formData.decisionCategory) return;
    if (!formData.importance) return;
    if (!formData.worstOutcomeProbability) return;

    try {
      const primaryConcern = formData.worstCase || "";
      const newDecision: Decision = {
        id: generateId(),
        decisionDescription: formData.decisionDescription,
        title: formData.decisionDescription.split('.')[0].substring(0, 50) + (formData.decisionDescription.length > 50 ? '...' : ''),
        primaryConcern,
        worstCase: formData.worstCase,
        worryNote: formData.worryNote,
        worstOutcomeProbability: formData.worstOutcomeProbability,
        worstOutcomeProbabilityValue: formData.worstOutcomeProbability,
        category: "Framework",
        options: formData.options,
        hopes: "",
        gutFeeling: formData.gutFeeling,
        pullNote: formData.pullNote,
        recoveryPlan: "",
        chosenAction: formData.chosenAction,
        actionNote: formData.actionNote,
        confidenceRating: formData.confidenceRating,
        date: Date.now(),
        outcomeStatus: 'pending',
        preInsight: "", // temporary placeholder
      };


      const importanceMap: Record<number, string> = {
        1: "Low Impact",
        2: "Moderate",
        3: "High Stakes",
        4: "Life-Changing"
      };

      const probabilityMap: Record<number, string> = {
        10: "Very Unlikely",
        30: "Unlikely",
        50: "Uncertain",
        70: "Likely",
        90: "Very Likely"
      };

      const { primary, secondary } = resolver({
        category: formData.decisionCategory,
        worry: formData.worstCase,
        pull: formData.gutFeeling,
        action: formData.chosenAction,
        importance: importanceMap[formData.importance!],
        probability: probabilityMap[formData.worstOutcomeProbability!]
      });

      // Add primaryArchetype to newDecision
      newDecision.primaryArchetype = primary;

      const insight = getArchetypeInsight({ primary, secondary }, formData.decisionCategory, formData.worstCase);

      // Store as structured object (used by ClarityInsightBlock)
      newDecision.preInsightArchetype = {
        title: insight.title,
        summary: insight.mainLine,
        coaching: insight.deepLine
      };

      // Keep legacy string as fallback for old records
      newDecision.preInsight = `${insight.title}||${insight.mainLine}||${insight.deepLine}`;

      await db.saveDecision(newDecision);

      // Cleanup draft after save
      localStorage.removeItem("clarity_draft");
      setLocation(`/decision/${newDecision.id}`);
    } catch (error) {
      console.error("Error saving decision:", error);
      toast({
        title: "Error",
        description: "Could not save. Please try again.",
        variant: "destructive"
      });
    }
  };

  const selectedCategoryConfig = DECISION_CATEGORIES.find(
    (item) => item.category === category
  );


  return (
    <div className="flex flex-col gap-8 py-8 max-w-2xl mx-auto w-full animate-fade-in-slow pb-32">
      
      <div className="flex items-center justify-between mb-4 text-sm uppercase tracking-widest text-muted-foreground">
        <button 
          onClick={() => setLocation('/')}
          className="flex items-center gap-2 hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="space-y-9">
        {overthinkingScoreUI !== null && (
          <div
            className={`p-4 rounded-xl text-center ${
              overthinkingScoreUI >= 60
                ? "bg-red-500/10 border border-red-500/30"
                : overthinkingScoreUI >= 30
                ? "bg-amber-500/10 border border-amber-500/30"
                : "bg-green-500/10 border border-green-500/30"
            }`}
          >
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              Overthinking Score
            </p>
            <p
              className={`text-lg font-semibold ${
                overthinkingScoreUI >= 60
                  ? "text-red-600"
                  : overthinkingScoreUI >= 30
                  ? "text-amber-600"
                  : "text-green-600"
              }`}
            >
              {overthinkingScoreUI}%
            </p>
            <p className="text-xs text-muted-foreground">
              {overthinkingScoreUI >= 60
                ? "You tend to overestimate low-stakes risks"
                : overthinkingScoreUI >= 30
                ? "Some tendency to overthink low-impact situations"
                : "Your risk judgment is fairly balanced"}
            </p>
          </div>
        )}
        {/* Decision */}
        <div className="p-5 rounded-2xl bg-muted/40 border border-border/60 shadow-lg space-y-3.5">
          <h2 className="text-lg font-medium border-b border-border/40 pb-2">
            What decision are you trying to make?
          </h2>
          <p className="text-xs text-muted-foreground">
            State it simply and clearly.
          </p>

          <input
            type="text"
            value={formData.decisionDescription || ""}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, decisionDescription: e.target.value }))
            }
            placeholder="e.g. Should I switch jobs?"
            className="w-full px-4 py-3 rounded-lg border bg-background"
          />
        </div>

        <div className="p-5 rounded-2xl bg-muted/40 border border-border/60 shadow-lg space-y-3.5">
          <h2 className="text-lg font-medium border-b border-border/40 pb-2">
            What part of your life does this affect most?
          </h2>
          <p className="text-xs text-muted-foreground">
            Choose the area this decision mainly impacts.
          </p>

          {/* Quick chips */}
          <div className="grid grid-cols-2 gap-1.5">
            {DECISION_CATEGORIES.map((item) => (
              <button
                key={item.category}
                onClick={() => {
                  setFormData((prev) => {
                    const isSame = prev.decisionCategory === item.category;
                    return {
                      ...prev,
                      decisionCategory: isSame ? "" : item.category
                    };
                  });

                  setCategory(prev => (prev === item.category ? "" : item.category));
                }}
                className={`w-full px-3 py-1.5 rounded-full text-xs border transition text-center ${
                  formData.decisionCategory === item.category
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 border-border hover:bg-primary/10"
                }`}
              >
                {item.category}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setOpenNotes(prev => ({ ...prev, decision: !prev.decision }))}
            className="text-xs text-muted-foreground hover:text-foreground transition"
          >
            {openNotes.decision ? "Hide note" : <><span className="text-primary">▼</span> Optional note</>}
          </button>

          {openNotes.decision && (
            <>
              <textarea 
                name="decisionDescription"
                value={formData.decisionDescription}
                onChange={handleChange}
                placeholder="Describe it briefly..."
                maxLength={250}
                className="w-full p-6 rounded-2xl bg-card border border-border outline-none min-h-[140px] text-base"
              />
              <p className="text-[10px] text-muted-foreground text-right mt-1">
                {formData.decisionDescription.length}/250
              </p>
            </>
          )}
        </div>


        {/* ── PULL: desire first, before the fear ─────────────────────── */}
        <div className={`p-5 rounded-2xl border shadow-lg space-y-3.5 transition ${
          category
            ? "bg-muted/40 border-border/60"
            : "bg-muted/20 border-border/30 opacity-50 pointer-events-none"
        }`}>
          <h3 className="text-lg font-medium mb-2 border-b border-border/40 pb-2">
            What’s drawing you toward this?
          </h3>
          <p className="text-xs text-muted-foreground">
            What do you hope to gain or feel?
          </p>
          <div className="grid grid-cols-2 gap-2 mb-2.5">
            {(selectedCategoryConfig?.pulls || []).map((chip) => (
              <button
                key={chip}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    gutFeeling: prev.gutFeeling === chip ? "" : chip
                  }))
                }
                className={`w-full px-3 py-2 rounded-xl text-xs border transition text-center leading-snug ${
                  formData.gutFeeling === chip
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/50 border-border hover:bg-primary/10"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOpenNotes(prev => ({ ...prev, gut: !prev.gut }))}
            className="text-xs text-muted-foreground hover:text-foreground transition"
          >
            {openNotes.gut ? "Hide note" : <><span className="text-primary">▼</span> Add your own</>}
          </button>
          {openNotes.gut && (
            <>
              <textarea
                name="pullNote"
                value={formData.pullNote}
                onChange={handleChange}
                placeholder="What pulls you toward this in your own words..."
                maxLength={140}
                className="w-full p-5 rounded-2xl bg-card border border-border outline-none min-h-[100px]"
              />
              <p className="text-[10px] text-muted-foreground text-right mt-1">
                {formData.pullNote.length}/140
              </p>
            </>
          )}
        </div>

        {/* ── WORRY: biggest concern ───────────────────────────────────── */}
        <div className={`p-5 rounded-2xl border shadow-lg space-y-3.5 transition ${
          category
            ? "bg-muted/40 border-border/60"
            : "bg-muted/20 border-border/30 opacity-50 pointer-events-none"
        }`}>
          <h3 className="text-lg font-medium mb-2 border-b border-border/40 pb-2">
            What’s your biggest concern?
          </h3>
          <p className="text-xs text-muted-foreground">
            What might go wrong or hold you back?
          </p>
          <div className="grid grid-cols-2 gap-2 mb-2.5">
            {(selectedCategoryConfig?.worries || []).map((chip) => (
              <button
                key={chip}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    worstCase: prev.worstCase === chip ? "" : chip
                  }))
                }
                className={`w-full px-3 py-2 rounded-xl text-xs border transition text-center leading-snug ${
                  formData.worstCase === chip
                    ? "bg-destructive/10 text-destructive border-destructive/30"
                    : "bg-secondary/50 border-border hover:bg-destructive/5"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOpenNotes(prev => ({ ...prev, worry: !prev.worry }))}
            className="text-xs text-muted-foreground hover:text-foreground transition"
          >
            {openNotes.worry ? "Hide note" : <><span className="text-primary">▼</span> Add your own</>}
          </button>
          {openNotes.worry && (
            <>
              <textarea
                name="worryNote"
                value={formData.worryNote}
                onChange={handleChange}
                placeholder="What worries you most in your own words..."
                maxLength={140}
                className="w-full p-5 rounded-2xl bg-card border border-border outline-none min-h-[100px]"
              />
              <p className="text-[10px] text-muted-foreground text-right mt-1">
                {formData.worryNote.length}/140
              </p>
            </>
          )}
        </div>

        {/* ── PROBABILITY: calibrate the fear ─────────────────────────── */}
        <div className={`p-5 rounded-2xl border shadow-lg space-y-3.5 transition ${
          category
            ? "bg-muted/40 border-border/60"
            : "bg-muted/20 border-border/30 opacity-50 pointer-events-none"
        }`}>
          <h3 className="text-lg font-medium mb-2 border-b border-border/40 pb-2">
            How likely is that concern to actually happen?
          </h3>
          <p className="text-xs text-muted-foreground">
            A rough sense is all you need.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Very unlikely", value: 10 },
              { label: "Unlikely",      value: 30 },
              { label: "Uncertain",     value: 50 },
              { label: "Likely",        value: 70 },
              { label: "Very likely",   value: 90 }
            ].map((chip) => (
              <button
                key={chip.label}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    worstOutcomeProbability: chip.value
                  }))
                }
                className={`w-full px-3 py-2 rounded-xl text-xs border transition text-center ${
                  formData.worstOutcomeProbability === chip.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/50 border-border hover:bg-primary/10"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── IMPORTANCE: overall stakes ───────────────────────────────── */}
        <div className={`p-5 rounded-2xl border shadow-lg space-y-3.5 transition ${
          category
            ? "bg-muted/40 border-border/60"
            : "bg-muted/20 border-border/30 opacity-50 pointer-events-none"
        }`}>
          <h3 className="text-lg font-medium mb-2 border-b border-border/40 pb-2">
            How much does this actually matter to your life?
          </h3>
          <p className="text-xs text-muted-foreground">
            Set aside the anxiety — how significant is this really?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Low impact",     value: 1 },
              { label: "Moderate",       value: 2 },
              { label: "High stakes",    value: 3 },
              { label: "Life-changing",  value: 4 }
            ].map((chip) => (
              <button
                key={chip.label}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    importance: chip.value
                  }))
                }
                className={`w-full px-3 py-2 rounded-xl text-xs border transition text-center ${
                  formData.importance === chip.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/50 border-border hover:bg-primary/10"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── ACTION: current direction ────────────────────────────────── */}
        <div className={`p-5 rounded-2xl border shadow-lg space-y-3.5 transition ${
          category
            ? "bg-muted/40 border-border/60"
            : "bg-muted/20 border-border/30 opacity-50 pointer-events-none"
        }`}>
          <h3 className="text-lg font-medium mb-2 border-b border-border/40 pb-2">
            What are you leaning toward doing?
          </h3>
          <p className="text-xs text-muted-foreground">
            You don’t need to be certain — just your current direction.
          </p>
          <div className="grid grid-cols-2 gap-2 mb-2.5">
            {(selectedCategoryConfig?.actions || []).map((chip) => (
              <button
                key={chip}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    chosenAction: prev.chosenAction === chip ? "" : chip
                  }))
                }
                className={`w-full px-3 py-2 rounded-xl text-xs border transition text-center leading-snug ${
                  formData.chosenAction === chip
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/50 border-border hover:bg-primary/10"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOpenNotes(prev => ({ ...prev, action: !prev.action }))}
            className="text-xs text-muted-foreground hover:text-foreground transition"
          >
            {openNotes.action ? "Hide note" : <><span className="text-primary">▼</span> Add your own</>}
          </button>
          {openNotes.action && (
            <>
              <textarea
                name="actionNote"
                value={formData.actionNote}
                onChange={handleChange}
                placeholder="Describe what you’re leaning toward..."
                maxLength={140}
                className="w-full p-5 rounded-2xl bg-card border border-border outline-none min-h-[100px]"
              />
              <p className="text-[10px] text-muted-foreground text-right mt-1">
                {formData.actionNote.length}/140
              </p>
            </>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSave}
            disabled={
              !formData.decisionCategory ||
              !formData.importance ||
              !formData.worstOutcomeProbability
            }
            className="px-8 py-4 rounded-full bg-primary text-primary-foreground text-sm uppercase tracking-widest hover:bg-primary/90 transition disabled:opacity-50"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}