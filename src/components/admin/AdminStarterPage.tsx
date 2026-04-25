import { Link } from "@tanstack/react-router";
import { CheckCircle2, FileStack, Plug, Route } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const migrationSteps = [
  {
    title: "Move UI components first",
    detail:
      "Copy your page-level components into src/components/admin and keep names close to original so imports are easy to fix.",
  },
  {
    title: "Move static data and types",
    detail:
      "Bring data files into src/components/admin/data, then replace static JSON usage with API calls in the next pass.",
  },
  {
    title: "Wire APIs to this backend",
    detail:
      "Use /api/v1/transactions and /api/v1/users/:id/profile-transactions so the admin page reads real project data.",
  },
  {
    title: "Polish and protect route",
    detail:
      "After the page works, add access control and hide the route behind admin-only auth checks.",
  },
];

export function AdminStarterPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-xl border border-border bg-card p-6 md:p-8">
          <div className="mb-3 flex items-center gap-3">
            <Badge variant="secondary" className="gap-1">
              <Route className="h-3.5 w-3.5" />
              /admin
            </Badge>
            <Badge variant="outline">Migration Starter</Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Admin Page Scaffold Is Ready
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
            This page is your landing area to migrate the one-page project into this codebase. Start by
            moving visual components, then connect them to existing backend APIs.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {migrationSteps.map((step, index) => (
            <Card key={step.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Step {index + 1}: {step.title}
                </CardTitle>
                <CardDescription>{step.detail}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileStack className="h-4 w-4 text-primary" />
                Suggested Folder Mapping
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>`old/src/components/*` -> `src/components/admin/*`</p>
              <p>`old/src/data/*` -> `src/components/admin/data/*`</p>
              <p>`old/src/pages/Index.tsx` -> `src/routes/admin.tsx` + admin page component</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plug className="h-4 w-4 text-primary" />
                API Endpoints You Can Reuse
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>`GET /api/v1/transactions` for filtered transaction lists</p>
              <p>`GET /api/v1/users/:id/profile-transactions` for profile + history</p>
              <p>`GET /api/v1/users/:id` for full user detail object</p>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
