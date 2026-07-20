import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Audit from "./pages/Audit";
import Backoffice from "./pages/Backoffice";
import Dashboard from "./pages/Dashboard";
import Conformite from "./pages/Conformite";
import Dictionnaire from "./pages/Dictionnaire";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Organisations from "./pages/Organisations";
import Paiement from "./pages/Paiement";
import Profil from "./pages/Profil";
import Redaction from "./pages/Redaction";
import RedactionChirurgieOrthopedique from "./pages/RedactionChirurgieOrthopedique";
import RedactionCorrespondanceMedicale from "./pages/RedactionCorrespondanceMedicale";
import Tutoriels from "./pages/Tutoriels";
import Utilisateurs from "./pages/Utilisateurs";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/paiement" component={Paiement} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/conformite" component={Conformite} />
      <Route path="/redaction/chirurgie-orthopedique" component={RedactionChirurgieOrthopedique} />
      <Route path="/redaction/correspondance-medicale" component={RedactionCorrespondanceMedicale} />
      <Route path="/redaction" component={Redaction} />
      <Route path="/tutoriels" component={Tutoriels} />
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
