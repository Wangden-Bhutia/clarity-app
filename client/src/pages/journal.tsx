import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Search, Circle, CheckCircle2 } from "lucide-react";
import { db, Decision } from "@/lib/db";

export default function Journal() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [filteredDecisions, setFilteredDecisions] = useState<Decision[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const params = new URLSearchParams(window.location.search);
  const initialFilter = (params.get("filter") as any) || "all";
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "recorded" | "review"
  >(initialFilter);

  const [isLoading, setIsLoading] = useState(true);
  // --- Insight (temporal heuristic) ---
  const hasEnoughData = decisions.length >= 2;

  let insight: string | null = null;

  // --- Review-ready count ---
  const nowTs = Date.now();
  const reviewReadyCount = decisions.filter((d: any) =>
    d.outcomeStatus === "pending" && d.reviewDate && d.reviewDate <= nowTs
  ).length;

  if (hasEnoughData) {

    // --- Early insight (2–4 decisions) ---
    if (decisions.length < 5) {
      const avgEarly = decisions.reduce((s: number, d: any) => s + (d.worstOutcomeProbability ?? 0), 0) / (decisions.length || 1);

      if (avgEarly >= 60) {
        insight = "Early pattern: you seem to be leaning cautious in how you see outcomes.";
      } else if (avgEarly <= 30) {
        insight = "Early pattern: you seem to approach decisions with optimism.";
      } else {
        insight = "Too early to tell—but you seem to be weighing outcomes thoughtfully.";
      }
    } else {

      const sorted = [...decisions].sort((a, b) => b.date - a.date);

      const recent = sorted.slice(0, Math.ceil(sorted.length / 2));
      const past = sorted.slice(Math.ceil(sorted.length / 2));

      const avg = (arr: any[]) =>
        arr.reduce((sum, d) => sum + (d.worstOutcomeProbability ?? 0), 0) /
        (arr.length || 1);

      const recentAvg = avg(recent);
      const pastAvg = avg(past);

      // --- Predictive insight (based on recent pattern) ---
      if (!insight) {
        if (recentAvg >= 60) {
          insight = "In upcoming decisions, you may be inclined to expect worse outcomes—pause and check if that’s warranted.";
        } else if (recentAvg <= 30) {
          insight = "You may lean optimistic in upcoming decisions—consider whether risks are being fully accounted for.";
        }
      }

      // --- Trigger: high-importance decisions ---
      if (!insight) {
        const highImportance = decisions.filter((d: any) =>
          (d.importanceLevel || '').toLowerCase() === 'high'
        );

        if (highImportance.length >= 2) {
          const avgAll = decisions.reduce((s: number, d: any) => s + (d.worstOutcomeProbability ?? 0), 0) / (decisions.length || 1);
          const avgHigh = highImportance.reduce((s: number, d: any) => s + (d.worstOutcomeProbability ?? 0), 0) / (highImportance.length || 1);

          if (avgHigh - avgAll >= 12) {
            insight = "When decisions feel important, you tend to anticipate worse outcomes more strongly.";
          } else if (avgAll - avgHigh >= 12) {
            insight = "Even when stakes are high, you don’t significantly shift toward worst-case thinking.";
          }
        }
      }

      // --- Category contrast ---
      const byCategory: Record<string, any[]> = {};
      decisions.forEach((d: any) => {
        const key = (d.category || 'Uncategorized').toLowerCase();
        if (!byCategory[key]) byCategory[key] = [];
        byCategory[key].push(d);
      });

      const categoryAvgs = Object.entries(byCategory)
        .map(([cat, arr]) => ({
          cat,
          avg:
            arr.reduce((s: number, x: any) => s + (x.worstOutcomeProbability ?? 0), 0) /
            (arr.length || 1),
          count: arr.length,
        }))
        .filter((x) => x.count >= 2)
        .sort((a, b) => b.avg - a.avg);

      if (categoryAvgs.length >= 2) {
        const high = categoryAvgs[0];
        const low = categoryAvgs[categoryAvgs.length - 1];

        if (high.avg - low.avg >= 15) {
          const format = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
          insight = `You tend to be more cautious in ${format(high.cat)} decisions than in ${format(low.cat)} ones.`;
        }
      }

      if (!insight) {
        if (recentAvg - pastAvg > 10) {
          insight = "Recently, you’ve been leaning more cautious in how you see outcomes.";
        } else if (pastAvg - recentAvg > 10) {
          insight = "Lately, you seem more open and less focused on worst-case outcomes.";
        } else {
          // fallback to general pattern
          const highWorstProb = decisions.filter((d: any) =>
            (d.worstOutcomeProbability ?? 0) >= 60
          ).length;

          const lowWorstProb = decisions.filter((d: any) =>
            (d.worstOutcomeProbability ?? 0) <= 30
          ).length;

          if (highWorstProb >= Math.ceil(decisions.length * 0.6)) {
            insight = "When stakes feel uncertain, you tend to anticipate the downside first.";
          } else if (lowWorstProb >= Math.ceil(decisions.length * 0.6)) {
            insight = "You generally approach decisions with an optimistic expectation of outcomes.";
          } else {
            insight = "You adjust your expectations depending on the situation rather than defaulting to one pattern.";
          }
        }
      }
    }
  }

  useEffect(() => {
    const loadData = async () => {
      const all = await db.getAllDecisions();
      all.sort((a, b) => b.date - a.date);
      setDecisions(all);
      setFilteredDecisions(all);
      setIsLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    let result = decisions;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          d.options.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      if (statusFilter === "review") {
        const now = Date.now();
        result = result.filter(
          (d) =>
            d.outcomeStatus === "pending" &&
            d.reviewDate &&
            d.reviewDate <= now
        );
      } else {
        result = result.filter((d) => d.outcomeStatus === statusFilter);
      }
    }

    setFilteredDecisions(result);
  }, [searchQuery, statusFilter, decisions]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-t border-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-6 px-4 max-w-2xl mx-auto w-full">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-light mb-3">Journal</h1>
          <p className="text-muted-foreground/60 text-xs">
            A quiet record of your choices.
          </p>
          <p className="text-[11px] text-muted-foreground/50 mt-2">
            Over time, your patterns will start to reveal themselves.
          </p>
        </div>

        <Link href="/profile" className="text-xs text-muted-foreground">
          Profile
        </Link>
      </header>
      {reviewReadyCount === 0 && (
        <div className="mt-2 px-4 py-3 rounded-2xl bg-secondary/30 border border-border/50">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Capture a decision while it's fresh — clarity comes later.
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search decisions..."
          className="w-full pl-9 pr-3 py-2 rounded-full bg-secondary/40"
        />
      </div>

      {/* Tabs 1x4 */}
      <div className="relative flex justify-between gap-1 bg-secondary/20 rounded-full p-1">
        <div
          className="absolute top-1 bottom-1 left-0 w-1/4 rounded-full bg-primary/20 transition-all duration-300 ease-out"
          style={{
            transform: `translateX(${
              statusFilter === 'all'
                ? '0%'
                : statusFilter === 'pending'
                ? '100%'
                : statusFilter === 'review'
                ? '200%'
                : '300%'
            })`
          }}
        />
        {["all", "pending", "review", "recorded"].map((key) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key as any)}
            className={`relative z-10 flex-1 text-center py-2 text-[11px] rounded-full transition-all duration-300 ease-out active:scale-[0.97] ${
              statusFilter === key
                ? "text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {key === "all"
              ? "All"
              : key === "pending"
              ? "Pending"
              : key === "review"
              ? "Review"
              : "Done"}
          </button>
        ))}
      </div>

      {reviewReadyCount > 0 && (
        <div
          onClick={() => setStatusFilter("review")}
          className="mt-2 px-4 py-3 rounded-2xl bg-secondary/30 border border-border/50 cursor-pointer active:scale-[0.98] transition-all"
        >
          <p className="text-xs text-muted-foreground leading-relaxed">
            {reviewReadyCount} decision{reviewReadyCount > 1 ? 's are' : ' is'} ready for review
          </p>
        </div>
      )}

      {hasEnoughData && insight && (
        <div className="mt-2 px-4 py-3 rounded-2xl bg-primary/5 border border-primary/10">
          <p className="text-xs text-primary/80 font-light leading-relaxed">
            {insight}
          </p>
        </div>
      )}

      {/* Empty */}
      {filteredDecisions.length === 0 && (
        <div className="text-center py-16 px-6">
          <p className="text-sm text-muted-foreground/80 mb-3 leading-relaxed">
            This is where your decisions start to reveal patterns.
          </p>

          <Link href="/flow">
            <div className="inline-block px-4 py-2 rounded-full bg-primary/15 text-primary text-sm">
              Start your first reflection
            </div>
          </Link>
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {filteredDecisions.map((d) => (
          <Link key={d.id} href={`/decision/${d.id}`}>
            <div
              className={`p-4 border rounded-2xl transition-all ${
                d.outcomeStatus === "pending" && d.reviewDate && d.reviewDate <= Date.now()
                  ? "bg-primary/5 border-primary/20 shadow-sm"
                  : "bg-background"
              }`}
            >
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  {d.outcomeStatus === "pending" && d.reviewDate && d.reviewDate <= Date.now() && (
                    <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                  )}
                  <h2>{d.title}</h2>
                </div>
                {d.outcomeStatus === "recorded" ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <Circle size={18} />
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
