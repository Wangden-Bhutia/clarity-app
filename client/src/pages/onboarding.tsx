import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [isReturningUser, setIsReturningUser] = useState(false);
  
  useEffect(() => {
    // If they've already completed onboarding before, they are a returning user
    const hasSeen = localStorage.getItem('hasSeenOnboarding') === 'true';
    setIsReturningUser(hasSeen);
  }, []);

  const handleComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    localStorage.setItem('clarity_last_opened', Date.now().toString());
    
    if (isReturningUser) {
      // Try to go back if they came from settings, otherwise go home
      if (window.history.length > 2) {
        window.history.back();
      } else {
        setLocation('/');
      }
    } else {
      // For truly new users, go home
      setLocation('/');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen max-w-2xl mx-auto px-6 py-12 text-center relative bg-background animate-fade-in-slow">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto space-y-16">
        
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-serif text-foreground leading-tight tracking-tight">
            See how your mind predicts reality
          </h1>
          <p className="text-lg md:text-xl font-light text-foreground/70 leading-relaxed max-w-sm mx-auto">
            Most of what we fear never happens.<br />
            But we rarely check.
          </p>
        </div>

        <div className="space-y-4 text-left w-full max-w-xs mx-auto">
          <p className="text-base font-light text-foreground/80 border-b border-border/50 pb-4">
            <span className="text-primary/60 mr-4">—</span> Log what you think will happen
          </p>
          <p className="text-base font-light text-foreground/80 border-b border-border/50 pb-4">
            <span className="text-primary/60 mr-4">—</span> Come back to what actually happened
          </p>
          <p className="text-base font-light text-foreground/80 pb-4">
            <span className="text-primary/60 mr-4">—</span> See the gap clearly
          </p>
        </div>

        <div className="space-y-8 pt-8">
          <p className="text-lg font-serif italic text-foreground/90">
            You don’t need advice.<br />
            You need a clearer mirror.
          </p>

          <button 
            onClick={handleComplete}
            className="w-full max-w-[200px] mx-auto py-4 rounded-full bg-foreground text-background font-medium tracking-widest uppercase text-sm hover:bg-foreground/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            {isReturningUser ? "Return" : "Begin"}
          </button>
        </div>

      </div>

      <div className="mt-auto pt-16">
        <p className="text-[10px] tracking-widest text-muted-foreground">
          A StillMind Labs creation
        </p>
      </div>
    </div>
  );
}