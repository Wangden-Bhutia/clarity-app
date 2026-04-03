import { useState, useEffect } from "react";
import { Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PinLockProps {
  onUnlock: () => void;
}

export default function PinLock({ onUnlock }: PinLockProps) {
  const { toast } = useToast();
  const [pin, setPin] = useState("");
  const [storedPin, setStoredPin] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("app_pin") : null
  );

  useEffect(() => {
    if (!storedPin) {
      onUnlock();
    }
  }, [storedPin, onUnlock]);

  if (!storedPin) return null;

  const handleInput = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      if (newPin.length === 4) {
        if (storedPin) {
          if (newPin === storedPin) {
            setPin(""); // clear immediately to prevent second UI state
            onUnlock();
            return;
          } else {
            toast({
              title: "Incorrect PIN",
              description: "Please try again.",
              variant: "destructive"
            });
            setTimeout(() => setPin(""), 500);
          }
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
          <Lock size={24} />
        </div>
        <h1 className="text-3xl font-serif mb-2">Clarity is Locked</h1>
        <p className="text-muted-foreground font-light">Enter your PIN to access your private journal.</p>
      </div>

      <div className="flex gap-4 mb-12">
        {[0, 1, 2, 3].map((i) => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pin.length ? 'bg-primary' : 'bg-secondary'}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-[280px] w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleInput(num.toString())}
            className="w-full aspect-square rounded-full bg-secondary/30 hover:bg-secondary flex items-center justify-center text-2xl font-light transition-colors active:scale-95"
          >
            {num}
          </button>
        ))}
        <div></div>
        <button
          onClick={() => handleInput("0")}
          className="w-full aspect-square rounded-full bg-secondary/30 hover:bg-secondary flex items-center justify-center text-2xl font-light transition-colors active:scale-95"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="w-full aspect-square rounded-full bg-transparent hover:bg-secondary/20 flex items-center justify-center text-sm uppercase tracking-widest text-muted-foreground transition-colors active:scale-95"
        >
          Del
        </button>
      </div>
    </div>
  );
}