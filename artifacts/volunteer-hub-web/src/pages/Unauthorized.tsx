import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">Access Denied</h1>
        <p className="text-xl text-muted-foreground">
          You don't have permission to access this page.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Button asChild data-testid="btn-return-home">
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
