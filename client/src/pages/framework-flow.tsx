import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { db, Decision } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
// removed unused nudge

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

type Framework = 'standard' | '10-10-10' | 'inversion' | 'fear-setting';

export default function FrameworkFlow() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [category, setCategory] = useState("");
  const [historyPatterns, setHistoryPatterns] = useState<{
    worries: string[],
    guts: string[],
    leanings: string[]
  }>({ worries: [], guts: [], leanings: [] });

  useEffect(() => {
    (async () => {
      const past = await db.getAllDecisions();

      const worries = past
        .map(d => d.worstOutcome)
        .filter((v): v is string => Boolean(v));
      const guts = past
        .map(d => d.gutFeeling)
        .filter((v): v is string => Boolean(v));
      const leanings = past
        .map(d => d.chosenAction)
        .filter((v): v is string => Boolean(v));

      const getTop = (arr: string[]) => {
        const freq: Record<string, number> = {};
        arr.forEach(a => freq[a] = (freq[a] || 0) + 1);
        return Object.entries(freq)
          .sort((a,b) => b[1] - a[1])
          .map(([k]) => k)
          .slice(0, 2);
      };

      setHistoryPatterns({
        worries: getTop(worries),
        guts: getTop(guts),
        leanings: getTop(leanings)
      });
    })();
  }, []);
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


  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      return updated;
    });
  };

  const handleFrameworkSelect = (fw: Framework) => {
    setSelectedFramework(fw);
  };


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
        chosenAction: formData.chosenAction,
        confidenceRating: formData.confidenceRating,
        date: Date.now(),
        outcomeStatus: 'pending'
      };

      await db.saveDecision(newDecision);

      // --- Fetch recent history for pattern awareness ---
      const past = await db.getAllDecisions();
      const recent = past.slice(0, 5);

      const sameFearCount = recent.filter(
        (d: any) =>
          d.worstOutcome &&
          formData.worstCase &&
          d.worstOutcome.toLowerCase().includes(formData.worstCase.toLowerCase())
      ).length;

      // --- Varied instant insights ---
      const templatesBoth = [
        (w: string, g: string) => `You expect "${w}" — yet you’re pulled toward "${g}". Notice the gap.`,
        (w: string, g: string) => `Fear says "${w}", instinct says "${g}". Which one usually proves right?`,
        (w: string, g: string) => `You’re weighing "${w}" against "${g}". Track what actually happens.`,
      ];

      const templatesWorst = [
        (w: string) => `You’re anticipating "${w}". Keep an eye on how often this occurs.`,
        (w: string) => `Noting "${w}" as worst case. Reality may be kinder than this.`,
        (w: string) => `You named "${w}". Check back later—does it unfold this way?`,
      ];

      const templatesGeneric = [
        () => `Captured. Return later and compare expectation vs reality.`,
        () => `Logged. This becomes data for your future decisions.`,
        () => `Noted. Patterns emerge when you revisit outcomes.`,
      ];

      // deterministic pick (based on description length)
      const pick = (arr: any[]) => arr[Math.abs((formData.decisionDescription || "").length) % arr.length];

      let insight = "";

      if (formData.worstCase && formData.gutFeeling) {
        insight = pick(templatesBoth)(formData.worstCase, formData.gutFeeling);
      } else if (formData.worstCase) {
        insight = pick(templatesWorst)(formData.worstCase);
      } else {
        insight = pick(templatesGeneric)();
      }

      // --- Add pattern awareness layer ---
      if (sameFearCount >= 2 && formData.worstCase) {
        insight += ` This concern has appeared ${sameFearCount} times recently.`;
      }

      toast({
        title: "Saved",
        description: insight,
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

  const worryMap: Record<string, string[]> = {
    "Career move": [
      "Making the wrong choice",
      "Career stagnation",
      "Workplace conflict",
      "Losing opportunity"
    ],
    "Relationship decision": [
      "Regret later",
      "Hurting someone",
      "Being alone",
      "Making a mistake"
    ],
    "Money decision": [
      "Losing money",
      "Bad investment",
      "Financial instability",
      "Unexpected loss"
    ],
    "Health decision": [
      "Making it worse",
      "Wrong treatment",
      "Long-term impact",
      "Uncertainty"
    ],
    "Something unclear": [
      "Confusion",
      "Lack of clarity",
      "Overthinking",
      "Fear of unknown"
    ]
  };

  const gutMap: Record<string, string[]> = {
    "Career move": [
      "Growth opportunity",
      "Long-term potential",
      "Feels aligned",
      "Better environment"
    ],
    "Relationship decision": [
      "Emotional connection",
      "Peace of mind",
      "Feels right",
      "Mutual understanding"
    ],
    "Money decision": [
      "Financial security",
      "Good opportunity",
      "Smart move",
      "Long-term benefit"
    ],
    "Health decision": [
      "Better well-being",
      "Peace of mind",
      "Feels safe",
      "Long-term health"
    ],
    "Something unclear": [
      "Feels right",
      "Less stress",
      "Curiosity",
      "Inner clarity"
    ]
  };

  const leaningMap: Record<string, string[]> = {
    "Career move": [
      "Leaning toward it",
      "Holding for better option",
      "Wait and evaluate",
      "Need more clarity"
    ],
    "Relationship decision": [
      "Leaning toward it",
      "Leaning away",
      "Wait and reflect",
      "Still unsure"
    ],
    "Money decision": [
      "Proceed cautiously",
      "Hold off",
      "Wait and see",
      "Need more data"
    ],
    "Health decision": [
      "Proceed with care",
      "Delay decision",
      "Seek more advice",
      "Still unsure"
    ],
    "Something unclear": [
      "Leaning toward it",
      "Leaning against it",
      "Wait and see",
      "Still unsure"
    ]
  };

  // Helper for smarter chip blending (context + history, balanced)
  const getSmartChips = (base: string[], history: string[]) => {
    const uniqueHistory = history.filter(h => !base.includes(h));

    const result: string[] = [];

    // Take 2 strong contextual (base)
    result.push(...base.slice(0, 2));

    // Add up to 2 from history
    result.push(...uniqueHistory.slice(0, 2));

    // Fill remaining from base
    for (const item of base) {
      if (result.length >= 4) break;
      if (!result.includes(item)) {
        result.push(item);
      }
    }

    return result.slice(0, 4);
  };

  return (
    <div className="flex flex-col gap-8 py-8 max-w-2xl mx-auto w-full animate-fade-in-slow pb-32">
      
      <div className="flex items-center justify-between mb-4 text-sm uppercase tracking-widest text-muted-foreground">
        <button 
          onClick={() => setLocation('/')}
          className="flex items-center gap-2 hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="space-y-8">
        
        <h2 className="text-3xl md:text-4xl font-serif">
          What decision are you facing?
        </h2>

        {/* Quick chips */}
        <div className="flex flex-wrap gap-2">
          {[
            "Career move",
            "Relationship decision",
            "Money decision",
            "Health decision",
            "Something unclear"
          ].map((chip) => (
            <button
              key={chip}
              onClick={() => {
                setCategory(chip);
                setFormData((prev) => ({
                  ...prev,
                  decisionDescription: chip
                }));
              }}
              className={`px-4 py-2 rounded-full text-sm border transition ${
                formData.decisionDescription === chip
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 border-border hover:bg-primary/10"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

        <textarea 
          name="decisionDescription"
          value={formData.decisionDescription}
          onChange={handleChange}
          placeholder="Describe it briefly..."
          className="w-full p-6 rounded-2xl bg-card border border-border outline-none min-h-[140px] text-base"
        />

        <div>
          <h3 className="text-lg font-medium mb-2">What’s the main worry here?</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {getSmartChips(
              worryMap[category] || [
                "Making the wrong choice",
                "Regret later",
                "Losing money"
              ],
              historyPatterns.worries
            ).map((chip) => (
              <button
                key={chip}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    worstCase: chip
                  }))
                }
                className={`px-3 py-1.5 rounded-full text-xs border transition ${
                  formData.worstCase === chip
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 border-border hover:bg-primary/10"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
          <textarea 
            name="worstCase"
            value={formData.worstCase}
            onChange={handleChange}
            placeholder="Worst case..."
            className="w-full p-5 rounded-2xl bg-card border border-border outline-none min-h-[100px]"
          />
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">What pulls you toward this?</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {getSmartChips(
              gutMap[category] || [
                "Peace of mind",
                "Long-term growth",
                "Feels right",
                "Less stress"
              ],
              historyPatterns.guts
            ).map((chip) => (
              <button
                key={chip}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    gutFeeling: chip
                  }))
                }
                className={`px-3 py-1.5 rounded-full text-xs border transition ${
                  formData.gutFeeling === chip
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 border-border hover:bg-primary/10"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
          <textarea 
            name="gutFeeling"
            value={formData.gutFeeling}
            onChange={handleChange}
            placeholder="Your instinct..."
            className="w-full p-5 rounded-2xl bg-card border border-border outline-none min-h-[100px]"
          />
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">What are you leaning toward? (optional)</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {getSmartChips(
              leaningMap[category] || [
                "Leaning toward it",
                "Leaning against it",
                "Wait and see",
                "Still unsure"
              ],
              historyPatterns.leanings
            ).map((chip) => (
              <button
                key={chip}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    chosenAction: chip
                  }))
                }
                className={`px-3 py-1.5 rounded-full text-xs border transition ${
                  formData.chosenAction === chip
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 border-border hover:bg-primary/10"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
          <textarea 
            name="chosenAction"
            value={formData.chosenAction}
            onChange={handleChange}
            placeholder="You don’t have to be certain… just what feels likely right now."
            className="w-full p-5 rounded-2xl bg-card border border-border outline-none min-h-[100px]"
          />
        </div>

        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSave}
            disabled={!formData.decisionDescription.trim()}
            className="px-8 py-4 rounded-full bg-primary text-primary-foreground text-sm uppercase tracking-widest hover:bg-primary/90 transition disabled:opacity-50"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}