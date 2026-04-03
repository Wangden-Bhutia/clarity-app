import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import Layout from "./components/layout";
import Home from "./pages/home";
import DecisionFlow from "./pages/decision-flow";
import QuickFlow from "./pages/quick-flow";
import FrameworkFlow from "./pages/framework-flow";
import Journal from "./pages/journal";
import Timeline from "./pages/timeline";
import Settings from "./pages/settings";
import DecisionSummary from "./pages/decision-summary";
import NotFound from "@/pages/not-found";
import ProfilePage from "./pages/profile";
import PinLock from "./components/pin-lock";

function Router() {
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
        const lastOpened = localStorage.getItem('clarity_last_opened');
        const now = Date.now();
        
        localStorage.setItem('clarity_last_opened', now.toString());
        
        const allDecisions = await db.getAllDecisions();
        
        const isFirstLaunch = !hasSeenOnboarding && allDecisions.length === 0;
        
        let isReturningAfterInactivity = false;
        if (lastOpened && hasSeenOnboarding) {
          const daysSinceLastOpen = (now - parseInt(lastOpened)) / (1000 * 60 * 60 * 24);
          isReturningAfterInactivity = daysSinceLastOpen >= 7;
        }
        
        // if ((isFirstLaunch || isReturningAfterInactivity)) {
        //   window.history.replaceState({ isReturning: isReturningAfterInactivity }, '');
        //   setLocation('/profile');
        // }

        const storedPin = localStorage.getItem('app_pin');
        if (storedPin) {
          setIsLocked(true);
        }

      } catch (error) {
        console.error("Error checking app status:", error);
      } finally {
        // End checking immediately so UI can render
        setIsChecking(false);
      }
    };
    
    checkStatus();

    // -------- Idle Lock --------
    let idleTimer: any;

    const resetTimer = () => {
      localStorage.setItem("clarity_last_activity", Date.now().toString());
      clearTimeout(idleTimer);

      idleTimer = setTimeout(() => {
        const storedPin = localStorage.getItem("app_pin");
        const lastActivity = localStorage.getItem("clarity_last_activity");
        const now = Date.now();

        if (
          storedPin &&
          lastActivity &&
          now - parseInt(lastActivity) >= 2 * 60 * 1000
        ) {
          setIsLocked(true);
        }
      }, 2 * 60 * 1000);
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("touchstart", resetTimer);

    resetTimer();

    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
      clearTimeout(idleTimer);
    };
  }, [setLocation]);

  if (isChecking) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;

  if (isLocked) {
    return (
      <PinLock
        onUnlock={() => {
          setIsLocked(false);
          localStorage.setItem("clarity_last_activity", Date.now().toString());
          setLocation("/"); // 🔥 critical fix: reset route after unlock
        }}
      />
    );
  }


  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/flow" component={DecisionFlow} />
        <Route path="/quick-flow" component={QuickFlow} />
        <Route path="/framework-flow" component={FrameworkFlow} />
        <Route path="/journal" component={Journal} />
        <Route path="/decision/:id" component={DecisionSummary} />
        <Route path="/settings" component={Settings} />
        <Route path="/profile" component={ProfilePage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
