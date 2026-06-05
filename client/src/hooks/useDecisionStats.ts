

import { useEffect, useState } from "react";
import { db, Decision } from "@/lib/db";

export function useDecisionStats() {
  const [fearStats, setFearStats] = useState<{ total: number; occurred: number } | null>(null);
  const [fearProfile, setFearProfile] = useState<string | null>(null);
  const [recentStats, setRecentStats] = useState<{ total: number; occurred: number } | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const all: Decision[] = await db.getAllDecisions();
        const withOutcomes = all.filter(d => d.worstOutcomeOccurred !== undefined);

        // Fear profiling
        const counts: Record<string, number> = {
          judgment: 0,
          money: 0,
          control: 0,
          regret: 0
        };

        withOutcomes.forEach(d => {
          const text = (d.primaryConcern || d.worstCase || "").toLowerCase();

          if (text.includes("judge") || text.includes("people")) counts.judgment++;
          if (text.includes("money") || text.includes("loss")) counts.money++;
          if (text.includes("control")) counts.control++;
          if (text.includes("regret")) counts.regret++;
        });

        let dominant: string | null = null;
        let max = 0;

        Object.entries(counts).forEach(([key, val]) => {
          if (val > max) {
            max = val;
            dominant = key;
          }
        });

        if (dominant && max > 1) {
          setFearProfile(dominant);
        }

        const total = withOutcomes.length;
        const occurred = withOutcomes.filter(d => d.worstOutcomeOccurred).length;

        if (total > 0) {
          setFearStats({ total, occurred });
        }

        const recent = withOutcomes.slice(-5);
        if (recent.length >= 3) {
          const recentOccurred = recent.filter(d => d.worstOutcomeOccurred).length;
          setRecentStats({ total: recent.length, occurred: recentOccurred });
        }
      } catch (e) {
        console.error("Failed to load decision stats");
      }
    };

    loadStats();
  }, []);

  return { fearStats, fearProfile, recentStats };
}