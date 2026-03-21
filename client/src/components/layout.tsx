import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Moon, Sun, Home, Book, Clock, Settings, PenTool } from "lucide-react";
import { db } from "@/lib/db";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await db.getSetting('theme', 'light');
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    await db.setSetting('theme', newTheme);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-1000">
      <header className="py-6 px-8 md:px-12 flex justify-between items-center bg-transparent z-10 animate-fade-in-slow">
        <Link href="/">
          <a className="font-serif text-2xl tracking-widest text-foreground/80 hover:text-foreground transition-colors cursor-pointer">
            Clarity
          </a>
        </Link>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1 rounded-full bg-secondary/30 text-[9px] md:text-[10px] tracking-widest text-muted-foreground border border-border whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/70"></span>
            <span>A StillMind Labs creation</span>
          </div>
          <button 
            onClick={toggleTheme} 
            className="text-foreground/60 hover:text-foreground transition-colors p-2 rounded-full hover:bg-foreground/5 shrink-0"
            data-testid="button-toggle-theme"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} strokeWidth={1.5} /> : <Sun size={20} strokeWidth={1.5} />}
          </button>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 md:px-12 pb-24 flex flex-col animate-slide-up-slow">
        {children}
      </main>
      
      <nav className="fixed bottom-0 left-0 w-full bg-background/80 backdrop-blur-md border-t border-border z-50">
        <div className="max-w-md mx-auto flex justify-around items-center p-4">
          <Link href="/">
            <a className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${location === '/' ? 'text-primary' : 'text-foreground/60 hover:text-foreground/90 hover:bg-foreground/5'}`}>
              <Home size={20} strokeWidth={location === '/' ? 2 : 1.5} />
              <span className="text-[10px] tracking-wider uppercase">Home</span>
            </a>
          </Link>
          <Link href="/flow">
            <a className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${location === '/flow' ? 'text-primary' : 'text-foreground/60 hover:text-foreground/90 hover:bg-foreground/5'}`}>
              <PenTool size={20} strokeWidth={location === '/flow' ? 2 : 1.5} />
              <span className="text-[10px] tracking-wider uppercase">Reflect</span>
            </a>
          </Link>
          <Link href="/journal">
            <a className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${location === '/journal' ? 'text-primary' : 'text-foreground/60 hover:text-foreground/90 hover:bg-foreground/5'}`}>
              <Book size={20} strokeWidth={location === '/journal' ? 2 : 1.5} />
              <span className="text-[10px] tracking-wider uppercase">Journal</span>
            </a>
          </Link>
          <Link href="/timeline">
            <a className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${location === '/timeline' ? 'text-primary' : 'text-foreground/60 hover:text-foreground/90 hover:bg-foreground/5'}`}>
              <Clock size={20} strokeWidth={location === '/timeline' ? 2 : 1.5} />
              <span className="text-[10px] tracking-wider uppercase">Timeline</span>
            </a>
          </Link>
          <Link href="/settings">
            <a className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${location === '/settings' ? 'text-primary' : 'text-foreground/60 hover:text-foreground/90 hover:bg-foreground/5'}`}>
              <Settings size={20} strokeWidth={location === '/settings' ? 2 : 1.5} />
              <span className="text-[10px] tracking-wider uppercase">Settings</span>
            </a>
          </Link>
        </div>
      </nav>
    </div>
  );
}
