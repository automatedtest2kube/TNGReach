import { createFileRoute } from "@tanstack/react-router";
import AdminIndexPage from "@/admin-original/pages/Index";

export const Route = createFileRoute("/admin")({
  component: AdminRoute,
  head: () => ({
    meta: [
      { title: "TNG Reach — Admin" },
      {
        name: "description",
        content: "Admin migration and analytics page for TNG Reach.",
      },
    ],
  }),
});

function AdminRoute() {
  return <AdminIndexPage />;
}
