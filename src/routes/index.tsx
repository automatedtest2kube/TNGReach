import { createFileRoute } from "@tanstack/react-router";
import { IntegratedWalletApp } from "@/components/IntegratedWalletApp";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "TNG Reach — Get Started" },
      {
        name: "description",
        content: "Join TNG Reach — your friendly wallet for sending, saving, and shopping.",
      },
    ],
  }),
});

function Index() {
  return <IntegratedWalletApp />;
}
