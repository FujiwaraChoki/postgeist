import { useState } from "react";
import { User, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import apiService from "../lib/api";
import { sanitizeUsername, validateUsername } from "../lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "input" | "scraping" | "analyzing" | "complete";

export default function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("input");
  const [progress, setProgress] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanUsername = sanitizeUsername(username);
    if (!validateUsername(cleanUsername)) {
      toast.error("Please enter a valid Twitter username (1-15 characters, letters, numbers, and underscores only)");
      return;
    }

    try {
      setLoading(true);
      setProgress(0);

      // Step 1: Scrape posts
      setStep("scraping");
      setProgress(25);
      await apiService.scrapePosts(cleanUsername);
      setProgress(50);

      // Step 2: Analyze user
      setStep("analyzing");
      setProgress(75);
      await apiService.analyzeUser(cleanUsername);
      setProgress(100);

      // Step 3: Complete
      setStep("complete");

      setTimeout(() => {
        toast.success(`Successfully added and analyzed @${cleanUsername}!`);
        handleClose();
        onSuccess();
      }, 1500);
    } catch (error) {
      toast.error(`Failed to add user: ${error}`);
      setStep("input");
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setUsername("");
      setStep("input");
      setProgress(0);
      onClose();
    }
  };

  const getStepContent = () => {
    switch (step) {
      case "scraping":
        return {
          title: "Scraping Twitter Posts",
          description: "Collecting recent posts from the user's timeline...",
          icon: <Loader2 className="h-8 w-8 animate-spin text-primary" />
        };
      case "analyzing":
        return {
          title: "Analyzing with AI",
          description: "Processing writing patterns, themes, and style...",
          icon: <Loader2 className="h-8 w-8 animate-spin text-primary" />
        };
      case "complete":
        return {
          title: "Analysis Complete!",
          description: "Successfully analyzed the user's content and style",
          icon: <CheckCircle className="h-8 w-8 text-green-500" />
        };
      default:
        return null;
    }
  };

  const stepContent = getStepContent();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add Twitter User
          </DialogTitle>
          <DialogDescription>
            Add a Twitter user to analyze their posting patterns and generate content ideas.
          </DialogDescription>
        </DialogHeader>

        {step === "input" ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium leading-none">
                Twitter Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">@</span>
                <Input
                  id="username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="username"
                  className="pl-8"
                  disabled={loading}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">Enter the Twitter username without the @ symbol</p>
            </div>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  What happens next?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                  We'll scrape their recent Twitter posts
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                  AI will analyze their writing style and themes
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                  You'll be able to generate content ideas in their style
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !username.trim()} className="min-w-[100px]">
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <User className="w-4 h-4 mr-2" />
                    Add User
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center py-8 space-y-6">
            <div className="flex justify-center">{stepContent?.icon}</div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{stepContent?.title}</h3>
              <p className="text-sm text-muted-foreground">{stepContent?.description}</p>
            </div>

            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-muted-foreground">{progress}% complete</p>
            </div>

            {step !== "complete" && <p className="text-xs text-muted-foreground">This may take a few minutes...</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
