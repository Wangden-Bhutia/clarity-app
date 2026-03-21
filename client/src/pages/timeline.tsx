import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Calendar, CheckCircle2, Circle } from "lucide-react";
import { db, Decision } from "@/lib/db";

export default function Timeline() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const allDecisions = await db.getAllDecisions();
        allDecisions.sort((a, b) => b.date - a.date); // Reverse chronological
        setDecisions(allDecisions);
      } catch (error) {
        console.error("Failed to load decisions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center opacity-50 min-h-[60vh]">
        <div className="w-8 h-8 border-t border-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-8 md:py-12 max-w-3xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-3xl md:text-5xl font-light mb-4">Timeline</h1>
        <p className="text-muted-foreground font-light">The journey of your choices over time.</p>
      </header>

      {decisions.length > 0 ? (
        <div className="relative pl-8 md:pl-0">
          {/* Vertical line for desktop */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2"></div>
          {/* Vertical line for mobile */}
          <div className="md:hidden absolute left-0 top-0 bottom-0 w-px bg-border"></div>

          <div className="space-y-12">
            {decisions.map((decision, index) => {
              const isEven = index % 2 === 0;
              const date = new Date(decision.date).toLocaleDateString(undefined, { 
                year: 'numeric', month: 'long', day: 'numeric' 
              });

              return (
                <div key={decision.id} className={`relative flex items-center justify-between md:justify-center group ${isEven ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
                  
                  {/* Timeline dot */}
                  <div className="absolute left-[-33px] md:left-1/2 w-4 h-4 rounded-full bg-background border-2 border-primary/50 md:-translate-x-1/2 group-hover:bg-primary group-hover:border-primary transition-colors z-10"></div>
                  
                  {/* Content card */}
                  <div className={`w-full md:w-5/12 ${isEven ? 'md:text-left' : 'md:text-right'} ${isEven ? 'md:pr-12' : 'md:pl-12'}`}>
                    <Link href={`/decision/${decision.id}`}>
                      <a className="block p-6 rounded-3xl border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all hover:shadow-sm">
                        <div className={`flex items-center gap-2 mb-3 text-xs text-muted-foreground ${isEven ? 'md:justify-start' : 'md:justify-end'}`}>
                          <Calendar size={14} />
                          <span>{date}</span>
                        </div>
                        
                        <h3 className="font-serif text-xl mb-2 group-hover:text-primary transition-colors">{decision.title}</h3>
                        
                        {decision.decisionDescription && (
                          <p className={`text-sm text-foreground/80 font-light line-clamp-2 italic mb-3 ${isEven ? 'md:text-left' : 'md:text-right'}`}>
                            {decision.decisionDescription.split('.')[0] + (decision.decisionDescription.includes('.') ? '.' : '')}
                          </p>
                        )}
                        
                        <div className={`flex items-center gap-2 mt-4 text-xs tracking-widest uppercase ${isEven ? 'md:justify-start' : 'md:justify-end'}`}>
                          {decision.outcomeStatus === 'recorded' ? (
                            <>
                              <CheckCircle2 size={14} className="text-primary/70" />
                              <span className="text-primary/70">Resolved</span>
                            </>
                          ) : (
                            <>
                              <Circle size={14} className="text-muted-foreground" />
                              <span className="text-muted-foreground">Pending</span>
                            </>
                          )}
                        </div>
                      </a>
                    </Link>
                  </div>
                  
                  {/* Empty space for the other side on desktop */}
                  <div className="hidden md:block w-5/12"></div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-24 border border-dashed border-border rounded-3xl">
          <p className="text-muted-foreground font-light text-lg mb-6">Your timeline is empty.</p>
          <Link href="/flow">
            <a className="text-primary hover:underline text-sm tracking-wide">
              Make your first decision
            </a>
          </Link>
        </div>
      )}
    </div>
  );
}
