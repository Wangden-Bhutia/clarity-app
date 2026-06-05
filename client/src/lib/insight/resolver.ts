import { InsightArchetype } from "./archetypes";
import { getLearningData } from "../learningStore";

type ResolveInput = {
  category?: string;
  worry?: string;
  pull?: string;
  action?: string;
  importance?: string;
  probability?: string;
};


type ScoreMap = Record<InsightArchetype, number>;

interface SignalQuality {
  strength: number;
  confidence: number;
  coherence: number;
}

function normalizeText(input?: string): string {
  return (input || "").toLowerCase().replace(/[^a-z\s]/g, "");
}

function validateSignalQuality(input: ResolveInput): SignalQuality {
  const worryText = normalizeText(input.worry);
  const pullText = normalizeText(input.pull);
  const actionText = normalizeText(input.action);
  
  let strength = 0;
  let confidence = 0;
  let coherence = 0;
  
  // Signal strength: meaningful content vs generic.
  // Single-word chip inputs (e.g. "Burnout", "Growth") are valid — treat any
  // non-empty word of 3+ chars as sufficient; scale up to 1 for multi-word inputs.
  const meaningfulWords = worryText.split(' ').filter(w => w.length > 2).length;
  strength = Math.min(meaningfulWords / 3, 1); // 1 word → 0.33, 2 words → 0.67, 3+ → 1.0

  // Confidence: specificity of language.
  // Chip-based inputs won't contain 'specific'/'will' — treat non-empty inputs
  // as moderately confident by default (0.4) and boost for explicit language.
  const hasExplicitLanguage =
    worryText.includes('specific') || worryText.includes('exactly') ||
    pullText.includes('specific')  || pullText.includes('exactly')  ||
    actionText.includes('will')    || actionText.includes('commit');
  confidence = hasExplicitLanguage ? 0.8 : 0.4;
  
  // Coherence: alignment between worry, pull, and action
  const hasAllComponents = !!(input.worry && input.pull && input.action);
  const hasContradiction = 
    (actionText.includes('avoid') && pullText.includes('pursue')) ||
    (worryText.includes('risk') && actionText.includes('rush'));
  
  coherence = hasAllComponents ? (hasContradiction ? 0.3 : 0.8) : 0.5;
  
  return { strength, confidence, coherence };
}


function enrichWorry(text: string): string {
  let t = text;

  if (t.includes("future regret")) t += " regret loss";
  if (t.includes("feels restrictive")) t += " restriction control";
  if (t.includes("wasting time")) t += " loss opportunity";
  if (t.includes("wrong environment")) t += " misfit discomfort";
  if (t.includes("lack of direction")) t += " uncertainty confusion";

  // Expanded coverage
  if (t.includes("overwhelmed")) t += " stress pressure overload";
  if (t.includes("chaotic")) t += " disorder instability";
  if (t.includes("hard to maintain")) t += " unsustainable effort";
  if (t.includes("low energy")) t += " fatigue depletion";
  if (t.includes("can i trust")) t += " uncertainty doubt risk";

  return t;
}

function enrichPull(text: string): string {
  let t = text;

  if (t.includes("growth")) t += " progress advancement";
  if (t.includes("purpose")) t += " meaning direction";
  if (t.includes("freedom")) t += " autonomy independence";
  if (t.includes("status")) t += " recognition respect";
  if (t.includes("abundance")) t += " wealth expansion";
  if (t.includes("mastery")) t += " skill excellence";
  if (t.includes("creativity")) t += " expression originality";
  if (t.includes("comfort")) t += " safety ease";
  if (t.includes("beauty")) t += " aesthetics pleasure";
  if (t.includes("fresh start")) t += " reset change";

  return t;
}

function applyBaseRules(
  scores: ScoreMap,
  importance?: string,
  probability?: string,
  pull?: string,
  action?: string
) {
  const pullText = normalizeText(pull);
  const actionText = normalizeText(action);
  if (probability === "Very Likely") {
    scores.fear_based_avoidance += 1;
  } else if (probability === "Likely") {
    scores.fear_based_avoidance += 0.5;
  }

  if (probability === "Uncertain") {
    // Uncertainty should not bias toward clarity
    scores.clear_conviction += 0;
  }

  if (importance === "High Stakes" || importance === "Life-Changing") {
    scores.fear_based_avoidance += 0.5;
    scores.ambition_tension += 1;
  }

  if (
    (importance === "High Stakes" || importance === "Life-Changing") &&
    (probability === "Likely" || probability === "Very Likely")
  ) {
    scores.ambition_tension += 1;
  }

  // --- High-stakes + high-probability directional signal ---
  if (
    (importance === "High Stakes" || importance === "Life-Changing") &&
    probability === "Very Likely"
  ) {
    if (
      actionText.includes("hold back") ||
      actionText.includes("stay put") ||
      actionText.includes("pull back")
    ) {
      scores.fear_based_avoidance += 1;
    }

    const forwardActions = ["pursue", "move forward", "commit", "take action", "go ahead"];
    if (forwardActions.some(a => actionText.includes(a))) {
      scores.ambition_tension += 1;
    }
  }

  if (
    probability === "Uncertain" &&
    (
      pullText.includes("calm") ||
      pullText.includes("clarity")
    ) &&
    (
      actionText.includes("wait and see") ||
      actionText.includes("explore options") ||
      actionText.includes("find balance")
    )
  ) {
    scores.clear_conviction += 2;
  }
}

function applyCategoryRules(
  scores: ScoreMap,
  category?: string,
  worry?: string,
  pull?: string,
  action?: string
) {
  const worryText = normalizeText(worry);
  const pullText = normalizeText(pull);
  const actionText = normalizeText(action);

  // ===== CAREER RULES =====
  if (
    category === "Career" &&
    (
      pullText.includes("freedom") ||
      pullText.includes("growth") ||
      pullText.includes("purpose")
    ) &&
    (
      actionText.includes("step away") ||
      actionText.includes("pursue change")
    )
  ) {
    scores.ambition_tension += 3;
  }

  if (
    category === "Career" &&
    worryText.includes("feeling stuck") &&
    actionText.includes("stay put")
  ) {
    scores.fear_based_avoidance += 2;
  }

  if (
    category === "Career" &&
    worryText.includes("not good enough") &&
    pullText.includes("respect")
  ) {
    scores.validation_seeking += 3;
  }

  if (
    category === "Career" &&
    worryText.includes("not good enough") &&
    pullText.includes("respect") &&
    actionText.includes("pursue change")
  ) {
    scores.validation_seeking += 2;
  }

  if (
    category === "Career" &&
    worryText.includes("not good enough") &&
    (
      pullText.includes("growth") ||
      pullText.includes("purpose")
    ) &&
    actionText.includes("pursue change")
  ) {
    scores.ambition_tension += 2;
  }

  if (
    category === "Career" &&
    actionText.includes("explore options")
  ) {
    scores.clear_conviction += 1;
  }

  if (
    category === "Career" &&
    worryText.includes("burnout") &&
    actionText.includes("step away")
  ) {
    scores.ambition_tension += 3;
  }

  if (
    category === "Career" &&
    worryText.includes("might regret not trying")
  ) {
    scores.scarcity_mindset += 3;
  }

  if (
    category === "Career" &&
    worryText.includes("future regret")
  ) {
    scores.scarcity_mindset += 2;
  }

  if (
    category === "Career" &&
    worryText.includes("career risk")
  ) {
    scores.fear_based_avoidance += 3;
    scores.scarcity_mindset += 1;
  }

  // ===== FINANCE RULES =====
  if (
    category === "Finances" &&
    actionText.includes("hold back")
  ) {
    scores.fear_based_avoidance += 1;
  }

  if (
    category === "Finances" &&
    worryText.includes("regret") &&
    pullText.includes("abundance") &&
    actionText.includes("hold back")
  ) {
    scores.scarcity_mindset += 2;
  }

  if (
    category === "Finances" &&
    actionText.includes("spend freely")
  ) {
    scores.impulse_restlessness += 1;
  }

  if (
    category === "Finances" &&
    pullText.includes("status") &&
    actionText.includes("spend freely")
  ) {
    scores.validation_seeking += 3;
  }

  if (
    category === "Finances" &&
    pullText.includes("freedom") &&
    actionText.includes("spend freely")
  ) {
    scores.impulse_restlessness += 3;
  }

  if (
    category === "Finances" &&
    actionText.includes("grow wealth")
  ) {
    scores.ambition_tension += 3;
    scores.scarcity_mindset += 1;

    if (
      pullText.includes("freedom") ||
      pullText.includes("status")
    ) {
      scores.ambition_tension += 1;
      scores.scarcity_mindset += 1;
    }
  }

  if (
    category === "Finances" &&
    worryText.includes("too risky")
  ) {
    scores.fear_based_avoidance += 3;
    scores.scarcity_mindset += 1;
  }

  if (
    category === "Finances" &&
    worryText.includes("can't afford")
  ) {
    scores.scarcity_mindset += 3;
    scores.fear_based_avoidance += 1;
  }

  // Behavioral resistance mappings
  if (
    category === "Finances" &&
    worryText.includes("restrictive")
  ) {
    scores.impulse_restlessness += 2;
  }

  if (
    category === "Finances" &&
    (worryText.includes("might not stick") || worryText.includes("won’t stick"))
  ) {
    scores.impulse_restlessness += 2;
  }

  if (
    category === "Finances" &&
    worryText.includes("regret")
  ) {
    scores.fear_based_avoidance += 1;
  }

  if (
    category === "Finances" &&
    worryText.includes("not worth")
  ) {
    scores.scarcity_mindset += 2;
  }

  // ===== RELATIONSHIP RULES =====
  if (
    category === "Relationships" &&
    actionText.includes("move closer") &&
    !worryText.includes("trust")
  ) {
    scores.emotional_attachment += 1;
  }

  if (
    category === "Relationships" &&
    actionText.includes("open up")
  ) {
    scores.emotional_attachment += 1;
    scores.clear_conviction += 1;
  }

  if (
    category === "Relationships" &&
    actionText.includes("pull back")
  ) {
    scores.fear_based_avoidance += 2;
  }

  if (
    category === "Relationships" &&
    worryText.includes("fear of loss")
  ) {
    scores.emotional_attachment += 2;
    scores.scarcity_mindset += 1;
  }

  if (
    category === "Relationships" &&
    worryText.includes("fear of rejection") &&
    actionText.includes("open up") &&
    (
      pullText.includes("love") ||
      pullText.includes("intimacy")
    )
  ) {
    scores.emotional_attachment += 2;
  }

  if (
    category === "Relationships" &&
    worryText.includes("rejection")
  ) {
    scores.validation_seeking += 2;
    scores.fear_based_avoidance += 1;
  }

  if (
    category === "Relationships" &&
    worryText.includes("trust")
  ) {
    scores.fear_based_avoidance += 2;

    // If there is emotional pull, this is not clarity — it's tension
    if (
      pullText.includes("love") ||
      pullText.includes("intimacy") ||
      actionText.includes("move closer") ||
      actionText.includes("open up")
    ) {
      scores.emotional_attachment += 0.5;
    } else {
      scores.clear_conviction += 1;
    }
  }

  if (
    category === "Relationships" &&
    worryText.includes("losing them")
  ) {
    scores.emotional_attachment += 2;
    scores.scarcity_mindset += 1;
    scores.fear_based_avoidance += 1;
  }

  if (
    category === "Relationships" &&
    worryText.includes("judged")
  ) {
    scores.validation_seeking += 2;
    scores.fear_based_avoidance += 1;
  }

  // ===== PERSONAL GROWTH RULES =====
  if (
    category === "Personal Growth" &&
    actionText.includes("commit deeply")
  ) {
    scores.ambition_tension += 2;
    scores.identity_conflict += 1;
  }
  // Personal Growth Compound: Reinvention Pressure
  if (
    category === "Personal Growth" &&
    worryText.includes("self-doubt") &&
    pullText.includes("fulfillment") &&
    actionText.includes("commit deeply")
  ) {
    scores.identity_conflict += 3;
  }

  if (
    category === "Personal Growth" &&
    actionText.includes("express myself")
  ) {
    scores.identity_conflict += 2;
  }

  if (
    category === "Personal Growth" &&
    worryText.includes("self-doubt") &&
    (
      pullText.includes("creativity") ||
      pullText.includes("fulfillment")
    ) &&
    actionText.includes("express myself")
  ) {
    scores.identity_conflict += 2;
  }

  if (
    category === "Personal Growth" &&
    actionText.includes("find direction")
  ) {
    scores.identity_conflict += 1;
    scores.clear_conviction += 1;
  }

  // Split Personal Growth worries to avoid over-compression
  if (
    category === "Personal Growth" &&
    worryText.includes("self-doubt")
  ) {
    scores.identity_conflict += 3;
    scores.fear_based_avoidance += 1;
  }

  if (
    category === "Personal Growth" &&
    worryText.includes("lost motivation")
  ) {
    scores.impulse_restlessness += 3;
  }

  if (
    category === "Personal Growth" &&
    worryText.includes("wasting time")
  ) {
    scores.impulse_restlessness += 2;
    scores.scarcity_mindset += 1;
  }

  if (
    category === "Personal Growth" &&
    worryText.includes("feeling lost")
  ) {
    scores.identity_conflict += 2;
    scores.clear_conviction += 1;
  }

  // New Personal Growth worry mappings
  if (
    category === "Personal Growth" &&
    worryText.includes("no motivation")
  ) {
    scores.identity_conflict += 2;
    scores.impulse_restlessness += 1;
  }

  if (
    category === "Personal Growth" &&
    worryText.includes("lack of direction")
  ) {
    scores.identity_conflict += 2;
    scores.clear_conviction += 1;
  }

  // ===== HEALTH RULES =====
  if (
    category === "Health" &&
    (
      worryText.includes("anxiety") ||
      worryText.includes("brain fog") ||
      worryText.includes("low energy")
    )
  ) {
    // Only treat as avoidance if action is withdrawal, not recovery
    if (
      actionText.includes("avoid") ||
      actionText.includes("stop") ||
      actionText.includes("give up")
    ) {
      scores.fear_based_avoidance += 3;
    }
  }

  if (
    category === "Health" &&
    worryText.includes("lack discipline")
  ) {
    scores.identity_conflict += 1;
    scores.impulse_restlessness += 1;
  }

  // Health Compound: Pressured Self-Improvement
  if (
    category === "Health" &&
    worryText.includes("lack discipline") &&
    (
      pullText.includes("strength") ||
      pullText.includes("appearance")
    ) &&
    actionText.includes("push harder")
  ) {
    scores.ambition_tension += 3;
  }

  if (
    category === "Health" &&
    actionText.includes("find balance")
  ) {
    scores.clear_conviction += 1;
  }

  if (
    category === "Health" &&
    actionText.includes("recover")
  ) {
    scores.clear_conviction += 1;
  }

  // New Health worry mappings
  if (
    category === "Health" &&
    worryText.includes("health risk")
  ) {
    scores.fear_based_avoidance += 3;
  }

  if (
    category === "Health" &&
    (worryText.includes("might not stick") || worryText.includes("won’t stick"))
  ) {
    scores.impulse_restlessness += 2;
  }

  if (
    category === "Health" &&
    (worryText.includes("too hard to maintain") || worryText.includes("hard to maintain"))
  ) {
    scores.impulse_restlessness += 2;
  }

  // ===== PRODUCTIVITY RULES =====
  if (
    category === "Productivity" &&
    (
      worryText.includes("procrastinating") ||
      worryText.includes("overwhelmed") ||
      worryText.includes("can't focus") ||
      worryText.includes("no clear start") ||
      worryText.includes("might get distracted")
    )
  ) {
    scores.impulse_restlessness += 3;
  }

  if (
    category === "Productivity" &&
    actionText.includes("ease up")
  ) {
    scores.clear_conviction += 1;
  }

  if (
    category === "Productivity" &&
    worryText.includes("overwhelmed") &&
    actionText.includes("ease up")
  ) {
    scores.clear_conviction += 2;
  }

  // New Productivity worry mappings
  if (
    category === "Productivity" &&
    (worryText.includes("might not follow through") || worryText.includes("won’t follow through"))
  ) {
    scores.impulse_restlessness += 3;
  }

  // ===== LIFESTYLE RULES =====
  if (
    category === "Lifestyle" &&
    worryText.includes("clutter")
  ) {
    // Clutter = friction, not restlessness
    scores.clear_conviction += 2;
  }

  if (
    category === "Lifestyle" &&
    (
      worryText.includes("chaotic") ||
      worryText.includes("draining") ||
      worryText.includes("wrong environment") ||
      worryText.includes("too much upkeep") ||
      worryText.includes("hard to maintain")
    )
  ) {
    // Only treat as restlessness if action is reactive, not stabilizing
    if (
      actionText.includes("redesign") ||
      actionText.includes("change") ||
      actionText.includes("escape")
    ) {
      scores.impulse_restlessness += 2;
    }
  }

  // Lifestyle Compound: Reinvention / Fresh Start

  if (
    category === "Lifestyle" &&
    worryText.includes("wrong environment") &&
    pullText.includes("fresh start") &&
    actionText.includes("redesign")
  ) {
    scores.impulse_restlessness += 4;
  }

  if (
    category === "Lifestyle" &&
    actionText.includes("stabilize")
  ) {
    scores.clear_conviction += 2;
  }

  if (
    category === "Lifestyle" &&
    worryText.includes("chaotic") &&
    pullText.includes("stability") &&
    actionText.includes("simplify")
  ) {
    scores.clear_conviction += 3;
  }
}

function applyGenericRules(
  scores: ScoreMap,
  worry?: string,
  pull?: string,
  action?: string
) {
  const worryText = enrichWorry(normalizeText(worry));
  const pullText = enrichPull(normalizeText(pull));
  const actionText = normalizeText(action);

  const validationWorries = ["judge", "approval", "embarrass", "reject", "opinion", "what others think"];

  if (validationWorries.some(w => worryText.includes(w))) {
    scores.validation_seeking += 0.25;
  }

  if (
    worryText.includes("miss chance") ||
    worryText.includes("lose chance") ||
    worryText.includes("opportunity")
  ) {
    scores.scarcity_mindset += 0.5;
  }

  if (
    worryText.includes("not me") ||
    worryText.includes("identity") ||
    worryText.includes("self image")
  ) {
    scores.identity_conflict += 0.75;
  }

  const emotionalPulls = ["emotion", "attachment", "love", "connection", "closeness"];
  const intimacyPulls = ["intimacy", "bond", "togetherness"];

  const hasEmotional = emotionalPulls.some(p => pullText.includes(p));
  const hasIntimacy = intimacyPulls.some(p => pullText.includes(p));

  if (hasEmotional || hasIntimacy) {
    scores.emotional_attachment += 0.25;
  }

  if (
    pullText.includes("fulfillment")
  ) {
    scores.identity_conflict += 0.25;
  }

  if (
    pullText.includes("clarity")
  ) {
    scores.clear_conviction += 0.25;
  }

  if (
    pullText.includes("calm")
  ) {
    scores.clear_conviction += 0.25;
  }

  if (
    actionText.includes("rush") ||
    actionText.includes("quick") ||
    actionText.includes("immediate")
  ) {
    scores.impulse_restlessness += 0.75;
  }

  // Stabilizing actions → clarity, not restlessness
  if (
    actionText.includes("build momentum") ||
    actionText.includes("lock in") ||
    actionText.includes("regain control")
  ) {
    scores.clear_conviction += 0.5;
  }

  // --- Action resistance: hesitation vs deliberate pause ---
  const hesitationActions = ["hesitate", "avoid", "delay", "procrastinate", "put off"];

  if (hesitationActions.some(a => actionText.includes(a))) {
    scores.fear_based_avoidance += 0.75;
  }

  const deliberatePauseActions = ["wait", "pause", "reflect", "consider", "step back"];

  if (deliberatePauseActions.some(a => actionText.includes(a))) {
    scores.clear_conviction += 0.5;
  }

  // --- Worry + Action interaction ---
  const fearWorries = ["risk", "rejection", "loss", "failure", "mistake"];
  const forwardActions = ["pursue", "move forward", "commit", "take action", "go ahead"];

  // Fear + hesitation → stronger avoidance
  if (
    fearWorries.some(w => worryText.includes(w)) &&
    hesitationActions.some(a => actionText.includes(a))
  ) {
    scores.fear_based_avoidance += 0.5;
  }

  // Fear + forward action → internal push (tension)
  if (
    fearWorries.some(w => worryText.includes(w)) &&
    forwardActions.some(a => actionText.includes(a))
  ) {
    scores.ambition_tension += 0.5;
  }
}

export function resolveArchetype({
  category,
  worry,
  pull,
  action,
  importance,
  probability
}: ResolveInput): { primary: InsightArchetype; secondary: InsightArchetype | null } {
  const input = { category, worry, pull, action, importance, probability };
  const signalQuality = validateSignalQuality(input);
  
  // Early return for very weak signals.
  // Chip-selected inputs are intentionally short (1-2 words) so the threshold
  // must be low enough to pass them through to the scoring rules.
  const qualityThreshold = 0.25;
  const avgQuality = (signalQuality.strength + signalQuality.confidence + signalQuality.coherence) / 3;
  
  if (avgQuality < qualityThreshold) {
    return { primary: "low_signal" as any, secondary: null };
  }
  
  const scores: Record<InsightArchetype, number> = {
    fear_based_avoidance: 0,
    validation_seeking: 0,
    scarcity_mindset: 0,
    identity_conflict: 0,
    ambition_tension: 0,
    emotional_attachment: 0,
    impulse_restlessness: 0,
    clear_conviction: 0
  };

  applyBaseRules(scores, importance, probability, pull, action);
  applyCategoryRules(scores, category, worry, pull, action);
  applyGenericRules(scores, worry, pull, action);
  // --- Category-specific adaptive weight adjustment (true per-category calibration) ---
  const learning = getLearningData();

  // --- Action learning influence (forward vs avoidance bias) ---
  if (learning?.actionStats) {
    const { forward, avoid } = learning.actionStats;
    const total = forward + avoid;

    if (total > 0) {
      const forwardBias = forward / total;

      // Habitual avoidance → amplify fear signals slightly
      if (forwardBias < 0.4) {
        scores.fear_based_avoidance += 0.5;
      }

      // Habitual action → support forward movement signals
      if (forwardBias > 0.6) {
        scores.ambition_tension += 0.5;
        scores.clear_conviction += 0.25;
      }
    }
  }

  if (learning?.categoryCalibrationStats && category) {
    const catKey = category.toLowerCase();
    const catCal = learning.categoryCalibrationStats[catKey];

    if (catCal) {
      const { over, under } = catCal;
      const total = over + under + catCal.aligned;

      if (total >= 5) {
        const bias = (over - under) / total; // range roughly -1 to +1

        // Smooth adjustment instead of step jumps
        if (bias > 0.2) {
          scores.fear_based_avoidance = Math.max(0, scores.fear_based_avoidance - 1);
          scores.clear_conviction += 0.5;
          scores.ambition_tension += 0.5;
        } else if (bias < -0.2) {
          scores.fear_based_avoidance += 1;
          scores.clear_conviction = Math.max(0, scores.clear_conviction - 0.5);
        }
      }
    }
  }

  // --- Apply signal quality weighting ---
  const qualityWeight = (signalQuality.strength + signalQuality.confidence + signalQuality.coherence) / 3;
  const qualityMultiplier = 0.5 + (qualityWeight * 0.5); // Range: 0.5 to 1.0
  
  Object.keys(scores).forEach((key) => {
    const k = key as InsightArchetype;
    scores[k] *= qualityMultiplier;
  });

  // --- Archetype rebalancing: prevent structural dominance ---
  scores.fear_based_avoidance *= 0.9;
  scores.ambition_tension *= 0.95;

  // Reduce structural dominance of clear_conviction
  scores.clear_conviction *= 0.8;

  // --- Score normalization: prevent runaway accumulation ---
  Object.keys(scores).forEach((key) => {
    const k = key as InsightArchetype;
    if (scores[k] > 6) {
      scores[k] = 6;
    }
  });

  const priority: Record<InsightArchetype, number> = {
    fear_based_avoidance: 3,
    validation_seeking: 2,
    scarcity_mindset: 2,
    identity_conflict: 3,
    ambition_tension: 3,
    emotional_attachment: 2,
    impulse_restlessness: 2,
    clear_conviction: 1
  };

  // Demote emotional_attachment to secondary only (cannot be primary)
  scores.emotional_attachment = 0;
  const sorted = Object.entries(scores).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];

    // Tie-break using signal strength priority
    return (priority[b[0] as InsightArchetype] || 0) -
           (priority[a[0] as InsightArchetype] || 0);
  });

  const winner = sorted[0];
  const runnerUp = sorted[1];
  const scoreGap = runnerUp ? winner[1] - runnerUp[1] : winner[1];

  if (!winner || winner[1] < 2) {
    return { primary: "low_signal" as any, secondary: null };
  }

  // --- Uncertainty preservation: avoid false clarity ---
  const scoreVariance = Object.values(scores).reduce((sum, score) => {
    const diff = Math.abs(score - winner[1]);
    return sum + diff;
  }, 0) / Object.keys(scores).length;

  // If scores are too clustered and signal quality is low, preserve uncertainty
  if (scoreVariance < 1.5 && avgQuality < 0.4) {
    return { primary: "low_signal" as any, secondary: null };
  }

  // --- Stability layer removed: allow natural winner even in weak signal ---

  // --- Category conflict resolution: prefer defensive signals when risk present ---
  if (
    runnerUp &&
    winner &&
    runnerUp[1] >= winner[1] - 1 &&
    runnerUp[1] >= 3
  ) {
    const defensiveSignals: InsightArchetype[] = [
      "fear_based_avoidance",
      "scarcity_mindset",
      "validation_seeking"
    ];

    const isWinnerDefensive = defensiveSignals.includes(winner[0] as InsightArchetype);
    const isRunnerDefensive = defensiveSignals.includes(runnerUp[0] as InsightArchetype);

    // If conflict between growth vs defensive → bias toward defensive
    if (!isWinnerDefensive && isRunnerDefensive) {
      return { primary: runnerUp[0] as InsightArchetype, secondary: null };
    }
  }

  // --- Confidence filter: avoid weak primary dominance ---
  if (scoreGap === 0 && winner[1] <= 4) {
    return { primary: "low_signal" as any, secondary: null };
  }

  return {
    primary: winner[0] as InsightArchetype,
    secondary:
      runnerUp &&
      winner &&
      winner[1] >= 4 &&
      runnerUp[1] >= 2 &&
      Math.abs(winner[1] - runnerUp[1]) <= 2
        ? (runnerUp[0] as InsightArchetype)
        : null
  };
}

export default resolveArchetype;
