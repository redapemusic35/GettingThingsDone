import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Calendar from "@/pages/Calendar";
import Archive from "@/pages/Archive";
import Projects from "@/pages/Projects";
import TaskWarrior from "@/pages/TaskWarrior";
import Layout from "@/components/Layout";
// client/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Footer from '@/components/ui/Footer';  // ← Correct path

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
{/* Footer goes OUTSIDE Switch, inside Layout */}
    <Footer />
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
