import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import DailyPredictionWidget from "@/components/daily-prediction-widget";

export default function Home() {
  return (
    <div className="flex flex-col gap-16 py-8">
      
      <section className="text-center py-12 md:py-24 flex flex-col items-center">
        <h1 className="text-4xl md:text-6xl font-light mb-6 text-foreground leading-tight">
          A space for <br className="md:hidden" />
          <span className="italic text-primary/80">considered</span> choices.
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl font-light leading-relaxed mb-12">
          Pause, reflect, and record your thought process before making important decisions.
          Return later to see how things turned out. All stored securely on your device.
        </p>
        
        <div className="flex items-center justify-center mb-16">
          <Link href="/frameworks">
            <a className="flex items-center justify-center gap-4 bg-primary text-primary-foreground px-8 py-4 rounded-full">
              <span className="tracking-wide uppercase text-sm">Log a Decision</span>
              <ArrowRight size={18} />
            </a>
          </Link>
        </div>

        <div className="w-full max-w-lg mx-auto">
          <DailyPredictionWidget />
        </div>

      </section>

    </div>
  );
}
