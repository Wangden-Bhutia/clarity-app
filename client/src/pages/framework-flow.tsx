import { useState, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { ArrowLeft, ArrowRight, Save, LayoutTemplate, Zap, Clock, ShieldAlert } from "lucide-react";
import { db, Decision } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { getPreDecisionNudge } from "@/lib/nudge";

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

type Framework = 'standard' | '10-10-10' | 'inversion' | 'fear-setting';

export default function FrameworkFlow() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [selectedFramework, setSelectedFramework] = useState<Framework>('standard');
  
  const [formData, setFormData] = useState({
    decisionDescription: "",
    // Standard
    options: "",
    gutFeeling: "",
    // 10-10-10
    tenDays: "",
    tenMonths: "",
    tenYears: "",
    // Inversion
    guaranteedFailure: "",
    avoidancePlan: "",
    // Fear Setting
    worstCase: "",
    prevention: "",
    repair: "",
    // Common
    worstOutcomeProbability: 50,
    chosenAction: "",
    confidenceRating: 5
  });

  // Keep a single reference to the nudge
  const nudgeMessage = useMemo(() => getPreDecisionNudge(), []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFrameworkSelect = (fw: Framework) => {
    setSelectedFramework(fw);
    setStep(1);
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleSave = async () => {
    if (!formData.decisionDescription) return;

    try {
      // Map framework-specific fields back to our standard Decision interface
      let options = formData.options;
      let fears = "";
      let hopes = "";
      let recoveryPlan = "";
      let gutFeeling = formData.gutFeeling;
      let worstOutcome = "";

      if (selectedFramework === '10-10-10') {
        options = "Used 10-10-10 Framework";
        fears = `In 10 days: ${formData.tenDays}`;
        hopes = `In 10 years: ${formData.tenYears}`;
        recoveryPlan = `In 10 months: ${formData.tenMonths}`;
      } else if (selectedFramework === 'inversion') {
        options = "Used Inversion Framework";
        worstOutcome = formData.guaranteedFailure;
        recoveryPlan = formData.avoidancePlan;
      } else if (selectedFramework === 'fear-setting') {
        options = "Used Fear-Setting Framework";
        worstOutcome = formData.worstCase;
        recoveryPlan = `Prevention: ${formData.prevention}\n\nRepair: ${formData.repair}`;
      }

      const newDecision: Decision = {
        id: generateId(),
        decisionDescription: formData.decisionDescription,
        title: formData.decisionDescription.split('.')[0].substring(0, 50) + (formData.decisionDescription.length > 50 ? '...' : ''),
        worstOutcome,
        worstOutcomeProbability: formData.worstOutcomeProbability,
        category: "Framework",
        options,
        fears,
        hopes,
        gutFeeling,
        recoveryPlan,
        chosenAction: formData.chosenAction || "To be determined...",
        confidenceRating: formData.confidenceRating,
        date: Date.now(),
        outcomeStatus: 'pending'
      };

      await db.saveDecision(newDecision);
      
      toast({
        title: "Decision Saved",
        description: "Your reflection has been recorded.",
      });
      
      setLocation(`/decision/${newDecision.id}`);
    } catch (error) {
      console.error("Error saving decision:", error);
      toast({
        title: "Error",
        description: "Could not save. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col gap-8 py-8 max-w-2xl mx-auto w-full animate-fade-in-slow min-h-[70vh]">
      <div className="flex items-center justify-between mb-4 text-sm uppercase tracking-widest text-muted-foreground">
        <button 
          onClick={step === 0 ? () => setLocation('/') : handleBack}
          className="flex items-center gap-2 hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <span className="font-mono text-xs bg-secondary/50 px-3 py-1 rounded-full">
          {step === 0 ? "Choose Framework" : "Step " + step}
        </span>
      </div>

      {step === 0 && (
        <div className="space-y-8 animate-fade-in">
          <header className="mb-8">
            <h2 className="text-3xl md:text-4xl font-serif mb-4">Choose a Thinking Tool</h2>
            <p className="text-muted-foreground font-light text-lg">Different decisions require different lenses. How would you like to think about this?</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => handleFrameworkSelect('standard')}
              className="text-left p-6 rounded-3xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-md group"
            >
              <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <LayoutTemplate size={20} />
              </div>
              <h3 className="font-serif text-xl mb-2">Deep Reflection</h3>
              <p className="text-sm font-light text-muted-foreground">The classic Clarity flow. Weigh options, fears, and hopes in a balanced way.</p>
            </button>

            <button 
              onClick={() => setLocation('/quick-flow')}
              className="text-left p-6 rounded-3xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-md group"
            >
              <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <Zap size={20} />
              </div>
              <h3 className="font-serif text-xl mb-2">Quick Log</h3>
              <p className="text-sm font-light text-muted-foreground">Short on time? Just log the decision and your worst fear. Fill the rest later.</p>
            </button>

            <button 
              onClick={() => handleFrameworkSelect('10-10-10')}
              className="text-left p-6 rounded-3xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-md group"
            >
              <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <Clock size={20} />
              </div>
              <h3 className="font-serif text-xl mb-2">10-10-10 Rule</h3>
              <p className="text-sm font-light text-muted-foreground">Best for emotional decisions. How will you feel about this in 10 days, 10 months, and 10 years?</p>
            </button>

            <button 
              onClick={() => handleFrameworkSelect('fear-setting')}
              className="text-left p-6 rounded-3xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-md group"
            >
              <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <ShieldAlert size={20} />
              </div>
              <h3 className="font-serif text-xl mb-2">Fear-Setting</h3>
              <p className="text-sm font-light text-muted-foreground">Best for risky choices. Define the nightmare, how to prevent it, and how to repair it.</p>
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-8 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-serif">What decision are you facing right now?</h2>
          <textarea 
            name="decisionDescription"
            value={formData.decisionDescription}
            onChange={handleChange}
            placeholder="Briefly describe the situation..."
            className="w-full p-6 rounded-3xl bg-card border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all min-h-[200px] resize-none text-xl font-light"
            autoFocus
          ></textarea>
          <div className="flex justify-end">
            <button 
              onClick={selectedFramework === 'standard' ? () => setLocation('/flow') : handleNext}
              disabled={!formData.decisionDescription.trim()}
              className="px-8 py-4 rounded-full bg-foreground text-background font-medium tracking-widest uppercase text-sm hover:bg-foreground/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Next <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* --- 10-10-10 FRAMEWORK --- */}
      {selectedFramework === '10-10-10' && step === 2 && (
        <div className="space-y-8 animate-fade-in">
          <header className="mb-8">
            <span className="text-xs uppercase tracking-widest text-primary mb-2 block">10-10-10 Rule</span>
            <h2 className="text-3xl md:text-4xl font-serif">Time travel.</h2>
            <p className="text-muted-foreground font-light mt-2">How will you feel about this choice over time?</p>
          </header>
          
          <div className="space-y-6">
            <div>
              <label className="text-sm uppercase tracking-widest text-foreground/70 ml-2 mb-2 block">In 10 Days...</label>
              <textarea 
                name="tenDays"
                value={formData.tenDays}
                onChange={handleChange}
                placeholder="What will the immediate aftermath feel like?"
                className="w-full p-4 rounded-2xl bg-secondary/30 border border-border focus:border-primary/50 outline-none transition-all min-h-[100px] resize-none font-light"
              ></textarea>
            </div>
            <div>
              <label className="text-sm uppercase tracking-widest text-foreground/70 ml-2 mb-2 block">In 10 Months...</label>
              <textarea 
                name="tenMonths"
                value={formData.tenMonths}
                onChange={handleChange}
                placeholder="How will this look in hindsight?"
                className="w-full p-4 rounded-2xl bg-secondary/30 border border-border focus:border-primary/50 outline-none transition-all min-h-[100px] resize-none font-light"
              ></textarea>
            </div>
            <div>
              <label className="text-sm uppercase tracking-widest text-foreground/70 ml-2 mb-2 block">In 10 Years...</label>
              <textarea 
                name="tenYears"
                value={formData.tenYears}
                onChange={handleChange}
                placeholder="Will this still matter? How will it shape your story?"
                className="w-full p-4 rounded-2xl bg-secondary/30 border border-border focus:border-primary/50 outline-none transition-all min-h-[100px] resize-none font-light"
              ></textarea>
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleNext} className="px-8 py-4 rounded-full bg-foreground text-background font-medium tracking-widest uppercase text-sm hover:bg-foreground/90 transition-all flex items-center gap-2">
              Next <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* --- INVERSION FRAMEWORK --- */}
      {selectedFramework === 'inversion' && step === 2 && (
        <div className="space-y-8 animate-fade-in">
          <header className="mb-8">
            <span className="text-xs uppercase tracking-widest text-primary mb-2 block">Inversion</span>
            <h2 className="text-3xl md:text-4xl font-serif">Reverse the problem.</h2>
          </header>
          
          <div className="space-y-8">
            <div>
              <label className="text-sm uppercase tracking-widest text-destructive/80 ml-2 mb-2 block">What would guarantee failure?</label>
              <p className="text-xs text-muted-foreground ml-2 mb-2">If you wanted to completely ruin this situation, what exactly would you do?</p>
              <textarea 
                name="guaranteedFailure"
                value={formData.guaranteedFailure}
                onChange={handleChange}
                placeholder="List the exact steps to cause a disaster..."
                className="w-full p-4 rounded-2xl bg-destructive/5 border border-destructive/20 focus:border-destructive/50 outline-none transition-all min-h-[150px] resize-none font-light"
              ></textarea>
            </div>
            <div>
              <label className="text-sm uppercase tracking-widest text-primary/80 ml-2 mb-2 block">How do you avoid that?</label>
              <p className="text-xs text-muted-foreground ml-2 mb-2">Now, look at your list above. Your plan is simply to avoid doing those things.</p>
              <textarea 
                name="avoidancePlan"
                value={formData.avoidancePlan}
                onChange={handleChange}
                placeholder="What actions ensure you avoid the disaster?"
                className="w-full p-4 rounded-2xl bg-primary/5 border border-primary/20 focus:border-primary/50 outline-none transition-all min-h-[150px] resize-none font-light"
              ></textarea>
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleNext} className="px-8 py-4 rounded-full bg-foreground text-background font-medium tracking-widest uppercase text-sm hover:bg-foreground/90 transition-all flex items-center gap-2">
              Next <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* --- FEAR SETTING FRAMEWORK --- */}
      {selectedFramework === 'fear-setting' && step === 2 && (
        <div className="space-y-8 animate-fade-in">
          <header className="mb-8">
            <span className="text-xs uppercase tracking-widest text-primary mb-2 block">Fear-Setting</span>
            <h2 className="text-3xl md:text-4xl font-serif">Define the nightmare.</h2>
          </header>
          
          <div className="space-y-6">
            <div>
              <label className="text-sm uppercase tracking-widest text-foreground/70 ml-2 mb-2 block">The Nightmare</label>
              <textarea 
                name="worstCase"
                value={formData.worstCase}
                onChange={handleChange}
                placeholder="What is the absolute worst thing that could happen if you take this risk?"
                className="w-full p-4 rounded-2xl bg-secondary/30 border border-border focus:border-primary/50 outline-none transition-all min-h-[100px] resize-none font-light"
              ></textarea>
            </div>
            <div>
              <label className="text-sm uppercase tracking-widest text-foreground/70 ml-2 mb-2 block">Prevention</label>
              <textarea 
                name="prevention"
                value={formData.prevention}
                onChange={handleChange}
                placeholder="What could you do to prevent that from happening?"
                className="w-full p-4 rounded-2xl bg-secondary/30 border border-border focus:border-primary/50 outline-none transition-all min-h-[100px] resize-none font-light"
              ></textarea>
            </div>
            <div>
              <label className="text-sm uppercase tracking-widest text-foreground/70 ml-2 mb-2 block">Repair</label>
              <textarea 
                name="repair"
                value={formData.repair}
                onChange={handleChange}
                placeholder="If the worst did happen, how could you fix it or recover?"
                className="w-full p-4 rounded-2xl bg-secondary/30 border border-border focus:border-primary/50 outline-none transition-all min-h-[100px] resize-none font-light"
              ></textarea>
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleNext} className="px-8 py-4 rounded-full bg-foreground text-background font-medium tracking-widest uppercase text-sm hover:bg-foreground/90 transition-all flex items-center gap-2">
              Next <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* FINAL COMMON STEP */}
      {step === 3 && (
        <div className="space-y-12 animate-fade-in">
          <header className="mb-8">
            <h2 className="text-3xl md:text-4xl font-serif">Synthesize.</h2>
            <p className="text-muted-foreground font-light mt-2">Based on your reflection, what will you do?</p>
          </header>
          
          <div className="space-y-8">
            <div>
              <label className="text-sm uppercase tracking-widest text-foreground/70 ml-2 mb-2 block">The Action</label>
              <textarea 
                name="chosenAction"
                value={formData.chosenAction}
                onChange={handleChange}
                placeholder="I have decided to..."
                className="w-full p-6 rounded-3xl bg-card border border-primary/30 focus:border-primary outline-none transition-all min-h-[150px] resize-none text-xl font-serif"
              ></textarea>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex justify-between items-end">
                <label className="text-sm uppercase tracking-widest text-foreground/70 ml-2">How confident are you?</label>
                <span className="font-mono text-xl text-primary/80">{formData.confidenceRating}/10</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                name="confidenceRating"
                value={formData.confidenceRating}
                onChange={handleChange}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground font-light">
                <span>Unsure</span>
                <span>Certain</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-8">
            <button 
              onClick={handleSave}
              className="px-10 py-5 rounded-full bg-foreground text-background font-medium tracking-widest uppercase text-sm hover:bg-foreground/90 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              <Save size={18} /> Save Reflection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}