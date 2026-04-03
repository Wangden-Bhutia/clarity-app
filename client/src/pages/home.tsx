import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import DailyPredictionWidget from "@/components/daily-prediction-widget";
import { db } from "@/lib/db";

export default function Home() {
  const [insight, setInsight] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const past = await db.getAllDecisions();
      if (past.length < 3) return;

      // sort by most recent
      const sorted = [...past].sort((a, b) => b.date - a.date);

      // weighted scoring (recent decisions matter more)
      let regretScore = 0;
      let moneyScore = 0;

      sorted.forEach((d, index) => {
        const weight = 1 / (index + 1); // recent = higher weight
        const text = (d.worstOutcome || d.fears || d.title || "").toLowerCase();

        if (/regret|wrong|mistake/.test(text)) regretScore += weight;
        if (/money|loss|cost/.test(text)) moneyScore += weight;
      });

      // Counter-pattern detection (fear vs outcome)
      let counterInsight: string | null = null;

      const completed = sorted.filter(d => d.outcomeStatus === "completed");

      if (completed.length >= 2) {
        let fearedCount = 0;
        let actualBad = 0;

        completed.forEach((d) => {
          const fearText = (d.worstOutcome || d.fears || "").toLowerCase();
          const outcomeText = (d.outcomeResult || "").toLowerCase();

          if (/loss|regret|mistake|bad/.test(fearText)) {
            fearedCount++;
          }

          if (/loss|regret|mistake|bad/.test(outcomeText)) {
            actualBad++;
          }
        });

        // if fear >> reality → show counter insight
        if (fearedCount > actualBad + 1) {
          counterInsight = "You often expect negative outcomes — but your actual results are usually better than expected.";
        }
      }

      // normalize strength
      const dominant = regretScore > moneyScore ? "regret" : "money";
      const strength = Math.max(regretScore, moneyScore);

      if (counterInsight) {
        setInsight(counterInsight);
        return;
      }

      if (dominant === "regret") {
        if (strength > 1.5) {
          setInsight("You consistently worry about making the wrong choice.");
        } else if (strength > 0.7) {
          setInsight("You often worry about making the wrong choice.");
        } else {
          setInsight("You sometimes worry about making the wrong choice.");
        }
      } else if (dominant === "money") {
        if (strength > 1.5) {
          setInsight("Financial concerns strongly shape your decisions.");
        } else if (strength > 0.7) {
          setInsight("Money concerns show up in your decisions.");
        } else {
          setInsight("Money considerations occasionally influence your decisions.");
        }
      } else {
        setInsight("Your decision patterns are still forming.");
      }
    })();
  }, []);

  return (
    <div className="flex flex-col gap-16 py-8">
      
      <section className="text-center py-12 md:py-24 flex flex-col items-center">
        <div className="relative w-full max-w-2xl">

          <h1 className="text-4xl md:text-6xl font-light mb-6 text-foreground leading-tight pt-6">
            A space for <br className="md:hidden" />
            <span className="italic text-primary/80">considered</span> choices.
          </h1>
        </div>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl font-light leading-relaxed mb-12">
          Pause, reflect, and record your thought process before making important decisions.
          Return later to see how things turned out. All stored securely on your device.
        </p>
        
        <div className="flex items-center justify-center mb-16">
          <Link href="/framework-flow">
            <a className="flex items-center justify-center gap-4 bg-primary text-primary-foreground px-8 py-4 rounded-full">
              <span className="tracking-wide uppercase text-sm">Log a Decision</span>
              <ArrowRight size={18} />
            </a>
          </Link>
        </div>

        {insight && (
          <p className="mt-4 text-xs text-muted-foreground/70 italic text-center max-w-sm mx-auto">
            {insight}
          </p>
        )}

        <div className="w-full max-w-lg mx-auto">
          <DailyPredictionWidget />
        </div>

      </section>

    </div>
  );
}
