import Link from "next/link";
import { createBroker } from "@/lib/actions/brokers";

const inputClass =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900";

export default function NewBrokerPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
      <div>
        <Link href="/brokers" className="text-sm text-neutral-500 hover:underline">
          &larr; Brokers
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">New broker</h1>
      </div>

      <form action={createBroker} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Broker name *
          <input name="name" type="text" required className={inputClass} />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            MC number
            <input name="mcNumber" type="text" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            DOT number
            <input name="dotNumber" type="text" className={inputClass} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Phone
            <input name="phone" type="tel" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Email
            <input name="email" type="email" className={inputClass} />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Website
          <input name="website" type="text" placeholder="https://" className={inputClass} />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Payment terms
            <input
              name="paymentTerms"
              type="text"
              placeholder="e.g. Net 30, QuickPay"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Credit rating
            <input name="creditRating" type="text" className={inputClass} />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Status
          <select name="status" defaultValue="active" className={inputClass}>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Notes
          <textarea name="notes" rows={3} className={inputClass} />
        </label>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            Create broker
          </button>
          <Link
            href="/brokers"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
