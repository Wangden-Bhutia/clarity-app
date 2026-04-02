import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Moon, Sun, Home, Book, Settings } from "lucide-react";
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
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">

      <header className="py-6 px-8 md:px-12 flex justify-between items-center">
        <Link href="/">
          <a className="font-serif text-2xl tracking-widest text-primary/90">
            Clarity
          </a>
        </Link>

        <button onClick={toggleTheme} className="p-2 rounded-full">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </header>

      <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto px-6 md:px-12 pb-24">
          {children}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 w-full border-t border-border bg-background">
        <div className="max-w-md mx-auto flex justify-around p-4">

          <Link href="/">
            <a className={`flex flex-col items-center ${location === '/' ? 'text-primary' : ''}`}>
              <Home size={20} />
              <span className="text-[10px]">Home</span>
            </a>
          </Link>

          <Link href="/journal">
            <a className={`flex flex-col items-center ${location === '/journal' ? 'text-primary' : ''}`}>
              <Book size={20} />
              <span className="text-[10px]">Journal</span>
            </a>
          </Link>

          <Link href="/settings">
            <a className={`flex flex-col items-center ${location === '/settings' ? 'text-primary' : ''}`}>
              <Settings size={20} />
              <span className="text-[10px]">Settings</span>
            </a>
          </Link>

        </div>
      </nav>

    </div>
  );
}
