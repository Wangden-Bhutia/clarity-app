import React, { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, AlignLeft } from "lucide-react";
import DailyPredictionWidget from "@/components/daily-prediction-widget";

export default function Home() {

  useEffect(() => {
    // lock body scroll on home
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <div className="h-[100dvh] overflow-hidden overscroll-none flex flex-col justify-between pt-4 pb-2">
      
      <section className="text-center flex flex-col items-center justify-center flex-1 gap-4 -mt-16">
        <div className="relative w-full max-w-2xl">

          <h1 className="text-4xl md:text-5xl font-light mb-1 text-foreground leading-[0.95]">
            Think Through Decisions With <span className="text-primary font-medium">Clarity</span>
          </h1>
        </div>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl font-light leading-relaxed mb-4">
          A simple framework to help you think clearly, spot bias, and learn from your decisions.
        </p>

        
        {/* Primary CTA */}
        <div className="flex items-center justify-center mb-2">
          <Link href="/framework-flow">
            <div className="flex items-center justify-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-full cursor-pointer">
              <span className="tracking-wide uppercase text-sm">Gain Clarity</span>
              <ArrowRight size={18} />
            </div>
          </Link>
        </div>

        {/* Secondary: step-by-step deep flow */}
        <Link href="/flow">
          <div className="flex items-center gap-2 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer py-1">
            <AlignLeft size={14} />
            <span className="text-xs tracking-wide">Step-by-step reflection</span>
          </div>
        </Link>

        <div className="w-full max-w-lg mx-auto pb-4">
          <DailyPredictionWidget />
        </div>

      </section>

    </div>
  );
}
