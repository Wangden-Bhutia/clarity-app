import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Save } from "lucide-react";
import { db, Decision } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { getPreDecisionNudge } from "@/lib/nudge";

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export default function QuickFlow() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const nudgeMessage = useMemo(() => getPreDecisionNudge(), []);
  
  const [formData, setFormData] = useState({
    decisionDescription: "",
    worstOutcome: "",
    worstOutcomeProbability: 50
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.decisionDescription) {
      toast({
        title: "Missing Description",
        description: "Please describe the decision you are facing.",
        variant: "destructive"
      });
      return;
    }

    try {
      const newDecision: Decision = {
        id: generateId(),
        decisionDescription: formData.decisionDescription,
        title: formData.decisionDescription.split('.')[0].substring(0, 50) + (formData.decisionDescription.length > 50 ? '...' : ''),
        worstOutcome: formData.worstOutcome,
        worstOutcomeProbability: formData.worstOutcomeProbability,
        category: "Other",
        options: "",
        fears: "",
        hopes: "",
        gutFeeling: "",
        recoveryPlan: "",
        chosenAction: "To be determined...",
        confidenceRating: 5,
        date: Date.now(),
        outcomeStatus: 'pending'
      };

      await db.saveDecision(newDecision);
      
      toast({
        title: "Quick Decision Saved",
        description: "Your thought has been recorded.",
      });
      
      setLocation(`/decision/${newDecision.id}`);
    } catch (error) {
      console.error("Error saving quick decision:", error);
      toast({
        title: "Error",
        description: "Could not save. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col gap-8 py-8 max-w-2xl mx-auto w-full animate-fade-in-slow">
      <div className="flex items-center justify-between mb-4 text-sm uppercase tracking-widest text-muted-foreground">
        <Link href="/">
          <a className="flex items-center gap-2 hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Back
          </a>
        </Link>
        <span className="font-mono text-xs bg-secondary/50 px-3 py-1 rounded-full">
          Quick Entry
        </span>
      </div>

      <header>
        <h2 className="text-3xl font-serif mb-2">Capture a thought</h2>
        <p className="text-muted-foreground font-light">Quickly log a decision to reflect on its outcome later.</p>
      </header>

      <div className="space-y-8 mt-4">
        <div className="space-y-2">
          <label className="text-sm uppercase tracking-widest text-foreground/70 ml-2">What decision are you currently facing?</label>
          <textarea 
            name="decisionDescription"
            value={formData.decisionDescription}
            onChange={handleChange}
            placeholder="Describe the situation briefly..."
            className="w-full p-4 rounded-2xl bg-card border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all min-h-[120px] resize-none text-lg font-serif"
          ></textarea>
        </div>

        <div className="space-y-2">
          <label className="text-sm uppercase tracking-widest text-foreground/70 ml-2">What is the absolute worst outcome?</label>
          <textarea 
            name="worstOutcome"
            value={formData.worstOutcome}
            onChange={handleChange}
            placeholder="Realistically, what is the worst thing that could happen?"
            className="w-full p-4 rounded-2xl bg-card border border-destructive/20 focus:border-destructive/50 focus:ring-1 focus:ring-destructive/50 outline-none transition-all min-h-[100px] resize-none font-light"
          ></textarea>
        </div>
        
        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-end">
            <label className="text-sm uppercase tracking-widest text-foreground/70 ml-2">How likely do you think this worst outcome is?</label>
            <span className="font-mono text-xl text-destructive/80">{formData.worstOutcomeProbability}%</span>
          </div>
          {nudgeMessage && (
            <p className="text-xs text-muted-foreground/60 ml-2 font-light italic">{nudgeMessage}</p>
          )}
          <input 
            type="range" 
            min="0" 
            max="100" 
            step="25"
            name="worstOutcomeProbability"
            value={formData.worstOutcomeProbability}
            onChange={(e) => setFormData(prev => ({ ...prev, worstOutcomeProbability: parseInt(e.target.value) }))}
            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-destructive"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground px-1">
            <span>0% — Impossible</span>
            <span>25% — Unlikely</span>
            <span>50% — Possible</span>
            <span>75% — Likely</span>
            <span>100% — Certain</span>
          </div>
        </div>
      </div>

      <button 
        onClick={handleSave}
        disabled={!formData.decisionDescription}
        className="w-full py-5 mt-8 rounded-full bg-foreground text-background font-medium tracking-widest uppercase text-sm hover:bg-foreground/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-1"
      >
        <Save size={18} /> Save Quick Decision
      </button>
    </div>
  );
}