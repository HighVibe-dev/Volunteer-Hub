import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
