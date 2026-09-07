import { signIn, signUp } from "@/lib/actions/auth";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const { error } = searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6 py-24">
      <div>
        <p className="text-sm font-medium text-neutral-500">
          Truck Dispatch Platform
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Sign in or create an account
        </h1>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <form className="flex flex-col gap-3">
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <input
          name="password"
          type="password"
          placeholder="Password (min. 6 characters)"
          required
          minLength={6}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <input
          name="organizationName"
          type="text"
          placeholder="Company name (only needed when signing up)"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <div className="flex gap-2 pt-1">
          <button
            formAction={signIn}
            className="flex-1 rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            Sign in
          </button>
          <button
            formAction={signUp}
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium dark:border-neutral-700"
          >
            Sign up
          </button>
        </div>
      </form>
    </main>
  );
}
