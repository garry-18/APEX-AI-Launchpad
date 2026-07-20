import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { ApexLogo } from "@/components/ApexLogo";

export const Route = createFileRoute("/unauthorized")({
  head: () => ({
    meta: [
      { title: "Unauthorized — APEX AI" },
      { name: "description", content: "You do not have permission to access this page." },
    ],
  }),
  component: UnauthorizedPage,
});

function UnauthorizedPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="w-full max-w-md card-surface p-8 text-center flex flex-col items-center">
        <ApexLogo size="lg" className="mb-6" />
        <div className="size-16 rounded-full bg-destructive/10 grid place-items-center text-destructive mb-6">
          <ShieldAlert className="size-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Access Denied</h1>
        <p className="text-muted-foreground text-sm mt-2 mb-6">
          You do not have the required permissions to view this dashboard. Please contact your
          administrator if you believe this is an error.
        </p>
        <Link
          to="/auth"
          className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium grid place-items-center hover:opacity-90 transition-opacity"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
