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
    <div />
  );
}