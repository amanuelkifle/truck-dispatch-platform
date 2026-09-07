export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-4 px-6 py-24">
      <p className="text-sm font-medium text-neutral-500">Phase 1 — Foundation</p>
      <h1 className="text-3xl font-semibold tracking-tight">
        Truck Dispatch Platform
      </h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        This is the project scaffold. The dispatch board, carrier/driver/truck
        management, load profitability engine, and financial dashboard from{" "}
        <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-sm dark:bg-neutral-800">
          docs/PROJECT_PLAN.md
        </code>{" "}
        get built on top of this.
      </p>
    </main>
  );
}
