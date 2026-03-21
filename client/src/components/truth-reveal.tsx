import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { UserProfile } from "@/lib/stats";

interface TruthRevealProps {
  prediction: number;
  occurred: boolean;
  profile: UserProfile;
  onContinue: () => void;
}

const generateTruthMessage = (prediction: number, occurred: boolean, profile: UserProfile) => {
  const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  
  const usePatternMessage = profile !== "insufficient_data" && Math.random() < 0.35; // 35% chance
  
  const isOverestimationExample = prediction >= 60 && !occurred;
  const isUnderestimationExample = prediction <= 40 && occurred;
  const isAccurateExample = (prediction >= 60 && occurred) || (prediction <= 40 && !occurred);

  if (usePatternMessage) {
    if (profile === "overestimator" && isOverestimationExample) {
      return getRandom([
        "This is becoming a pattern. You expect worse than what happens.",
        "Again, your prediction overshot reality.",
        "You keep leaning toward worst-case. Reality doesn't."
      ]);
    } else if (profile === "underestimator" && isUnderestimationExample) {
      return getRandom([
        "You tend to miss risks. This is one of them.",
        "You didn't see this coming. That's happening more often.",
        "Your predictions are softer than reality."
      ]);
    } else if (profile === "balanced" && isAccurateExample) {
      return getRandom([
        "Your predictions are lining up with reality.",
        "You're reading situations clearly.",
        "Your judgment is holding steady."
      ]);
    }
  }

  if (!occurred) {
    if (prediction >= 60) {
      return getRandom([
        "You were fairly certain this would go wrong. It didn't.",
        "Your mind predicted trouble. Reality disagreed.",
        "You expected the worst. It never arrived.",
        "The fear was high, but the threat wasn't real.",
        "Your anxiety wrote a story that didn't play out."
      ]);
    } else if (prediction >= 30) {
      return getRandom([
        "You leaned toward this going badly. It didn't.",
        "That concern didn't play out.",
        "You braced for friction. Reality was quiet.",
        "The expected difficulty never materialized."
      ]);
    } else {
      return getRandom([
        "You stayed grounded here. That held up.",
        "Your expectation matched reality.",
        "You correctly saw this as low risk.",
        "Your calm assessment proved accurate."
      ]);
    }
  } else {
    if (prediction >= 60) {
      return getRandom([
        "You saw this coming. Your read was accurate.",
        "Your concern matched reality.",
        "Your intuition about the risk was correct.",
        "You anticipated the difficulty correctly."
      ]);
    } else {
      return getRandom([
        "You didn't expect this. It still happened.",
        "This one slipped past your prediction.",
        "Reality was harsher than your assessment.",
        "An outcome you thought was unlikely materialized."
      ]);
    }
  }
};

export default function TruthReveal({ prediction, occurred, profile, onContinue }: TruthRevealProps) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    setMessage(generateTruthMessage(prediction, occurred, profile));
  }, [prediction, occurred, profile]);

  const patternLabels: Record<string, string> = {
    "overestimator": "You tend to overestimate outcomes",
    "underestimator": "You tend to underestimate risk",
    "balanced": "You are well calibrated"
  };

  const isOverestimationExample = prediction >= 60 && !occurred;
  const isUnderestimationExample = prediction <= 40 && occurred;
  const isAccurateExample = (prediction >= 60 && occurred) || (prediction <= 40 && !occurred);
  
  const showPatternLabel = profile !== "insufficient_data" && (
    (profile === "overestimator" && isOverestimationExample) ||
    (profile === "underestimator" && isUnderestimationExample) ||
    (profile === "balanced" && isAccurateExample)
  );

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-md w-full bg-card border border-border p-8 md:p-12 rounded-3xl shadow-xl animate-slide-up-slow text-center">
        <span className="text-[10px] uppercase tracking-widest text-primary/70 mb-8 block">Reality Check</span>
        
        <h2 className="text-2xl md:text-3xl font-serif text-foreground leading-tight mb-8">
          "{message}"
        </h2>
        
        <div className="space-y-2 mb-12 pt-8 border-t border-border/50 text-sm font-light text-muted-foreground">
          <p>Your prediction: <span className="font-mono text-foreground/80">{prediction}%</span></p>
          <p>Outcome: <span className="text-foreground/80">{occurred ? "Happened" : "Did not happen"}</span></p>
          
          {showPatternLabel && (
            <div className="pt-4 mt-4 border-t border-border/30 text-xs">
              <span className="uppercase tracking-widest text-primary/60 block mb-1">Pattern</span>
              <p className="text-foreground/70">{patternLabels[profile]}</p>
            </div>
          )}
        </div>

        <button 
          onClick={onContinue}
          className="w-full py-4 rounded-full bg-foreground text-background font-medium tracking-widest uppercase text-sm hover:bg-foreground/90 transition-all flex items-center justify-center gap-2"
        >
          Continue <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}