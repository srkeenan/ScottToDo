import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default function Home() {
  const isDemo = process.env.DEMO_MODE === "true";
  return <Dashboard isDemo={isDemo} />;
}
