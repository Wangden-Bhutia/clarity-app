import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  OUTCOME_OPTIONS,
  REFLECTION_OPTIONS,
  ATTRIBUTION_OPTIONS,
} from '@/components/outcomeModal.config';

type OutcomeModalProps = {
  saveOutcome: () => void;
  outcomeData: {
    outcomeResult?: string;
    surprises?: string;
    outcomeAttribution?: string;
  };
  setOutcomeData: React.Dispatch<
    React.SetStateAction<{
      outcomeResult?: string;
      surprises?: string;
      outcomeAttribution?: string;
      [key: string]: any;
    }>
  >;
};

function OutcomeModal({
  saveOutcome,
  outcomeData,
  setOutcomeData
}: OutcomeModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="bg-primary text-white/90 px-5 py-1.5 rounded-full text-sm font-normal hover:opacity-90 transition-transform hover:scale-105 shadow-md shadow-primary/20">
          Record Outcome
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30" />

        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[94%] max-w-xl rounded-3xl border border-border/60 bg-card px-6 py-7 shadow-xl shadow-black/5">
          <Dialog.Close className="absolute top-4 right-4 text-muted-foreground/50 hover:text-muted-foreground">
            ×
          </Dialog.Close>

          <div>
            <h3 className="text-sm font-medium mb-2">How did it turn out?</h3>
            <div className="grid grid-cols-2 gap-3">
              {OUTCOME_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() =>
                    setOutcomeData((prev) => ({
                      ...prev,
                      outcomeResult: prev.outcomeResult === option ? undefined : option
                    }))
                  }
                  className={`w-full min-h-[38px] px-2 py-0.5 rounded-full text-[10px] font-normal border transition-colors ${
                    outcomeData.outcomeResult === option
                      ? "bg-primary text-white border-primary"
                      : "bg-muted/70 text-foreground border-border/50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">What did this reveal?</h3>
            <div className="grid grid-cols-2 gap-3">
              {REFLECTION_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() =>
                    setOutcomeData((prev) => ({
                      ...prev,
                      surprises: prev.surprises === option ? undefined : option
                    }))
                  }
                  className={`w-full min-h-[38px] px-2 py-0.5 rounded-full text-[10px] font-normal border transition-colors ${
                    outcomeData.surprises === option
                      ? "bg-primary text-white border-primary"
                      : "bg-muted/70 text-foreground border-border/50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">
              Why did this happen?
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {ATTRIBUTION_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() =>
                    setOutcomeData((prev) => ({
                      ...prev,
                      outcomeAttribution:
                        prev.outcomeAttribution === option ? undefined : option
                    }))
                  }
                  className={`w-full min-h-[38px] px-2 py-0.5 rounded-full text-[10px] font-normal border transition-colors ${
                    outcomeData.outcomeAttribution === option
                      ? "bg-primary text-white border-primary"
                      : "bg-muted/70 text-foreground border-border/50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center mt-6">
            <button
              type="button"
              disabled={!outcomeData.outcomeResult}
              onClick={() => {
                if (!outcomeData.outcomeResult) return;
                saveOutcome();
                setOpen(false);
              }}
              className={`px-5 py-1.5 rounded-full text-sm font-normal transition-all ${
                outcomeData.outcomeResult
                  ? "bg-primary text-white/90 hover:opacity-90 hover:scale-105 shadow-md shadow-primary/20"
                  : "bg-muted/70 text-foreground border border-border/50 cursor-not-allowed"
              }`}
            >
              Save Outcome
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default OutcomeModal;