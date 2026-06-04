
export type InsightArchetype =
  | "fear_based_avoidance"
  | "validation_seeking"
  | "scarcity_mindset"
  | "identity_conflict"
  | "ambition_tension"
  | "emotional_attachment"
  | "impulse_restlessness"
  | "clear_conviction";

export type ArchetypeDefinition = {
  id: InsightArchetype;
  title: string;
  summary: string;
  coaching: string;
};

export const ARCHETYPE_DEFINITIONS: Record<InsightArchetype, ArchetypeDefinition> = {
  fear_based_avoidance: {
    id: "fear_based_avoidance",
    title: "Fear-Based Avoidance",
    summary:
      "Fear may be amplifying the risks in your mind beyond what the evidence supports.",
    coaching:
      "Ask whether the danger is truly likely—or simply feels vivid because of uncertainty."
  },

  validation_seeking: {
    id: "validation_seeking",
    title: "Validation Seeking",
    summary:
      "Concern over others’ opinions may be influencing your judgment more than your own priorities.",
    coaching:
      "Ask whether this choice reflects your values—or your desire to be perceived well."
  },

  scarcity_mindset: {
    id: "scarcity_mindset",
    title: "Scarcity Mindset",
    summary:
      "You may be treating this like a rare chance that must be seized before it disappears.",
    coaching:
      "Pause and ask whether urgency is real—or created by fear of missing out."
  },

  identity_conflict: {
    id: "identity_conflict",
    title: "Identity Conflict",
    summary:
      "This decision may feel difficult because it challenges how you see yourself.",
    coaching:
      "Ask whether resistance comes from practical concern—or discomfort with self-image."
  },

  ambition_tension: {
    id: "ambition_tension",
    title: "Ambition Tension",
    summary:
      "You may feel torn between the desire to grow and the weight of what growth demands.",
    coaching:
      "Ask whether hesitation comes from wisdom—or discomfort with rising expectations."
  },

  emotional_attachment: {
    id: "emotional_attachment",
    title: "Emotional Attachment",
    summary:
      "Strong feeling may be shaping your judgment alongside reason.",
    coaching:
      "Ask whether your view is grounded in clarity—or being pulled by emotion."
  },

  impulse_restlessness: {
    id: "impulse_restlessness",
    title: "Impulse Restlessness",
    summary:
      "You may be craving movement or change more than this outcome itself.",
    coaching:
      "Ask whether you are moving toward something meaningful—or simply away from discomfort."
  },

  clear_conviction: {
    id: "clear_conviction",
    title: "Clear Conviction",
    summary:
      "Your thinking appears steady, balanced, and free of obvious distortion.",
    coaching:
      "Proceed with confidence—but keep testing the assumptions behind your judgment."
  }
};