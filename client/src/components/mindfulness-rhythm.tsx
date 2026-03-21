import { useMemo } from "react";
import { Decision } from "@/lib/db";
import { format, subDays, startOfDay, isSameDay } from "date-fns";

interface MindfulnessRhythmProps {
  decisions: Decision[];
}

export default function MindfulnessRhythm({ decisions }: MindfulnessRhythmProps) {
  // Generate the last 28 days
  const days = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 28 }).map((_, i) => {
      const date = subDays(today, 27 - i);
      
      // Count interactions on this day (created or outcome recorded)
      const interactions = decisions.filter(d => {
        const createdOnDay = isSameDay(new Date(d.date), date);
        const outcomeOnDay = d.outcomeDate ? isSameDay(new Date(d.outcomeDate), date) : false;
        return createdOnDay || outcomeOnDay;
      }).length;

      return {
        date,
        interactions,
      };
    });
  }, [decisions]);

  return (
    <div className="p-8 rounded-3xl bg-card border border-border">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h3 className="text-sm uppercase tracking-widest text-foreground mb-1">Rhythm of Reflection</h3>
          <p className="text-muted-foreground font-light text-sm">Your recent moments of pause and clarity.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-light text-muted-foreground">
          <span>Rest</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-secondary/30"></div>
            <div className="w-3 h-3 rounded-full bg-primary/30"></div>
            <div className="w-3 h-3 rounded-full bg-primary/60"></div>
            <div className="w-3 h-3 rounded-full bg-primary"></div>
          </div>
          <span>Reflection</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3 sm:gap-4 md:gap-6">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="text-center text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-2">
            {day}
          </div>
        ))}
        {days.map((day, i) => {
          let bgClass = "bg-secondary/30";
          if (day.interactions === 1) bgClass = "bg-primary/30 shadow-sm";
          if (day.interactions === 2) bgClass = "bg-primary/60 shadow-md";
          if (day.interactions >= 3) bgClass = "bg-primary shadow-lg";

          return (
            <div 
              key={i} 
              className="flex justify-center group relative"
            >
              <div 
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full transition-all duration-500 ease-in-out ${bgClass} hover:scale-125`}
              ></div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-foreground text-background text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {format(day.date, 'MMM d')}: {day.interactions} {day.interactions === 1 ? 'reflection' : 'reflections'}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 pt-6 border-t border-border/50 text-center">
        <p className="text-sm font-light text-foreground/80 italic">
          "Consistency is not about never breaking the chain, but about always returning to the practice."
        </p>
      </div>
    </div>
  );
}