import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { UserProfile } from "@/lib/stats";

interface TruthRevealProps {
  occurred: boolean;
  profile: UserProfile;
  onContinue: () => void;
}

const generateTruthMessage = (occurred: boolean, profile: UserProfile) => {
  const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  if (!occurred) {
    return getRandom([
      "You were concerned about this. It didn’t happen.",
      "Your fear didn’t materialize.",
      "You expected trouble. It stayed quiet.",
      "The situation turned out calmer than expected."
    ]);
  } else {
    return getRandom([
      "Something you were concerned about did happen.",
      "Your concern matched reality here.",
      "This one didn’t go as hoped.",
      "The risk you sensed showed up."
    ]);
  }
};

export default function TruthReveal({ occurred, profile, onContinue }: TruthRevealProps) {
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const msg = generateTruthMessage(occurred, profile);
    setMessage("");

    const timer1 = setTimeout(() => setMessage(msg), 300);
    const timer2 = setTimeout(() => setReady(true), 900);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [occurred, profile]);

  const patternLabels: Record<string, string> = {
    "overestimator": "You tend to overestimate outcomes",
    "underestimator": "You tend to underestimate risk",
    "balanced": "You are well calibrated"
  };

  const showPatternLabel = profile !== "insufficient_data";

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-md w-full bg-card border border-border p-8 md:p-12 rounded-3xl shadow-xl animate-slide-up-slow text-center">
        <span className="text-[10px] uppercase tracking-widest text-primary/70 mb-8 block">Reality Check</span>
        
        <h2 className="text-3xl md:text-4xl font-serif text-foreground leading-tight mb-10 transition-opacity duration-500">
          {message ? `"${message}"` : "..."}
        </h2>
        <p className="text-xs text-muted-foreground/60 italic mb-10">
          Take a moment to notice this.
        </p>
        
        <div className="space-y-2 mb-12 pt-6 border-t border-border/30 text-sm font-light text-muted-foreground">
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
          disabled={!ready}
          className={`w-full py-4 rounded-full font-medium tracking-widest uppercase text-sm transition-all flex items-center justify-center gap-2 ${
            ready 
              ? "bg-primary text-primary-foreground hover:bg-primary/90" 
              : "bg-primary/30 text-primary-foreground/50 cursor-not-allowed"
          }`}
        >
          Continue <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}