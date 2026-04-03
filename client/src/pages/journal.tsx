import { useInsightEngine } from "@/lib/insightEngine";
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

  // --- useInsightEngine integration ---
  const {
    hasEnoughData,
    finalInsight,
    middleInsight,
    finalNudge
  } = useInsightEngine(decisions);

  // --- Review-ready count ---
  const nowTs = Date.now();
  const reviewReadyCount = decisions.filter((d: any) =>
    d.outcomeStatus === "pending" && d.reviewDate && d.reviewDate <= nowTs
  ).length;

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
    <div className="h-full overflow-y-auto scrollbar-none flex flex-col gap-6 py-6 px-4 max-w-2xl mx-auto w-full pb-32">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-light mb-3">Journal</h1>
          <p className="text-muted-foreground/60 text-xs">
            A quiet record of your choices.
          </p>
        </div>

      </header>
      {/* Pattern Signal merged into Insight card below */}
      {hasEnoughData && finalInsight && (
        <div className="mt-4 px-5 py-5 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
          <p className="text-[11px] uppercase tracking-widest text-primary/50 mb-2">
            Insight
          </p>

          {/* Primary insight */}
          <p className="text-[13px] font-medium text-primary/90 leading-relaxed text-justify">
            {finalInsight}
          </p>
          {middleInsight && (
            <p className="text-[13px] text-primary/70 leading-relaxed text-justify">
              {middleInsight}
            </p>
          )}

          {/* Single nudge line */}
          {finalNudge && (
            <p className="text-[13px] text-muted-foreground/50 italic leading-relaxed pt-3 border-t border-border/30 text-justify">
              {finalNudge}
            </p>
          )}
        </div>
      )}
      {decisions.length === 0 && (
        <div className="mt-2 px-4 py-4 rounded-2xl bg-secondary/30 border border-border/50 space-y-3">
          <p className="text-sm text-foreground/80 font-light leading-relaxed">
            Start with one decision you’re unsure about.
          </p>
          <button
            onClick={() => (window.location.href = "/framework-flow")}
            className="px-4 py-2 rounded-full bg-primary/10 text-primary text-xs active:scale-[0.97] transition-all"
          >
            Log first decision
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search decisions..."
          className="w-full pl-9 pr-3 py-2 rounded-full bg-secondary/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>

      {/* Tabs 1x3 */}
      <div className="relative flex justify-between gap-1 bg-secondary/20 rounded-full p-1">
        <div
          className="absolute top-1 bottom-1 left-0 w-1/3 rounded-full bg-primary/20 transition-all duration-300 ease-out"
          style={{
            transform: `translateX(${
              statusFilter === 'all'
                ? '0%'
                : statusFilter === 'pending'
                ? '100%'
                : '200%'
            })`
          }}
        />
        {["all", "pending", "recorded"].map((key) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key as any)}
            className={`relative z-10 flex-1 text-center py-2 text-[11px] rounded-full transition-all duration-300 ease-out active:scale-[0.95] ${
              statusFilter === key
                ? "text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {key === "all"
              ? "All"
              : key === "pending"
              ? "Pending"
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


      {/* Empty */}
      {filteredDecisions.length === 0 && decisions.length === 0 && (
        <div className="text-center py-16 px-6">
          <p className="text-sm text-muted-foreground/80 mb-3 leading-relaxed">
            This is where your decisions start to reveal patterns.
          </p>
        </div>
      )}

      {/* List */}
      <div className="space-y-6">
        {statusFilter === "all" ? (
          <>
            {/* Didn’t happen */}
            {filteredDecisions.filter(d => d.worstOutcomeOccurred === false || d.worstOutcomeOccurred === undefined).length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground/50 mb-2">
                  Pending / Didn’t happen ({filteredDecisions.filter(d => d.worstOutcomeOccurred === false || d.worstOutcomeOccurred === undefined).length})
                </p>
                <div className="space-y-4">
                  {filteredDecisions
                    .filter(d => d.worstOutcomeOccurred === false || d.worstOutcomeOccurred === undefined)
                    .map((d) => (
                      <Link key={d.id} href={`/decision/${d.id}`}>
                        <div className={`p-4 border rounded-2xl transition-all active:scale-[0.98] ${
                          d.outcomeStatus === "pending" && d.reviewDate && d.reviewDate <= Date.now()
                            ? "bg-primary/5 border-primary/20 shadow-sm"
                            : "bg-background"
                        }`}>
                          <div className="flex justify-between">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                {d.outcomeStatus === "pending" && d.reviewDate && d.reviewDate <= Date.now() && (
                                  <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                                )}
                                <h2>{d.title}</h2>
                              </div>

                              {(d.worstCase || d.chosenAction) && (
                                <p className="mt-1 text-xs text-muted-foreground/70 font-light">
                                  {d.worstCase
                                    ? `Worried about ${d.worstCase}`
                                    : `Leaning toward ${d.chosenAction}`}
                                </p>
                              )}
                            </div>
                            {d.outcomeStatus === "recorded" ? (
                              <CheckCircle2 size={18} />
                            ) : (
                              <Circle size={18} />
                            )}
                          </div>

                          {d.outcomeStatus === "recorded" && (
                            <p className="mt-2 text-xs text-green-600 font-light">
                              Didn’t happen
                            </p>
                          )}
                          {d.outcomeStatus === "recorded" && (d.worstCase || d.chosenAction) && (
                            <p className="mt-1 text-[11px] text-muted-foreground/70 font-light leading-relaxed">
                              {d.worstCase
                                ? `Despite fearing "${d.worstCase}", outcome is ${d.worstOutcomeOccurred ? "it happened" : "it didn’t happen"}.`
                                : `Despite leaning toward "${d.chosenAction}", outcome is ${d.worstOutcomeOccurred ? "it happened" : "it didn’t happen"}.`}
                            </p>
                          )}

                          {d.outcomeStatus === "recorded" && (
                            <p className="mt-1 text-xs text-primary/80 flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-primary/70" />
                              Feared, didn’t happen
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            )}

            {/* Happened */}
            {filteredDecisions.filter(d => d.worstOutcomeOccurred === true).length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground/50 mb-2">
                  Happened ({filteredDecisions.filter(d => d.worstOutcomeOccurred === true).length})
                </p>
                <div className="space-y-4">
                  {filteredDecisions
                    .filter(d => d.worstOutcomeOccurred === true)
                    .map((d) => (
                      <Link key={d.id} href={`/decision/${d.id}`}>
                        <div className={`p-4 border rounded-2xl transition-all active:scale-[0.98] ${
                          d.outcomeStatus === "pending" && d.reviewDate && d.reviewDate <= Date.now()
                            ? "bg-primary/5 border-primary/20 shadow-sm"
                            : "bg-background"
                        }`}>
                          <div className="flex justify-between">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                {d.outcomeStatus === "pending" && d.reviewDate && d.reviewDate <= Date.now() && (
                                  <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                                )}
                                <h2>{d.title}</h2>
                              </div>

                              {(d.worstCase || d.chosenAction) && (
                                <p className="mt-1 text-xs text-muted-foreground/70 font-light">
                                  {d.worstCase
                                    ? `Worried about ${d.worstCase}`
                                    : `Leaning toward ${d.chosenAction}`}
                                </p>
                              )}
                            </div>
                            {d.outcomeStatus === "recorded" ? (
                              <CheckCircle2 size={18} />
                            ) : (
                              <Circle size={18} />
                            )}
                          </div>

                          {d.outcomeStatus === "recorded" && (
                            <p className="mt-2 text-xs text-amber-600 font-light">
                              Happened
                            </p>
                          )}
                          {d.outcomeStatus === "recorded" && (d.worstCase || d.chosenAction) && (
                            <p className="mt-1 text-[11px] text-muted-foreground/70 font-light leading-relaxed">
                              {d.worstCase
                                ? `Despite fearing "${d.worstCase}", outcome is ${d.worstOutcomeOccurred ? "it happened" : "it didn’t happen"}.`
                                : `Despite leaning toward "${d.chosenAction}", outcome is ${d.worstOutcomeOccurred ? "it happened" : "it didn’t happen"}.`}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            {filteredDecisions.map((d) => (
              <Link key={d.id} href={`/decision/${d.id}`}>
                <div
                  className={`p-4 border rounded-2xl transition-all active:scale-[0.98] ${
                    d.outcomeStatus === "pending" && d.reviewDate && d.reviewDate <= Date.now()
                      ? "bg-primary/5 border-primary/20 shadow-sm"
                      : "bg-background"
                  } ${
                    d.outcomeStatus === "recorded" &&
                    d.worstOutcomeOccurred === false &&
                    d.worstCase
                      ? "bg-emerald-50/40 border-emerald-200/40"
                      : ""
                  }`}
                >
                  <div className="flex justify-between">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        {d.outcomeStatus === "pending" && d.reviewDate && d.reviewDate <= Date.now() && (
                          <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                        )}
                        <h2>{d.title}</h2>
                      </div>

                      {/* Memory cue */}
                      {(d.worstCase || d.chosenAction) && (
                        <p className="mt-1 text-xs text-muted-foreground/70 font-light">
                          {d.worstCase
                            ? `Worried about ${d.worstCase}`
                            : `Leaning toward ${d.chosenAction}`}
                        </p>
                      )}
                    </div>
                    {d.outcomeStatus === "recorded" ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <Circle size={18} />
                    )}
                  </div>
                  {/* Outcome signal */}
                  {d.outcomeStatus === "recorded" && d.worstOutcomeOccurred !== undefined && (
                    <p
                      className={`mt-2 text-xs font-light ${
                        d.worstOutcomeOccurred
                          ? "text-amber-600"
                          : "text-green-600"
                      }`}
                    >
                      {d.worstOutcomeOccurred ? "Happened" : "Didn’t happen"}
                    </p>
                  )}
                  {d.outcomeStatus === "recorded" && (d.worstCase || d.chosenAction) && (
                    <p className="mt-1 text-[11px] text-muted-foreground/70 font-light leading-relaxed">
                      {d.worstCase
                        ? `Despite fearing "${d.worstCase}", outcome is ${d.worstOutcomeOccurred ? "it happened" : "it didn’t happen"}.`
                        : `Despite leaning toward "${d.chosenAction}", outcome is ${d.worstOutcomeOccurred ? "it happened" : "it didn’t happen"}.`}
                    </p>
                  )}
                  {/* Contradiction cue */}
                  {d.outcomeStatus === "recorded" &&
                    d.worstOutcomeOccurred === false && (
                      <p className="mt-1 text-xs text-primary/80 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-primary/70" />
                        Feared, didn’t happen
                      </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
