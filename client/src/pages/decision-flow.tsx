import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, CheckCircle, Save } from "lucide-react";
import { db, Decision } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";
import { getPreDecisionNudge } from "@/lib/nudge";

// Generate a random ID since we aren't using uuid directly to avoid dependencies
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

type FlowStep = 'pause' | 'context' | 'fears' | 'hopes' | 'plan' | 'action';

export default function DecisionFlow() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [step, setStep] = useState<FlowStep>('pause');
  const [pauseTimeLeft, setPauseTimeLeft] = useState(30);
  const [isPauseActive, setIsPauseActive] = useState(false);
  const [pauseEnabled, setPauseEnabled] = useState(true);
  
  const [formData, setFormData] = useState({
    decisionDescription: "",
    title: "",
    category: "",
    importanceLevel: "Medium" as any,
    options: "",
    fears: "",
    worstOutcome: "",
    worstOutcomeProbability: 50,
    hopes: "",
    gutFeeling: "",
    recoveryPlan: "",
    chosenAction: "",
    confidenceRating: 5,
    reviewDateOption: "1 week",
    customReviewDate: ""
  });

  const [delayedNudge, setDelayedNudge] = useState<string | null>(null);
  useEffect(() => {
    setDelayedNudge(null);

    const timeout = setTimeout(() => {
      const nudge = getPreDecisionNudge(formData.worstOutcomeProbability);
      setDelayedNudge(nudge);
    }, 600);

    return () => clearTimeout(timeout);
  }, [formData.worstOutcomeProbability]);

  useEffect(() => {
    // Check if pause is enabled in settings
    db.getSetting('enablePause', true).then(enabled => {
      setPauseEnabled(enabled);
      if (!enabled) {
        setStep('context');
      }
    });
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPauseActive && pauseTimeLeft > 0) {
      interval = setInterval(() => {
        setPauseTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isPauseActive && pauseTimeLeft === 0) {
      setIsPauseActive(false);
      setStep('context');
    }
    return () => clearInterval(interval);
  }, [isPauseActive, pauseTimeLeft]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, confidenceRating: parseInt(e.target.value) }));
  };

  const startPause = () => {
    setIsPauseActive(true);
  };

  const skipPause = () => {
    setIsPauseActive(false);
    setStep('context');
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast({
        title: "Missing Title",
        description: "Please provide a brief summary of what you're deciding.",
        variant: "destructive"
      });
      return;
    }

    try {
      let reviewDate = Date.now() + 7 * 24 * 60 * 60 * 1000; // default 1 week
      if (formData.reviewDateOption === "3 days") {
        reviewDate = Date.now() + 3 * 24 * 60 * 60 * 1000;
      } else if (formData.reviewDateOption === "1 month") {
        reviewDate = Date.now() + 30 * 24 * 60 * 60 * 1000;
      } else if (formData.reviewDateOption === "Custom date" && formData.customReviewDate) {
        reviewDate = new Date(formData.customReviewDate).getTime();
      }

      const { reviewDateOption, customReviewDate, ...decisionData } = formData;
      
      const newDecision: Decision = {
        id: generateId(),
        ...decisionData,
        reviewDate,
        date: Date.now(),
        outcomeStatus: 'pending'
      };

      await db.saveDecision(newDecision);
      
      toast({
        title: "Reflection Saved",
        description: "Your decision process has been recorded securely.",
      });
      
      setLocation(`/decision/${newDecision.id}`);
    } catch (error) {
      console.error("Error saving decision:", error);
      toast({
        title: "Error",
        description: "Could not save your reflection. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Render different steps
  if (step === 'pause') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto min-h-[70vh]">
        <h1 className="text-3xl font-serif mb-8 text-foreground/80">Before we begin...</h1>
        
        <div className={`relative w-48 h-48 rounded-full border border-primary/20 flex items-center justify-center mb-12 transition-all duration-[3000ms] ${isPauseActive ? 'scale-110 bg-primary/5 shadow-[0_0_40px_rgba(var(--primary),0.1)]' : ''}`}>
          <div className={`absolute inset-0 rounded-full border border-primary/40 ${isPauseActive ? 'animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]' : ''}`}></div>
          <span className="text-4xl font-light text-primary/70">{pauseTimeLeft}</span>
        </div>
        
        {!isPauseActive ? (
          <div className="space-y-4 w-full">
            <button 
              onClick={startPause}
              className="w-full py-4 rounded-full bg-primary text-primary-foreground tracking-widest uppercase text-sm hover:bg-primary/90 transition-colors"
            >
              Take 30 Seconds to Breathe
            </button>
            <button 
              onClick={skipPause}
              className="w-full py-4 rounded-full text-muted-foreground tracking-widest uppercase text-sm hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              Skip
            </button>
          </div>
        ) : (
          <p className="font-serif italic text-muted-foreground text-xl tracking-wide animate-pulse">
            Breathe in... Breathe out...
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col gap-8 py-8 max-w-2xl mx-auto w-full animate-fade-in-slow">
      {/* Progress Header */}
      <div className="flex items-center justify-between mb-8 text-sm uppercase tracking-widest text-muted-foreground">
        <button 
          onClick={() => {
            if (step === 'context') setLocation('/');
            else if (step === 'fears') setStep('context');
            else if (step === 'hopes') setStep('fears');
            else if (step === 'plan') setStep('hopes');
            else if (step === 'action') setStep('plan');
          }}
          className="flex items-center gap-2 hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <span className="font-mono text-xs bg-secondary/50 px-3 py-1 rounded-full">
          {step === 'context' ? '1/5' : step === 'fears' ? '2/5' : step === 'hopes' ? '3/5' : step === 'plan' ? '4/5' : '5/5'}
        </span>
      </div>

      {/* Step 1: Context */}
      {step === 'context' && (
        <div className="space-y-8 animate-slide-up-slow">
          <header>
            <h2 className="text-3xl font-serif mb-2">What is the decision?</h2>
            <p className="text-muted-foreground font-light">Define clearly what you are choosing between.</p>
          </header>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm uppercase tracking-widest text-foreground/70 ml-2">What decision are you currently facing?</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {[
                  "Career decision",
                  "Relationship choice",
                  "Money matter",
                  "Health decision",
                  "Something else"
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, decisionDescription: preset }))}
                    className="px-3 py-1 rounded-full text-xs bg-secondary/60 hover:bg-secondary transition"
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <textarea 
                name="decisionDescription"
                value={formData.decisionDescription}
                onChange={handleChange}
                placeholder="Describe the situation..."
                className="w-full p-4 rounded-2xl bg-card border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all min-h-[100px] resize-none text-lg font-serif"
                data-testid="input-description"
              ></textarea>
            </div>

            <div className="space-y-2">
              <label className="text-sm uppercase tracking-widest text-foreground/70 ml-2">Brief Summary (Title)</label>
              <input 
                type="text" 
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Short label (optional)"
                className="w-full p-4 rounded-2xl bg-card border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all text-lg font-serif"
                data-testid="input-title"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm uppercase tracking-widest text-foreground/70 ml-2">Category</label>
              <select 
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-4 rounded-2xl bg-card border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all appearance-none"
              >
                <option value="">Select a category (optional)</option>
                <option value="Career">Career & Work</option>
                <option value="Relationships">Relationships</option>
                <option value="Financial">Financial</option>
                <option value="Health">Health & Wellbeing</option>
                <option value="Living Situation">Living Situation</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm uppercase tracking-widest text-foreground/70 ml-2">Importance</label>
              <div className="flex gap-2">
                {['Low', 'Medium', 'High', 'Major'].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, importanceLevel: level as any }))}
                    className={`flex-1 py-3 rounded-xl border text-sm transition-colors ${formData.importanceLevel === level ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border hover:border-primary/50 text-foreground/70'}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm uppercase tracking-widest text-foreground/70 ml-2">What are the options?</label>
              <textarea 
                name="options"
                value={formData.options}
                onChange={handleChange}
                placeholder="List the realistic options you are considering..."
                className="w-full p-4 rounded-2xl bg-card border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all min-h-[150px] resize-none font-light leading-relaxed"
              ></textarea>
            </div>
          </div>

          <button 
            onClick={() => setStep('fears')}
            disabled={!formData.decisionDescription && !formData.title}
            className="w-full py-4 mt-8 rounded-full bg-primary text-primary-foreground tracking-widest uppercase text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Explore Fears <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Step 2: Fears */}
      {step === 'fears' && (
        <div className="space-y-8 animate-slide-up-slow">
          <header>
            <h2 className="text-3xl font-serif mb-2">Facing the negative</h2>
            <p className="text-muted-foreground font-light">Acknowledge your anxieties to disarm them.</p>
          </header>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm uppercase tracking-widest text-foreground/70 ml-2">What are you afraid of?</label>
              <textarea 
                name="fears"
                value={formData.fears}
                onChange={handleChange}
                placeholder="If I choose X, I'm worried that..."
                className="w-full p-4 rounded-2xl bg-card border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all min-h-[120px] resize-none font-light leading-relaxed"
              ></textarea>
            </div>

            <div className="space-y-2">
              <label className="text-sm uppercase tracking-widest text-foreground/70 ml-2">What is the absolute worst outcome?</label>
              <textarea 
                name="worstOutcome"
                value={formData.worstOutcome}
                onChange={handleChange}
                placeholder="Realistically, what is the worst thing that could actually happen?"
                className="w-full p-4 rounded-2xl bg-card border border-destructive/20 focus:border-destructive/50 focus:ring-1 focus:ring-destructive/50 outline-none transition-all min-h-[120px] resize-none font-light leading-relaxed"
              ></textarea>
            </div>
            
            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-end">
                <label className="text-sm uppercase tracking-widest text-foreground/70 ml-2">How likely do you think this worst outcome is?</label>
                <span className="font-mono text-xl text-destructive/80">{formData.worstOutcomeProbability}%</span>
              </div>
              {delayedNudge && (
                <p className="text-xs text-muted-foreground/60 ml-2 font-light italic animate-fade-in-slow">{delayedNudge}</p>
              )}
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="25"
                name="worstOutcomeProbability"
                value={formData.worstOutcomeProbability}
                onChange={(e) => setFormData(prev => ({ ...prev, worstOutcomeProbability: parseInt(e.target.value) }))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-destructive"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                <span>0% — Impossible</span>
                <span>25% — Unlikely</span>
                <span>50% — Possible</span>
                <span>75% — Likely</span>
                <span>100% — Certain</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setStep('hopes')}
            className="w-full py-4 mt-8 rounded-full bg-primary text-primary-foreground tracking-widest uppercase text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            Explore Hopes <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Step 3: Hopes */}
      {step === 'hopes' && (
        <div className="space-y-8 animate-slide-up-slow">
          <header>
            <h2 className="text-3xl font-serif mb-2">Envisioning the positive</h2>
            <p className="text-muted-foreground font-light">What does success look like?</p>
          </header>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm uppercase tracking-widest text-foreground/70 ml-2">What are you hoping for?</label>
              <textarea 
                name="hopes"
                value={formData.hopes}
                onChange={handleChange}
                placeholder="If things go well, I hope that..."
                className="w-full p-4 rounded-2xl bg-card border border-primary/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all min-h-[120px] resize-none font-light leading-relaxed"
              ></textarea>
            </div>

            <div className="space-y-2">
              <label className="text-sm uppercase tracking-widest text-foreground/70 ml-2">What does your gut say?</label>
              <textarea 
                name="gutFeeling"
                value={formData.gutFeeling}
                onChange={handleChange}
                placeholder="Ignoring logic for a moment, what feels right?"
                className="w-full p-4 rounded-2xl bg-card border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all min-h-[120px] resize-none font-light leading-relaxed"
              ></textarea>
            </div>
          </div>

          <button 
            onClick={() => setStep('plan')}
            className="w-full py-4 mt-8 rounded-full bg-primary text-primary-foreground tracking-widest uppercase text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            Make a Plan <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Step 4: Recovery Plan */}
      {step === 'plan' && (
        <div className="space-y-8 animate-slide-up-slow">
          <header>
            <h2 className="text-3xl font-serif mb-2">Building resilience</h2>
            <p className="text-muted-foreground font-light">How will you handle it if the worst happens?</p>
          </header>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-secondary/30 border border-border/50">
              <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-2">Your Worst Case Scenario</h3>
              <p className="font-light italic text-foreground/80">{formData.worstOutcome || "(You didn't specify a worst outcome)"}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm uppercase tracking-widest text-foreground/70 ml-2">Your Recovery Plan</label>
              <textarea 
                name="recoveryPlan"
                value={formData.recoveryPlan}
                onChange={handleChange}
                placeholder="If the worst happens, what steps will I take to recover? Who can I ask for help?"
                className="w-full p-4 rounded-2xl bg-card border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all min-h-[200px] resize-none font-light leading-relaxed"
              ></textarea>
            </div>
          </div>

          <button 
            onClick={() => setStep('action')}
            className="w-full py-4 mt-8 rounded-full bg-primary text-primary-foreground tracking-widest uppercase text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            Final Decision <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Step 5: Final Action */}
      {step === 'action' && (
        <div className="space-y-8 animate-slide-up-slow">
          <header>
            <h2 className="text-3xl font-serif mb-2">The Choice</h2>
            <p className="text-muted-foreground font-light">Commit to a path forward.</p>
          </header>

          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-sm uppercase tracking-widest text-foreground/70 ml-2">What action are you taking?</label>
              <textarea 
                name="chosenAction"
                value={formData.chosenAction}
                onChange={handleChange}
                placeholder="I have decided to..."
                className="w-full p-4 rounded-2xl bg-card border border-primary/30 focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all min-h-[120px] resize-none text-lg font-serif"
                data-testid="input-action"
              ></textarea>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-sm uppercase tracking-widest text-foreground/70 ml-2">Confidence Level</label>
                <span className="font-mono text-xl text-primary">{formData.confidenceRating}/10</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={formData.confidenceRating}
                onChange={handleSliderChange}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>Uncertain</span>
                <span>Absolute Certainty</span>
              </div>
            </div>
            <div className="space-y-4 pt-8 border-t border-border">
              <h3 className="text-xl font-serif text-foreground/80">Future Review</h3>
              
              <div className="space-y-2">
                <label className="text-sm uppercase tracking-widest text-foreground/70 ml-2">When should you review the outcome of this decision?</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['3 days', '1 week', '1 month', 'Custom date'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, reviewDateOption: opt }))}
                      className={`py-3 rounded-xl border text-sm transition-colors ${formData.reviewDateOption === opt ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border hover:border-primary/50 text-foreground/70'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {formData.reviewDateOption === 'Custom date' && (
                <div className="space-y-2 pt-2 animate-fade-in-slow">
                  <label className="text-sm uppercase tracking-widest text-foreground/70 ml-2">Select Date</label>
                  <input 
                    type="date" 
                    name="customReviewDate"
                    value={formData.customReviewDate}
                    onChange={handleChange}
                    className="w-full p-4 rounded-2xl bg-card border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all font-sans"
                  />
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={!formData.chosenAction}
            className="w-full py-5 mt-8 rounded-full bg-foreground text-background font-medium tracking-widest uppercase text-sm hover:bg-foreground/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-1"
            data-testid="button-save-reflection"
          >
            <Save size={18} /> Record Decision
          </button>
        </div>
      )}
    </div>
  );
}
