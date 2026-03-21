import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Upload, Download, Trash2, Database, Shield, Monitor, Info } from "lucide-react";
import { db } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [pauseEnabled, setPauseEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const pauseSetting = await db.getSetting('enablePause', true);
      setPauseEnabled(pauseSetting);
      setIsLoading(false);
    };
    loadSettings();
  }, []);

  const handlePauseToggle = async (enabled: boolean) => {
    setPauseEnabled(enabled);
    await db.setSetting('enablePause', enabled);
  };

  const handleExport = async () => {
    try {
      const decisions = await db.getAllDecisions();
      const exportData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        decisions: decisions
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `clarity-export-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast({
        title: "Export Successful",
        description: `Exported ${decisions.length} decisions to file.`,
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting your data.",
        variant: "destructive"
      });
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        if (!parsed.decisions || !Array.isArray(parsed.decisions)) {
          throw new Error("Invalid format");
        }
        
        let importedCount = 0;
        for (const decision of parsed.decisions) {
          // Check if exists
          const existing = await db.getDecision(decision.id);
          if (!existing) {
            await db.saveDecision(decision);
            importedCount++;
          }
        }
        
        toast({
          title: "Import Successful",
          description: `Imported ${importedCount} new decisions.`,
        });
        
        // Reset file input
        event.target.value = '';
      } catch (error) {
        console.error("Import failed:", error);
        toast({
          title: "Import Failed",
          description: "The file format was invalid.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) return null;

  return (
    <div className="flex flex-col gap-12 py-8 md:py-12 max-w-2xl mx-auto w-full">
      <header>
        <h1 className="text-3xl md:text-5xl font-light mb-4">Settings</h1>
        <p className="text-muted-foreground font-light">Preferences and data management.</p>
      </header>

      {/* Preferences Section */}
      <section className="space-y-6">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b border-border pb-2">
          <Monitor size={16} /> Preferences
        </h2>
        
        <div className="flex items-center justify-between p-6 rounded-2xl bg-card border border-border">
          <div>
            <h3 className="font-serif text-xl mb-1">Mindful Pause</h3>
            <p className="text-sm text-muted-foreground font-light">
              Show a 30-second breathing exercise before starting a new reflection.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={pauseEnabled}
              onChange={(e) => handlePauseToggle(e.target.checked)}
              data-testid="toggle-pause"
            />
            <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="space-y-6">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b border-border pb-2">
          <Shield size={16} /> Privacy & Security
        </h2>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border">
          <div>
            <h3 className="font-serif text-xl mb-1">App Lock PIN</h3>
            <p className="text-sm text-muted-foreground font-light">
              Require a 4-digit PIN to open Clarity on this device.
            </p>
          </div>
          <button 
            onClick={() => {
              if (localStorage.getItem('clarity_pin')) {
                if (confirm('Are you sure you want to remove your PIN?')) {
                  localStorage.removeItem('clarity_pin');
                  toast({ title: "PIN Removed" });
                  window.location.reload(); // Force refresh to show changes
                }
              } else {
                const pin = prompt('Enter a 4-digit PIN:');
                if (pin && /^\d{4}$/.test(pin)) {
                  localStorage.setItem('clarity_pin', pin);
                  toast({ title: "PIN Set Successfully" });
                  window.location.reload(); // Force refresh
                } else if (pin) {
                  toast({ title: "Invalid PIN", description: "Must be exactly 4 digits.", variant: "destructive" });
                }
              }
            }}
            className="shrink-0 px-6 py-2 rounded-full border border-border text-foreground tracking-widest uppercase text-xs hover:bg-secondary transition-colors"
          >
            {localStorage.getItem('clarity_pin') ? 'Remove PIN' : 'Set PIN'}
          </button>
        </div>
        
        <div className="p-6 rounded-2xl bg-secondary/30 border border-border/50">
          <p className="font-light leading-relaxed text-sm text-foreground/80 mb-4">
            Clarity is designed with absolute privacy in mind. There are no accounts, no cloud sync, and no tracking.
          </p>
          <p className="font-light leading-relaxed text-sm text-foreground/80">
            <strong>All your data is stored locally on this specific device and browser.</strong> If you clear your browser data or change devices, your reflections will not carry over unless you manually export and import them.
          </p>
        </div>
      </section>

      {/* Data Section */}
      <section className="space-y-6">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b border-border pb-2">
          <Database size={16} /> Data Management
        </h2>
        
        <div className="grid gap-4">
          <button 
            onClick={handleExport}
            className="flex items-center justify-between p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors text-left group"
            data-testid="button-export"
          >
            <div>
              <h3 className="font-medium mb-1 group-hover:text-primary transition-colors">Export Data</h3>
              <p className="text-sm text-muted-foreground font-light">Download all your decisions as a JSON file for backup.</p>
            </div>
            <Download className="text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
          
          <div className="relative">
            <input 
              type="file" 
              accept=".json"
              onChange={handleImport}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              data-testid="input-import"
            />
            <div className="flex items-center justify-between p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors pointer-events-none group">
              <div>
                <h3 className="font-medium mb-1 group-hover:text-primary transition-colors">Import Data</h3>
                <p className="text-sm text-muted-foreground font-light">Restore from a previous backup file.</p>
              </div>
              <Upload className="text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="space-y-6">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b border-border pb-2">
          <Info size={16} /> About
        </h2>
        
        <button 
          onClick={() => {
            window.history.replaceState({ isReturning: true }, '');
            setLocation('/onboarding');
          }}
          className="w-full flex items-center justify-between p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors text-left group"
        >
          <div>
            <h3 className="font-serif text-xl mb-1 group-hover:text-primary transition-colors">How this works</h3>
            <p className="text-sm text-muted-foreground font-light">
              Revisit the introductory guide.
            </p>
          </div>
          <span className="text-muted-foreground group-hover:text-primary transition-colors">→</span>
        </button>
      </section>
    </div>
  );
}
