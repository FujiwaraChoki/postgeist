import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Brain, Database, Sparkles, Github, Twitter } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: Brain,
    description: "Manage your Twitter analysis projects"
  },
  {
    name: "Data Management",
    href: "/data",
    icon: Database,
    description: "Monitor data usage and system status"
  }
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background">
      {/* Beautiful gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 glass backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 hidden md:flex">
            <Link to="/" className="mr-6 flex items-center space-x-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500" />
                <Avatar className="h-8 w-8 relative">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-sm">
                    P
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="hidden font-bold sm:inline-block bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Postgeist
              </span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              {navigation.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "relative transition-colors hover:text-foreground/80 flex items-center space-x-2 group",
                      isActive ? "text-foreground" : "text-foreground/60"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                    {isActive && (
                      <div className="absolute -bottom-[17px] left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <Button
                variant="outline"
                className="relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
              >
                <span className="hidden lg:inline-flex">Search anything...</span>
                <span className="inline-flex lg:hidden">Search...</span>
                <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </div>
            <nav className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" asChild>
                <a href="https://github.com/FujiwaraChoki/postgeist" target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" />
                  <span className="sr-only">GitHub</span>
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a href="https://twitter.com/fujiwarachoki" target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-4 w-4" />
                  <span className="sr-only">Twitter</span>
                </a>
              </Button>
            </nav>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative">
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="animate-fade-in">{children}</div>
        </div>
      </main>

      {/* Beautiful footer */}
      <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-xs">
                  P
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground">
                Built with ❤️ using <span className="font-medium text-foreground">Bun</span>,{" "}
                <span className="font-medium text-foreground">React</span>, and{" "}
                <span className="font-medium text-foreground">AI</span>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
