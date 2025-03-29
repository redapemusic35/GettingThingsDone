import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Calendar, Archive, Menu, FolderKanban, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 fixed w-full z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <span className="text-xl font-bold text-primary cursor-pointer">GTD Task Manager</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {!isMobile ? (
                <>
                  <Link href="/calendar">
                    <Button variant="ghost" className="flex items-center">
                      <Calendar className="mr-1 h-4 w-4" />
                      Calendar
                    </Button>
                  </Link>
                  <Link href="/projects">
                    <Button variant="ghost" className="flex items-center">
                      <FolderKanban className="mr-1 h-4 w-4" />
                      Projects
                    </Button>
                  </Link>
                  <Link href="/archive">
                    <Button variant="ghost" className="flex items-center">
                      <Archive className="mr-1 h-4 w-4" />
                      Archive
                    </Button>
                  </Link>
                  <Link href="/taskwarrior">
                    <Button variant="ghost" className="flex items-center">
                      <Workflow className="mr-1 h-4 w-4" />
                      TaskWarrior
                    </Button>
                  </Link>
                </>
              ) : (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <div className="flex flex-col space-y-4 mt-8">
                      <Link href="/">
                        <Button
                          variant={location === "/" ? "default" : "ghost"}
                          className="w-full justify-start"
                        >
                          Tasks
                        </Button>
                      </Link>
                      <Link href="/calendar">
                        <Button
                          variant={location === "/calendar" ? "default" : "ghost"}
                          className="w-full justify-start"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Calendar
                        </Button>
                      </Link>
                      <Link href="/projects">
                        <Button
                          variant={location === "/projects" ? "default" : "ghost"}
                          className="w-full justify-start"
                        >
                          <FolderKanban className="mr-2 h-4 w-4" />
                          Projects
                        </Button>
                      </Link>
                      <Link href="/archive">
                        <Button
                          variant={location === "/archive" ? "default" : "ghost"}
                          className="w-full justify-start"
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </Button>
                      </Link>
                      <Link href="/taskwarrior">
                        <Button
                          variant={location === "/taskwarrior" ? "default" : "ghost"}
                          className="w-full justify-start"
                        >
                          <Workflow className="mr-2 h-4 w-4" />
                          TaskWarrior
                        </Button>
                      </Link>
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </div>
          
          {/* Navigation Tabs (mobile only) */}
          {isMobile && (
            <div className="flex border-b border-gray-200 overflow-x-auto">
              <Link href="/">
                <Button
                  variant="link"
                  className={`px-4 py-2 text-sm font-medium ${
                    location === "/"
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Tasks
                </Button>
              </Link>
              <Link href="/calendar">
                <Button
                  variant="link"
                  className={`px-4 py-2 text-sm font-medium ${
                    location === "/calendar"
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Calendar
                </Button>
              </Link>
              <Link href="/projects">
                <Button
                  variant="link"
                  className={`px-4 py-2 text-sm font-medium ${
                    location === "/projects"
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Projects
                </Button>
              </Link>
              <Link href="/archive">
                <Button
                  variant="link"
                  className={`px-4 py-2 text-sm font-medium ${
                    location === "/archive"
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Archive
                </Button>
              </Link>
              <Link href="/taskwarrior">
                <Button
                  variant="link"
                  className={`px-4 py-2 text-sm font-medium ${
                    location === "/taskwarrior"
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  TaskW
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-32 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
