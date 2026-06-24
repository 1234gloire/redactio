import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Redaction from "./pages/Redaction";
import Backoffice from "./pages/Backoffice";
import Organisations from "./pages/Organisations";
import Utilisateurs from "./pages/Utilisateurs";
import Audit from "./pages/Audit";
import Profil from "./pages/Profil";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dictionnaire from "./pages/Dictionnaire";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/redaction" component={Redaction} />
      <Route path="/backoffice" component={Backoffice} />
      <Route path="/organisations" component={Organisations} />
      <Route path="/utilisateurs" component={Utilisateurs} />
      <Route path="/audit" component={Audit} />
      <Route path="/profil" component={Profil} />
      <Route path="/dictionnaire" component={Dictionnaire} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
