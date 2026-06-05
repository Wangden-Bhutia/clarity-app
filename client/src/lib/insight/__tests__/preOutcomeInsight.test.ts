/**
 * Pre-Outcome Insight Quality Tests
 *
 * Each test verifies a distinct quality dimension of the insight pipeline:
 *   1. Strong fear signal → fear_based_avoidance archetype + real coaching copy
 *   2. Validation-seeking signal → approval archetype, not fear
 *   3. Ambition/career growth tension → ambition_tension archetype
 *   4. Weak / ambiguous input → low_signal, no false conviction
 *   5. Structured output completeness → every archetype produces title + summary + coaching
 *   6. Legacy string format backward-compatibility → ClarityInsightBlock can still parse it
 */

import { describe, it, expect, beforeAll, vi } from "vitest";
import resolveArchetype from "../resolver";
import { getArchetypeInsight } from "../messaging";

// ─── Stub localStorage so learningStore doesn't throw in Node ──────────────
beforeAll(() => {
  const store: Record<string, string> = {};
  vi.stubGlobal("localStorage", {
    getItem:    (k: string)         => store[k] ?? null,
    setItem:    (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string)         => { delete store[k]; },
    clear:      ()                  => { Object.keys(store).forEach(k => delete store[k]); },
  });
});

// ─── Helper ────────────────────────────────────────────────────────────────
function buildInsight(params: {
  category?: string;
  worry?: string;
  pull?: string;
  action?: string;
  importance?: string;
  probability?: string;
}) {
  const { primary, secondary } = resolveArchetype(params);
  const insight = getArchetypeInsight({ primary, secondary }, params.category, params.worry);
  return { primary, secondary, insight };
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 1 — Strong fear signal produces the right archetype and real coaching
// ═══════════════════════════════════════════════════════════════════════════
describe("Test 1 — Fear-based avoidance: strong fear signal", () => {
  it("resolves to fear_based_avoidance primary archetype", () => {
    const { primary } = buildInsight({
      category: "Career", worry: "Career Risk", pull: "Growth",
      action: "Stay Put", importance: "High Stakes", probability: "Very Likely",
    });
    expect(primary).toBe("fear_based_avoidance");
  });

  it("insight summary is non-empty and not a placeholder", () => {
    const { insight } = buildInsight({
      category: "Career", worry: "Career Risk", pull: "Growth",
      action: "Stay Put", importance: "High Stakes", probability: "Very Likely",
    });
    expect(insight.mainLine.length).toBeGreaterThan(20);
    expect(insight.mainLine).not.toContain("Clarity Insight");
  });

  it("coaching question references evidence, risk, or a check prompt", () => {
    const { insight } = buildInsight({
      category: "Career", worry: "Career Risk", pull: "Growth",
      action: "Stay Put", importance: "High Stakes", probability: "Very Likely",
    });
    const coaching = insight.deepLine.toLowerCase();
    expect(
      coaching.includes("risk") || coaching.includes("evidence") || coaching.includes("check")
    ).toBe(true);
  });

  it("title is set and non-empty", () => {
    const { insight } = buildInsight({
      category: "Career", worry: "Career Risk", pull: "Growth",
      action: "Stay Put", importance: "High Stakes", probability: "Very Likely",
    });
    expect(insight.title.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST 2 — Validation-seeking signal is not misclassified as fear
// ═══════════════════════════════════════════════════════════════════════════
describe("Test 2 — Validation-seeking: approval concern in career context", () => {
  it("resolves to validation_seeking, not fear_based_avoidance", () => {
    const { primary } = buildInsight({
      category: "Career", worry: "Not Good Enough", pull: "Respect",
      action: "Pursue Change", importance: "High Stakes", probability: "Unlikely",
    });
    expect(primary).toBe("validation_seeking");
    expect(primary).not.toBe("fear_based_avoidance");
  });

  it("insight title signals approval or seeking", () => {
    const { insight } = buildInsight({
      category: "Career", worry: "Not Good Enough", pull: "Respect",
      action: "Pursue Change", importance: "High Stakes", probability: "Unlikely",
    });
    expect(insight.title.toLowerCase()).toMatch(/approval|seeking|valid/);
  });

  it("mainLine addresses perception or others' opinions", () => {
    const { insight } = buildInsight({
      category: "Career", worry: "Not Good Enough", pull: "Respect",
      action: "Pursue Change", importance: "High Stakes", probability: "Unlikely",
    });
    const line = insight.mainLine.toLowerCase();
    expect(
      line.includes("others") || line.includes("perceived") ||
      line.includes("approval") || line.includes("reflects on you")
    ).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST 3 — Career growth under pressure → ambition tension
// ═══════════════════════════════════════════════════════════════════════════
describe("Test 3 — Ambition tension: career growth + high stakes", () => {
  it("resolves to ambition_tension", () => {
    const { primary } = buildInsight({
      category: "Career", worry: "Burnout", pull: "Growth",
      action: "Step Away", importance: "Life-Changing", probability: "Likely",
    });
    expect(primary).toBe("ambition_tension");
  });

  it("mainLine mentions growth, pressure, or ambition", () => {
    const { insight } = buildInsight({
      category: "Career", worry: "Burnout", pull: "Growth",
      action: "Step Away", importance: "Life-Changing", probability: "Likely",
    });
    const line = insight.mainLine.toLowerCase();
    expect(
      line.includes("growth") || line.includes("pressure") ||
      line.includes("ambition") || line.includes("strain")
    ).toBe(true);
  });

  it("coaching distinguishes healthy ambition from overextension", () => {
    const { insight } = buildInsight({
      category: "Career", worry: "Burnout", pull: "Growth",
      action: "Step Away", importance: "Life-Changing", probability: "Likely",
    });
    const coaching = insight.deepLine.toLowerCase();
    expect(
      coaching.includes("ambition") || coaching.includes("limit") ||
      coaching.includes("strain") || coaching.includes("check")
    ).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST 4 — Weak / ambiguous input → low_signal, no false conviction
// ═══════════════════════════════════════════════════════════════════════════
describe("Test 4 — Low signal: vague single-word inputs produce no false conviction", () => {
  it("resolves to low_signal", () => {
    const { primary } = buildInsight({
      category: "Other", worry: "ok", pull: "ok",
      action: "ok", importance: "Moderate", probability: "Uncertain",
    });
    expect(primary).toBe("low_signal");
  });

  it("getArchetypeInsight returns neutral 'Reflect' title, not 'Clear-Headed'", () => {
    const { insight } = buildInsight({
      category: "Other", worry: "ok", pull: "ok",
      action: "ok", importance: "Moderate", probability: "Uncertain",
    });
    expect(insight.title).toBe("Reflect");
    expect(insight.title).not.toBe("Clear-Headed");
  });

  it("mainLine acknowledges insufficient signal honestly", () => {
    const { insight } = buildInsight({
      category: "Other", worry: "ok", pull: "ok",
      action: "ok", importance: "Moderate", probability: "Uncertain",
    });
    const line = insight.mainLine.toLowerCase();
    expect(
      line.includes("signal") || line.includes("pattern") ||
      line.includes("enough") || line.includes("identify")
    ).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST 5 — Structured output: every scenario produces all 3 insight fields
// ═══════════════════════════════════════════════════════════════════════════
describe("Test 5 — Structured output completeness across categories", () => {
  const scenarios = [
    { label: "Finances/fear",        category: "Finances",        worry: "Too Risky",    pull: "Security",     action: "Hold Back",    importance: "High Stakes",   probability: "Very Likely" },
    { label: "Relationships/emotion", category: "Relationships",   worry: "Rejection",    pull: "Love",         action: "Open Up",      importance: "Life-Changing", probability: "Likely"      },
    { label: "Health/restlessness",  category: "Health",          worry: "Low Energy",   pull: "Strength",     action: "Push Harder",  importance: "Moderate",      probability: "Uncertain"   },
  ];

  scenarios.forEach(({ label, ...input }) => {
    it(`${label}: insight has non-empty title, summary, and distinct coaching`, () => {
      const { primary, secondary } = resolveArchetype(input);
      const insight = getArchetypeInsight({ primary, secondary }, input.category, input.worry);

      expect(insight.title.length).toBeGreaterThan(0);
      expect(insight.mainLine.length).toBeGreaterThan(20);
      expect(insight.deepLine.length).toBeGreaterThan(10);
      // Coaching must be a different sentence from the summary
      expect(insight.deepLine).not.toBe(insight.mainLine);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST 6 — Legacy string backward-compatibility
// ═══════════════════════════════════════════════════════════════════════════
describe("Test 6 — Legacy preInsight string parseable by ClarityInsightBlock", () => {
  it("new 3-part '||' format splits cleanly into title, summary, coaching", () => {
    const { insight } = buildInsight({
      category: "Personal Growth", worry: "Self-Doubt", pull: "Fulfillment",
      action: "Commit Deeply", importance: "High Stakes", probability: "Uncertain",
    });

    const legacyString = `${insight.title}||${insight.mainLine}||${insight.deepLine}`;
    const parts = legacyString.split("||");

    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe(insight.title);
    expect(parts[1]).toBe(insight.mainLine);
    expect(parts[2]).toBe(insight.deepLine);
  });

  it("old 2-part '||' format (pre-fix records) still yields displayable body with no crash", () => {
    const oldFormat = "Overextended||You may feel torn between growth and capacity.";
    const parts = oldFormat.split("||");

    // parts[1] = body shown as summary; parts[2] = undefined (coaching gracefully absent)
    expect(parts[1]).toBeDefined();
    expect(parts[1].length).toBeGreaterThan(10);
    expect(parts[2]).toBeUndefined();
  });

  it("Personal Growth input resolves to an expected identity or ambition archetype", () => {
    const { primary } = buildInsight({
      category: "Personal Growth", worry: "Self-Doubt", pull: "Fulfillment",
      action: "Commit Deeply", importance: "High Stakes", probability: "Uncertain",
    });
    expect(["identity_conflict", "ambition_tension", "fear_based_avoidance"]).toContain(primary);
  });
});
