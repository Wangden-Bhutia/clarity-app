import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, Activity, TrendingUp, AlertCircle, Calendar, Zap, Lightbulb, BookOpen, User } from "lucide-react";
import { db, Decision } from "@/lib/db";
import MindfulnessRhythm from "@/components/mindfulness-rhythm";
import DailyPredictionWidget from "@/components/daily-prediction-widget";

export default function Home() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [pendingOutcomes, setPendingOutcomes] = useState<Decision[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Weekly stats
  const [weeklyStats, setWeeklyStats] = useState({
    created: 0,
    outcomesRecorded: 0,
    betterThanExpected: 0,
    pending: 0
  });

  // Insights stats
  const [insightStats, setInsightStats] = useState({
    avgProbability: 0,
    worstOccurredPercent: 0
  });

  const [randomMemory, setRandomMemory] = useState<Decision | null>(null);
  const [lessons, setLessons] = useState<{type: string, text: string}[]>([]);
  const [profile, setProfile] = useState<string[] | null>(null);
  const [milestone, setMilestone] = useState<{count: number, accuracy: number} | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const allDecisions = await db.getAllDecisions();
        allDecisions.sort((a, b) => b.date - a.date); // Reverse chronological
        setDecisions(allDecisions);
        
        // Find decisions past their review date without outcomes
        const now = Date.now();
        const pending = allDecisions.filter(d => 
          d.outcomeStatus === 'pending' && d.reviewDate && d.reviewDate <= now
        );
        setPendingOutcomes(pending);

        // Weekly stats calculation
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        let createdThisWeek = 0;
        let outcomesThisWeek = 0;
        let betterThisWeek = 0;
        let pendingThisWeek = 0;

        // Insight stats calculation
        let totalProbability = 0;
        let decisionsWithProbability = 0;
        let worstOccurredCount = 0;
        let completedDecisionsCount = 0;

        allDecisions.forEach(d => {
          // Weekly
          if (d.date >= sevenDaysAgo) createdThisWeek++;
          if (d.outcomeStatus === 'pending') pendingThisWeek++;
          if (d.outcomeStatus === 'recorded' && d.outcomeDate && d.outcomeDate >= sevenDaysAgo) {
            outcomesThisWeek++;
            if (!d.worstOutcomeOccurred) {
              betterThisWeek++;
            }
          }

          // Insights
          if (d.outcomeStatus === 'recorded') {
            completedDecisionsCount++;
            if (d.worstOutcomeOccurred) {
              worstOccurredCount++;
            }
          }
          if (d.worstOutcomeProbability !== undefined) {
            totalProbability += d.worstOutcomeProbability;
            decisionsWithProbability++;
          }
        });

        setWeeklyStats({
          created: createdThisWeek,
          outcomesRecorded: outcomesThisWeek,
          betterThanExpected: betterThisWeek,
          pending: pendingThisWeek
        });

        const avgProbability = decisionsWithProbability > 0 ? Math.round(totalProbability / decisionsWithProbability) : 0;
        const worstOccurredPercent = completedDecisionsCount > 0 ? Math.round((worstOccurredCount / completedDecisionsCount) * 100) : 0;
        
        setInsightStats({
          avgProbability,
          worstOccurredPercent
        });

        // Memory Card
        const recordedDecisions = allDecisions.filter(d => d.outcomeStatus === 'recorded');
        if (recordedDecisions.length > 0) {
          const randomIndex = Math.floor(Math.random() * recordedDecisions.length);
          setRandomMemory(recordedDecisions[randomIndex]);
        }

        // Milestone
        if (allDecisions.length >= 20 || allDecisions.length >= 10 || allDecisions.length >= 5) {
          let count = 5;
          if (allDecisions.length >= 20) count = 20;
          else if (allDecisions.length >= 10) count = 10;
          
          let accuratePredictions = 0;
          let predictionsCount = 0;
          allDecisions.forEach(d => {
            if (d.outcomeStatus === 'recorded' && d.worstOutcomeProbability !== undefined) {
              predictionsCount++;
              if ((d.worstOutcomeProbability > 50 && d.worstOutcomeOccurred) || (d.worstOutcomeProbability <= 50 && !d.worstOutcomeOccurred)) {
                 accuratePredictions++;
              }
            }
          });
          
          setMilestone({
            count,
            accuracy: predictionsCount > 0 ? Math.round((accuratePredictions / predictionsCount) * 100) : 0
          });
        }

        // Lessons Feed
        const generatedLessons = [];
        if (avgProbability > worstOccurredPercent + 20 && completedDecisionsCount >= 2) {
           generatedLessons.push({ type: "Pattern", text: "You often expect difficult outcomes, but most things turn out better than predicted." });
        }
        if (completedDecisionsCount >= 3) {
           generatedLessons.push({ type: "Observation", text: "Recording outcomes consistently helps you recalibrate your baseline expectations." });
        }
        setLessons(generatedLessons);

        // Profile
        if (allDecisions.length >= 20) {
          setProfile([
            "Expect negative outcomes more often than they occur",
            "Reflect deeply before making choices",
            "Are slowly calibrating your intuition"
          ]);
        }

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
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] opacity-50">
        <div className="w-16 h-16 border-t-2 border-primary rounded-full animate-spin"></div>
        <p className="mt-8 font-serif italic tracking-wide text-muted-foreground">gathering thoughts...</p>
      </div>
    );
  }

  const getCalibrationLabel = () => {
    const diff = insightStats.avgProbability - insightStats.worstOccurredPercent;
    if (diff > 30) return "Strongly pessimistic";
    if (diff > 10) return "Slightly pessimistic";
    if (diff < -10) return "Slightly optimistic";
    return "Well calibrated";
  };

  return (
    <div className="flex flex-col gap-16 py-8">
      {/* Hero Section */}
      <section className="text-center py-12 md:py-24 flex flex-col items-center animate-fade-in-slow">
        <h1 className="text-4xl md:text-6xl font-light mb-6 text-foreground leading-tight">
          A space for <br className="md:hidden" />
          <span className="italic text-primary/80">considered</span> choices.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl font-light leading-relaxed mb-12">
          Pause, reflect, and record your thought process before making important decisions. 
          Return later to see how things turned out. All stored securely on your device.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/frameworks">
            <a className="group flex items-center justify-center gap-4 bg-primary text-primary-foreground px-8 py-4 rounded-full hover:bg-primary/90 transition-all duration-500 shadow-md hover:shadow-lg hover:-translate-y-1 w-full sm:w-auto" data-testid="link-start-reflection">
              <span className="tracking-wide uppercase text-sm">Log a Decision</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
            </a>
          </Link>
        </div>

        <div className="w-full max-w-lg mx-auto">
          <DailyPredictionWidget />
        </div>
      </section>

      {/* Rhythm Section */}
      {decisions.length > 0 && (
        <section className="animate-fade-in-slow" style={{ animationDelay: '0.15s' }}>
          <MindfulnessRhythm decisions={decisions} />
        </section>
      )}

      {/* Weekly Reflection */}
      {(weeklyStats.created > 0 || weeklyStats.outcomesRecorded > 0) && (
        <section className="animate-fade-in-slow" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-6 text-muted-foreground">
            <Calendar size={18} strokeWidth={1.5} />
            <h2 className="text-sm uppercase tracking-widest font-sans">Weekly Reflection</h2>
          </div>
          
          <div className="p-8 rounded-3xl bg-secondary/20 border border-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="grid grid-cols-2 gap-x-12 gap-y-6 w-full md:w-auto flex-1">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Created</p>
                <p className="text-2xl font-serif">{weeklyStats.created}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Outcomes</p>
                <p className="text-2xl font-serif">{weeklyStats.outcomesRecorded}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Better Than Expected</p>
                <p className="text-2xl font-serif text-primary/80">{weeklyStats.betterThanExpected}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Pending</p>
                <p className="text-2xl font-serif">{weeklyStats.pending}</p>
              </div>
            </div>
            
            <Link href="/journal">
              <a className="shrink-0 w-full md:w-auto px-6 py-3 rounded-full border border-primary/30 text-foreground text-sm tracking-wide uppercase hover:bg-primary/5 transition-colors text-center whitespace-nowrap">
                Review This Week
              </a>
            </Link>
          </div>
        </section>
      )}

      {/* Reminders Section */}
      {pendingOutcomes.length > 0 && (
        <section className="animate-fade-in-slow" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2 mb-6 text-muted-foreground">
            <AlertCircle size={18} strokeWidth={1.5} />
            <h2 className="text-sm uppercase tracking-widest font-sans">Time to Review</h2>
          </div>
          
          <div className="p-6 rounded-2xl bg-card border border-primary/20 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="font-serif text-lg">You planned to review the outcome of {pendingOutcomes.length} decision{pendingOutcomes.length === 1 ? '' : 's'}.</p>
              <p className="text-sm text-muted-foreground font-light mt-1">Recording outcomes helps calibrate your future judgment.</p>
            </div>
            
            <Link href="/journal?filter=review">
              <a className="shrink-0 px-6 py-3 rounded-full bg-primary/10 text-primary text-sm tracking-wide uppercase hover:bg-primary/20 transition-colors whitespace-nowrap" data-testid="button-review-now">
                Review Now
              </a>
            </Link>
          </div>
        </section>
      )}

      {/* Natural Language Insights */}
      {decisions.length > 0 ? (
        <section className="animate-fade-in-slow" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-2 mb-6 text-muted-foreground">
            <Activity size={18} strokeWidth={1.5} />
            <h2 className="text-sm uppercase tracking-widest font-sans">Insights</h2>
          </div>
          
          <div className="space-y-6">
            <div className="p-8 rounded-2xl bg-secondary/30 border border-border/50 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
              <p className="text-xl md:text-2xl font-light leading-relaxed relative z-10 text-foreground/80">
                You have reflected on <span className="font-serif italic text-foreground text-2xl md:text-3xl">{decisions.length}</span> decisions so far. 
                {decisions.filter(d => d.outcomeStatus === 'recorded').length > 0 && (
                  <> You've recorded outcomes for <span className="font-serif italic text-foreground text-2xl md:text-3xl">{decisions.filter(d => d.outcomeStatus === 'recorded').length}</span> of them.</>
                )}
              </p>
            </div>
            
            {decisions.filter(d => d.outcomeStatus === 'recorded').length >= 10 && (
              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 mt-6">
                <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Decision Insight</h3>
                <p className="font-light leading-relaxed text-foreground/80">
                  You predicted negative outcomes with an average probability of {insightStats.avgProbability}%, but only {insightStats.worstOccurredPercent}% of decisions actually turned out worse than expected.
                </p>
              </div>
            )}
            
            {decisions.filter(d => d.outcomeStatus === 'recorded').length >= 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity size={16} className="text-primary/70" />
                    <h3 className="text-sm uppercase tracking-widest text-muted-foreground">Prediction Calibration</h3>
                  </div>
                  <div className="space-y-4 font-light text-foreground/80 text-sm">
                    <p>Average predicted risk: <span className="font-medium">{insightStats.avgProbability}%</span></p>
                    <p>Actual worst outcomes occurred in: <span className="font-medium">{insightStats.worstOccurredPercent}%</span> of decisions.</p>
                    <div className="pt-4 border-t border-border mt-4 flex items-center justify-between">
                      <span className="italic text-xs text-muted-foreground">Interpretation</span>
                      <span className="px-3 py-1 rounded-full bg-secondary text-xs uppercase tracking-widest">{getCalibrationLabel()}</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={16} className="text-primary/70" />
                    <h3 className="text-sm uppercase tracking-widest text-muted-foreground">Confidence Trends</h3>
                  </div>
                  <p className="font-light leading-relaxed text-foreground/80 text-sm">
                    Your average confidence rating when making decisions is 
                    <span className="font-medium text-foreground"> {Math.round(decisions.reduce((acc, d) => acc + d.confidenceRating, 0) / decisions.length)}/10</span>.
                  </p>
                </div>
              </div>
            )}
            
            {/* New Insights Additions */}
            {lessons.length > 0 && (
               <div className="mt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen size={16} className="text-muted-foreground" />
                    <h3 className="text-sm uppercase tracking-widest text-muted-foreground">Decision Lessons</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {lessons.map((lesson, idx) => (
                        <div key={idx} className="p-5 rounded-2xl bg-secondary/10 border border-secondary shadow-sm">
                           <span className="text-[10px] uppercase tracking-widest text-primary/70 mb-2 block">{lesson.type}</span>
                           <p className="font-light text-sm text-foreground/90">{lesson.text}</p>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {randomMemory && (
              <div className="mt-8 p-6 rounded-2xl bg-card border border-border relative overflow-hidden group">
                 <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110"></div>
                 <div className="flex items-center gap-2 mb-4 text-muted-foreground relative z-10">
                    <Lightbulb size={16} className="text-primary/50" />
                    <h3 className="text-xs uppercase tracking-widest">From your journal — {new Date(randomMemory.date).toLocaleDateString()}</h3>
                 </div>
                 <div className="space-y-3 relative z-10">
                   <p className="text-sm"><span className="text-muted-foreground">Decision:</span> <span className="font-serif italic text-base">"{randomMemory.title}"</span></p>
                   <p className="text-sm"><span className="text-muted-foreground">Outcome:</span> {randomMemory.worstOutcomeOccurred ? "Fear realized" : "Better than expected"}</p>
                   <div className="pt-3 mt-3 border-t border-border/50">
                      <p className="font-light text-sm italic text-foreground/80">"Many feared outcomes turn out better than expected."</p>
                   </div>
                 </div>
              </div>
            )}

            {profile && (
              <div className="mt-8 p-8 rounded-3xl bg-secondary/20 border border-border">
                 <div className="flex items-center gap-2 mb-6">
                    <User size={18} className="text-primary/80" />
                    <h3 className="text-sm uppercase tracking-widest text-foreground">Your Decision Profile</h3>
                 </div>
                 <p className="text-muted-foreground font-light mb-4">Based on your journal history, you tend to:</p>
                 <ul className="space-y-3 mb-6">
                   {profile.map((item, idx) => (
                     <li key={idx} className="flex items-start gap-3 text-sm font-light text-foreground/90">
                       <span className="text-primary mt-0.5">•</span>
                       <span>{item}</span>
                     </li>
                   ))}
                 </ul>
                 <div className="pt-4 border-t border-border/50">
                    <p className="italic text-sm text-foreground/80">Recording outcomes consistently helps ground your intuition in reality.</p>
                 </div>
              </div>
            )}

            {milestone && (
              <div className="mt-8 p-6 rounded-2xl bg-primary/10 border border-primary/20 text-center">
                 <h3 className="text-sm uppercase tracking-widest text-primary mb-2">Milestone</h3>
                 <p className="font-serif text-xl mb-2">You have recorded {milestone.count} decisions.</p>
                 <p className="font-light text-foreground/80 mb-4">Your worst-case predictions were accurate only {milestone.accuracy}% of the time.</p>
                 <p className="text-sm italic text-muted-foreground">"Most outcomes turn out better than expected."</p>
              </div>
            )}

          </div>
        </section>
      ) : (
        <section className="text-center py-12 animate-fade-in-slow" style={{ animationDelay: '0.4s' }}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-6">
            <TrendingUp size={24} className="text-muted-foreground" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-2xl mb-4 text-foreground/70">A Blank Canvas</h2>
          <p className="text-muted-foreground font-light max-w-md mx-auto">
            Your insights will appear here once you've recorded a few decisions and their outcomes.
          </p>
        </section>
      )}
    </div>
  );
}
