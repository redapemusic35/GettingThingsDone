import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./client/src/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./client/src/components/ui/toaster";
import NotFound from "./client/src/pages/not-found";
import Home from "./client/src/pages/Home";
import Calendar from "./client/src/pages/Calendar";
import Archive from "./client/src/pages/Archive";
import Projects from "./client/src/pages/Projects";
import TaskWarrior from "./client/src/pages/TaskWarrior";
import Layout from "./client/src/components/Layout";
import Footer from "./client/src/components/ui/Footer";  // ← Correct path

// NEW: Import Auth + Login
import { useAuth } from "./client/src/hooks/useAuth";
import LoginScreen from "./client/src/pages/LoginScreen";
import Router from "./client/src/AppWrapper";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/archive" component={Archive} />
        <Route path="/projects" component={Projects} />
        <Route path="/taskwarrior" component={TaskWarrior} />
        <Route component={NotFound} />
      </Switch>
      <Footer />
    </Layout>
  );
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {user ? <Router /> : <LoginScreen onSuccess={() => {}} />}
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
