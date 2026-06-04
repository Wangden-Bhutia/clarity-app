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

  if (occurred) {
    return getRandom([
      "What you feared did happen.",
      "Your concern proved justified here.",
      "Your instinct aligned with reality this time.",
      "The risk you sensed became real."
    ]);
  } else {
    return getRandom([
      "What you feared did not happen.",
      "Your concern did not materialize.",
      "Reality was gentler than expected.",
      "Things turned out calmer than feared."
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
      <div className="max-w-lg w-full bg-card border border-border px-8 py-7 md:px-10 md:py-9 rounded-3xl shadow-xl animate-slide-up-slow text-center">
        <span className="text-[10px] uppercase tracking-widest text-primary/70 mb-6 block">Reality Check</span>
        
        <h2 className="text-2xl md:text-3xl font-serif text-foreground leading-[1.15] mb-8 transition-opacity duration-500">
          {message ? `"${message}"` : "..."}
        </h2>
        <p className="text-sm text-muted-foreground/60 italic leading-relaxed mb-8">
          Pause and notice the difference between expectation and reality.
        </p>
        
        <button 
          onClick={onContinue}
          disabled={!ready}
          className={`w-full py-4 rounded-full font-medium tracking-widest uppercase text-sm transition-all flex items-center justify-center gap-2 ${
            ready 
              ? "bg-primary text-primary-foreground hover:bg-primary/90" 
              : "bg-primary/30 text-primary-foreground/50 cursor-not-allowed"
          }`}
        >
          View Reflection <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}