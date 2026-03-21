import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Clock, Save } from "lucide-react";
import { db, Decision } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import TruthReveal from "./truth-reveal";
import { getPreDecisionNudge } from "@/lib/nudge";

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export default function DailyPredictionWidget() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [description, setDescription] = useState("");
  const [probability, setProbability] = useState(50);
  const [isSaving, setIsSaving] = useState(false);
  
  const nudgeMessage = useMemo(() => getPreDecisionNudge(), [isExpanded]); // Recompute when opened

  const handleSave = async () => {
    if (!description.trim()) return;
    setIsSaving(true);

    try {
      // Set review date to exactly 24 hours from now
      const tomorrow = Date.now() + (24 * 60 * 60 * 1000);

      const newDecision: Decision = {
        id: generateId(),
        decisionDescription: `Daily Prediction: ${description}`,
        title: description.split('.')[0].substring(0, 50) + (description.length > 50 ? '...' : ''),
        worstOutcome: description,
        worstOutcomeProbability: probability,
        category: "Daily Micro-Prediction",
        options: "",
        fears: "",
        hopes: "",
        gutFeeling: "",
        recoveryPlan: "",
        chosenAction: "Waiting for tomorrow...",
        confidenceRating: 5,
        date: Date.now(),
        reviewDate: tomorrow,
        outcomeStatus: 'pending'
      };

      await db.saveDecision(newDecision);
      
      toast({
        title: "Prediction Locked",
        description: "We'll ask you how it went tomorrow.",
      });
      
      setDescription("");
      setProbability(50);
      setIsExpanded(false);
      
      // Reload the page to reflect the new state (e.g. mindfulness rhythm)
      window.location.reload();
    } catch (error) {
      console.error("Error saving daily prediction:", error);
      toast({
        title: "Error",
        description: "Could not save. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full bg-primary/5 border border-primary/20 rounded-3xl overflow-hidden transition-all duration-500 shadow-sm relative group">
      {!isExpanded ? (
        <button 
          onClick={() => setIsExpanded(true)}
          className="w-full p-6 flex items-center justify-between text-left hover:bg-primary/10 transition-colors"
        >
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Clock size={16} />
              <span className="text-xs uppercase tracking-widest font-medium">Worry Offload</span>
            </div>
            <p className="font-serif text-lg text-foreground/90">What's a small thing you're anxious about today?</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center border border-border group-hover:scale-110 transition-transform">
            <span className="text-primary text-xl leading-none">+</span>
          </div>
        </button>
      ) : (
        <div className="p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4 text-primary">
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span className="text-xs uppercase tracking-widest font-medium">Worry Offload</span>
            </div>
            <button 
              onClick={() => setIsExpanded(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-6">
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. The meeting at 2PM will go terribly..."
              className="w-full p-4 rounded-2xl bg-background border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all min-h-[100px] resize-none font-light text-lg"
              autoFocus
            ></textarea>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-xs uppercase tracking-widest text-foreground/70 ml-2">Probability it happens?</label>
                <span className="font-mono text-lg text-primary/80">{probability}%</span>
              </div>
              {nudgeMessage && (
                <p className="text-xs text-muted-foreground/60 ml-2 font-light italic">{nudgeMessage}</p>
              )}
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="10"
                value={probability}
                onChange={(e) => setProbability(parseInt(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground px-1 font-light">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={!description.trim() || isSaving}
              className="w-full py-4 rounded-full bg-foreground text-background font-medium tracking-widest uppercase text-sm hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
            >
              <Save size={16} /> Lock Prediction for 24 Hours
            </button>
          </div>
        </div>
      )}
    </div>
  );
}