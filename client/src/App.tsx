import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import MobileApp from "./pages/MobileApp";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/server" component={Home} />
      <Route path="/mobile" component={MobileApp} />
      <Route path="/mixer" component={Home} />
      <Route path="/devices" component={Home} />
      <Route path="/mixes" component={Home} />
      <Route path="/presets" component={Home} />
      <Route path="/rehearsal" component={Home} />
      <Route path="/reports" component={Home} />
      <Route path="/settings" component={Home} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster theme="dark" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
