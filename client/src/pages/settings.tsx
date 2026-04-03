import { Shield, Download, Upload, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useState } from "react";

export default function Settings() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [firstPin, setFirstPin] = useState("");

  const [hasPin, setHasPin] = useState(
    typeof window !== "undefined" && !!localStorage.getItem("app_pin")
  );

  const [mode, setMode] = useState<"set" | "remove" | "change">("set");
  const [changePhase, setChangePhase] = useState<"verify" | "new" | "confirm">("verify");


  return (
    <div className="flex flex-col gap-6 py-6 pb-24 max-w-2xl mx-auto w-full">
      <header>
        <h1 className="text-3xl font-light mb-2">Settings</h1>
        <p className="text-muted-foreground font-light">
          Control your data and privacy.
        </p>
      </header>

      {/* Privacy */}
      <section className="space-y-4">
        <h2 className="text-sm uppercase tracking-widest text-foreground/80 border-b border-border/60 pb-2">
          Privacy
        </h2>

        {hasPin ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setMode("change");
                setChangePhase("verify");
                setShowPinModal(true);
                setPinInput("");
              }}
              className="w-full flex items-center justify-between p-6 rounded-2xl bg-card border border-border/50"
            >
              <span>Change PIN</span>
              <Shield />
            </button>

            <button
              onClick={() => {
                setMode("remove");
                setShowPinModal(true);
                setPinInput("");
              }}
              className="w-full flex items-center justify-between p-6 rounded-2xl bg-card border border-border/50"
            >
              <span>Remove PIN Lock</span>
              <Shield />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setMode("set");
              setShowPinModal(true);
              setPinInput("");
              setStep("enter");
            }}
            className="w-full flex items-center justify-between p-6 rounded-2xl bg-card border border-border/50"
          >
            <span>Set App PIN</span>
            <Shield />
          </button>
        )}

      </section>

      {/* Data */}
      <section className="space-y-4">
        <h2 className="text-sm uppercase tracking-widest text-foreground/80 border-b border-border/60 pb-2">
          Data
        </h2>

        <button
          onClick={() => {
            const data = localStorage.getItem("decisions");
            if (!data) return;
            const blob = new Blob([data], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "clarity-backup.json";
            a.click();
          }}
          className="w-full flex items-center justify-between p-6 rounded-2xl bg-card border border-border/50"
        >
          <>
            <span>Export Data</span>
            <Download size={18} />
          </>
        </button>

        <label className="w-full flex items-center justify-between p-6 rounded-2xl bg-card border border-border/50 cursor-pointer">
          <>
            <span>Import Data</span>
            <Upload size={18} />
          </>
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                localStorage.setItem("decisions", reader.result as string);
                toast({ title: "Data imported" });
              };
              reader.readAsText(file);
            }}
          />
        </label>
      </section>

      {/* About */}
      <section className="space-y-4">
        <h2 className="text-sm uppercase tracking-widest text-foreground/80 border-b border-border/60 pb-2">
          About
        </h2>

        <button
          onClick={() => setLocation("/profile")}
          className="w-full flex items-center justify-between p-6 rounded-2xl bg-card border border-border/50"
        >
          <span>How this works</span>
          <ArrowRight size={18} />
        </button>
      </section>
    {/* PIN Modal */}
    {showPinModal && (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div className="bg-card border border-border/50 rounded-2xl p-6 w-[280px] space-y-4 text-center">
          
          <p className="text-sm text-muted-foreground">
            {mode === "set"
              ? step === "enter"
                ? "Create PIN"
                : "Confirm PIN"
              : mode === "remove"
              ? "Enter current PIN to remove"
              : changePhase === "verify"
              ? "Enter current PIN"
              : changePhase === "new"
              ? "New PIN"
              : "Confirm new PIN"}
          </p>

          <div className="flex justify-center gap-2 mb-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  pinInput.length > i ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[1,2,3,4,5,6,7,8,9].map((num) => (
              <button
                key={num}
                onClick={() => {
                  if (pinInput.length < 4) setPinInput(pinInput + num);
                }}
                className="py-3 rounded-lg bg-secondary/40 active:scale-[0.95]"
              >
                {num}
              </button>
            ))}

            <button
              onClick={() => setPinInput(pinInput.slice(0, -1))}
              className="py-3 rounded-lg bg-secondary/40"
            >
              ⌫
            </button>

            <button
              onClick={() => {
                if (pinInput.length < 4) setPinInput(pinInput + "0");
              }}
              className="py-3 rounded-lg bg-secondary/40"
            >
              0
            </button>

            <div />
          </div>

          <button
            onClick={() => {
              if (pinInput.length < 4) return;

              const storedPin = localStorage.getItem("app_pin");

              // SET PIN
              if (mode === "set") {
                if (step === "enter") {
                  setFirstPin(pinInput);
                  setPinInput("");
                  setStep("confirm");
                  return;
                }

                if (pinInput !== firstPin) {
                  toast({ title: "PINs do not match", variant: "destructive" });
                  setPinInput("");
                  return;
                }

                localStorage.setItem("app_pin", firstPin);
                setHasPin(true);
                toast({ title: "PIN set" });
                setShowPinModal(false);
                return;
              }

              // REMOVE PIN
              if (mode === "remove") {
                if (pinInput === storedPin) {
                  localStorage.removeItem("app_pin");
                  setHasPin(false);
                  toast({ title: "PIN removed" });
                } else {
                  toast({ title: "Incorrect PIN", variant: "destructive" });
                }
                setShowPinModal(false);
                return;
              }

              // CHANGE PIN
              if (mode === "change") {
                if (changePhase === "verify") {
                  if (pinInput === storedPin) {
                    setChangePhase("new");
                    setPinInput("");
                  } else {
                    toast({ title: "Incorrect PIN", variant: "destructive" });
                  }
                  return;
                }

                if (changePhase === "new") {
                  setFirstPin(pinInput);
                  setPinInput("");
                  setChangePhase("confirm");
                  return;
                }

                if (changePhase === "confirm") {
                  if (pinInput !== firstPin) {
                    toast({ title: "PINs do not match", variant: "destructive" });
                    setPinInput("");
                    return;
                  }

                  localStorage.setItem("app_pin", firstPin);
                  toast({ title: "PIN updated" });
                  setShowPinModal(false);
                  return;
                }
              }
            }}
            className="w-full py-2 rounded-full bg-primary text-primary-foreground text-xs"
          >
            {mode === "set"
              ? step === "enter"
                ? "Next"
                : "Confirm"
              : mode === "remove"
              ? "Remove"
              : changePhase === "confirm"
              ? "Confirm"
              : "Next"}
          </button>

          <button
            onClick={() => setShowPinModal(false)}
            className="text-xs text-muted-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    )}
    </div>
  );
}
