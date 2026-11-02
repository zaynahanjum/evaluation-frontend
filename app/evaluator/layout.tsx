import { Suspense } from "react";

import { EvaluatorShell } from "@/components/evaluator/shell/evaluator-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { EvaluatorWorkspaceProvider } from "@/lib/evaluator/workspace";

export default function EvaluatorLayout({
  children,
}: LayoutProps<"/evaluator">) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-muted/40 p-6">
          <Skeleton className="h-16 w-full" />
        </main>
      }
    >
      <EvaluatorWorkspaceProvider>
        <EvaluatorShell>{children}</EvaluatorShell>
      </EvaluatorWorkspaceProvider>
    </Suspense>
  );
}
