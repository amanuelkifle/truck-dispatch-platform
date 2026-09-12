import Link from "next/link";
import { Space_Grotesk } from "next/font/google";
import { submitContactMessage } from "@/lib/actions/contact";

// Self-hosted at build time by Next.js - no runtime request to Google Fonts,
// so this doesn't add any external network dependency to the deployed app.
const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

function IconTruck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M2 6.5h11a1 1 0 0 1 1 1V16H3a1 1 0 0 1-1-1V6.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M14 9.5h4l3 3.2V16h-7V9.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="6.5" cy="17.5" r="1.8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17" cy="17.5" r="1.8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconDocument({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6 3.5h8l4 4V19a1.2 1.2 0 0 1-1.2 1.2H6.8A1.2 1.2 0 0 1 5.6 19V4.7A1.2 1.2 0 0 1 6 3.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8.3 11h7.4M8.3 14.3h7.4M8.3 17.6h4.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 20V10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M11 20V6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M18 20v-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M2.5 20h19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconPin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 21s-6.5-5.7-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.3-6.5 11-6.5 11Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconBolt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M13 2 4.5 13.5H11L10.5 22 19.5 10H13l.5-8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLayers({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="m12 3 9 4.6-9 4.6-9-4.6L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="m3 12.4 9 4.6 9-4.6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="m3 16.8 9 4.6 9-4.6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function HeroIllustration() {
  return (
    <svg viewBox="0 0 480 320" className="w-full max-w-lg" role="img" aria-label="Illustration of a red semi-truck cab, viewed head-on, no trailer attached">
      {/* sun + background road lines */}
      <circle cx="380" cy="58" r="44" fill="currentColor" className="text-amber-200 dark:text-amber-900/40" />
      <path
        d="M40 92c26-18 60-18 86 0s60 18 86 0 60-18 86 0 60 18 86 0"
        stroke="currentColor"
        strokeWidth="2"
        className="text-neutral-300 dark:text-neutral-700"
        fill="none"
      />

      {/* exhaust stacks */}
      <rect x="150" y="58" width="13" height="90" rx="3" fill="#B9C0C4" />
      <rect x="156" y="58" width="7" height="90" fill="#8B9296" />
      <ellipse cx="156.5" cy="58" rx="8" ry="4" fill="#4B5257" />
      <rect x="317" y="58" width="13" height="90" rx="3" fill="#B9C0C4" />
      <rect x="323" y="58" width="7" height="90" fill="#8B9296" />
      <ellipse cx="323.5" cy="58" rx="8" ry="4" fill="#4B5257" />

      {/* mirrors */}
      <line x1="178" y1="118" x2="158" y2="108" stroke="#23262B" strokeWidth="3" strokeLinecap="round" />
      <rect x="142" y="100" width="17" height="24" rx="4" fill="#23262B" />
      <line x1="302" y1="118" x2="322" y2="108" stroke="#23262B" strokeWidth="3" strokeLinecap="round" />
      <rect x="321" y="100" width="17" height="24" rx="4" fill="#23262B" />

      {/* cab roof + windshield */}
      <rect x="178" y="98" width="124" height="46" rx="14" fill="#C8352B" />
      <rect x="192" y="106" width="44" height="28" rx="4" fill="#2B3440" />
      <rect x="244" y="106" width="44" height="28" rx="4" fill="#2B3440" />
      <rect x="238" y="104" width="4" height="32" fill="#C8352B" />
      <path d="M198 110 208 130" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
      <path d="M250 110 260 130" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />

      {/* hood */}
      <rect x="156" y="142" width="168" height="50" rx="10" fill="#C8352B" />
      <path d="M162 148h156" stroke="#E2685D" strokeWidth="3" strokeLinecap="round" />

      {/* grille */}
      <rect x="204" y="156" width="72" height="4" rx="2" fill="#C7CCCF" stroke="#8B9296" strokeWidth="0.5" />
      <rect x="204" y="164" width="72" height="4" rx="2" fill="#C7CCCF" stroke="#8B9296" strokeWidth="0.5" />
      <rect x="204" y="172" width="72" height="4" rx="2" fill="#C7CCCF" stroke="#8B9296" strokeWidth="0.5" />
      <rect x="204" y="180" width="72" height="4" rx="2" fill="#C7CCCF" stroke="#8B9296" strokeWidth="0.5" />
      <rect x="204" y="188" width="72" height="4" rx="2" fill="#C7CCCF" stroke="#8B9296" strokeWidth="0.5" />

      {/* headlights */}
      <rect x="160" y="158" width="28" height="20" rx="6" fill="#FCD34D" stroke="#92400E" strokeWidth="1" />
      <circle cx="174" cy="165" r="3" fill="#ffffff" fillOpacity="0.75" />
      <rect x="292" y="158" width="28" height="20" rx="6" fill="#FCD34D" stroke="#92400E" strokeWidth="1" />
      <circle cx="306" cy="165" r="3" fill="#ffffff" fillOpacity="0.75" />

      {/* bumper */}
      <rect x="150" y="192" width="180" height="14" rx="4" fill="#5B6167" stroke="#33383C" strokeWidth="1" />

      {/* wheels */}
      <circle cx="192" cy="232" r="26" fill="#1C1F22" />
      <circle cx="192" cy="232" r="10" fill="#9AA0A4" />
      <circle cx="288" cy="232" r="26" fill="#1C1F22" />
      <circle cx="288" cy="232" r="10" fill="#9AA0A4" />

      {/* ground shadow */}
      <ellipse cx="240" cy="254" rx="132" ry="9" fill="currentColor" className="text-neutral-900/10 dark:text-white/10" />

      {/* ground */}
      <rect x="0" y="270" width="480" height="6" className="fill-neutral-300 dark:fill-neutral-700" />
      <path d="M20 282h30M70 282h30M120 282h30M170 282h30M220 282h30M270 282h30M320 282h30M370 282h30M420 282h30" stroke="currentColor" strokeWidth="4" strokeDasharray="14 14" className="text-amber-400/60" />
    </svg>
  );
}

const steps = [
  {
    title: "Add your fleet",
    description: "Bring your trucks, drivers, and carrier partners in - takes a few minutes, no spreadsheets required.",
    icon: IconTruck,
  },
  {
    title: "Book & dispatch loads",
    description: "Log a load and get a match score against every open truck, ranked by real driving distance, not guesswork.",
    icon: IconLayers,
  },
  {
    title: "Track everything",
    description: "A live dispatch board shows every truck's status, upcoming pickups, and deliveries in one screen.",
    icon: IconPin,
  },
  {
    title: "See your margins",
    description: "Rate confirmations and PODs stay attached to each load, and revenue/RPM reporting updates automatically.",
    icon: IconChart,
  },
];

const features = [
  { title: "Dispatch board", description: "Every truck's status and active load, updated in real time.", icon: IconTruck },
  { title: "Load scoring & matching", description: "A weighted score on rate/mile, deadhead, lane fit, and reload odds for every load.", icon: IconLayers },
  { title: "Document management", description: "Rate confirmations, BOLs, PODs, and carrier packets attached right to the load.", icon: IconDocument },
  { title: "Financial analytics", description: "Revenue, RPM, and deadhead percentage by truck, carrier, and org.", icon: IconChart },
  { title: "In-app alerts", description: "Expiring insurance, approaching pickups, and missing paperwork surfaced automatically.", icon: IconBolt },
  { title: "Built for your team", description: "Every account is its own organization - your data never mixes with anyone else's.", icon: IconPin },
];

const plans = [
  {
    name: "Starter",
    price: "$49",
    cadence: "/month",
    blurb: "For owner-operators and small teams getting off spreadsheets.",
    features: ["Up to 5 trucks", "Dispatch board & load management", "Carrier, driver & truck records", "Document uploads"],
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$129",
    cadence: "/month",
    blurb: "For growing fleets that need to know their numbers.",
    features: [
      "Up to 25 trucks",
      "Everything in Starter",
      "Load scoring & truck/load matching",
      "Financial analytics",
      "In-app alerts",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    blurb: "For dispatch companies running fleets at scale.",
    features: ["Unlimited trucks", "Everything in Growth", "Dedicated onboarding", "Priority support"],
    highlighted: false,
  },
];

export default function Home({
  searchParams,
}: {
  searchParams: { contact?: string };
}) {
  return (
    <main className={`${display.variable} bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100`}>
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span style={{ fontFamily: "var(--font-display)" }} className="text-lg font-semibold tracking-tight">
            Truck Dispatch Platform
          </span>
          <nav className="flex items-center gap-6 text-sm text-neutral-600 dark:text-neutral-400">
            <a href="#how-it-works" className="hidden hover:text-neutral-900 dark:hover:text-white sm:inline">
              How it works
            </a>
            <a href="#plans" className="hidden hover:text-neutral-900 dark:hover:text-white sm:inline">
              Plans
            </a>
            <a href="#contact" className="hidden hover:text-neutral-900 dark:hover:text-white sm:inline">
              Contact
            </a>
            <Link
              href="/login"
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-0 h-[420px] w-[420px] rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-500/10"
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">
          <div>
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              Dispatch software built for fleets nationwide
            </p>
            <h1
              style={{ fontFamily: "var(--font-display)" }}
              className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl"
            >
              Run your fleet like the big carriers do.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-neutral-600 dark:text-neutral-400">
              Track trucks, book loads, manage documents, and see your margins in real time - all in one place
              built for dispatchers, not enterprise IT departments.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-md bg-neutral-900 px-6 py-3 text-sm font-semibold text-white shadow-sm dark:bg-white dark:text-neutral-900"
              >
                Get started free
              </Link>
              <a
                href="#how-it-works"
                className="rounded-md border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
              >
                See how it works
              </a>
            </div>
            <p className="mt-4 text-xs text-neutral-500">No credit card required to start.</p>
          </div>
          <div className="flex justify-center text-neutral-900 dark:text-neutral-100">
            <HeroIllustration />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-neutral-100 bg-neutral-50 dark:border-neutral-900 dark:bg-neutral-900/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">How it works</p>
          <h2
            style={{ fontFamily: "var(--font-display)" }}
            className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
          >
            From empty fleet to running dispatch in one afternoon.
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900">
                      {index + 1}
                    </span>
                    <Icon className="h-6 w-6 text-amber-500" />
                  </div>
                  <h3 className="text-base font-semibold">{step.title}</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features / About */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-sm font-medium text-amber-600 dark:text-amber-400">What&rsquo;s inside</p>
        <h2
          style={{ fontFamily: "var(--font-display)" }}
          className="mt-2 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl"
        >
          Everything your dispatch operation actually needs - nothing it doesn&rsquo;t.
        </h2>
        <p className="mt-4 max-w-2xl text-neutral-600 dark:text-neutral-400">
          We built this after watching dispatch teams - from single-truck operators to multi-terminal fleets - juggle
          spreadsheets, group texts, and a folder of PDFs to run their trucks. It&rsquo;s one system built to scale
          from your first truck to your five-hundredth, multi-tenant from day one so your data always stays yours.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-800"
              >
                <Icon className="h-7 w-7 text-amber-500" />
                <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="border-t border-neutral-100 bg-neutral-50 dark:border-neutral-900 dark:bg-neutral-900/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Plans</p>
          <h2
            style={{ fontFamily: "var(--font-display)" }}
            className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
          >
            What it takes to get started.
          </h2>
          <p className="mt-4 max-w-2xl text-neutral-600 dark:text-neutral-400">
            Every plan starts free, no credit card needed - upgrade whenever your fleet outgrows the current tier.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={
                  plan.highlighted
                    ? "flex flex-col rounded-xl border-2 border-amber-400 bg-white p-8 shadow-md dark:bg-neutral-950"
                    : "flex flex-col rounded-xl border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-950"
                }
              >
                {plan.highlighted && (
                  <span className="mb-3 w-fit rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-neutral-900">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-neutral-500">{plan.blurb}</p>
                <p className="mt-6">
                  <span
                    style={{ fontFamily: "var(--font-display)" }}
                    className="text-3xl font-bold tracking-tight"
                  >
                    {plan.price}
                  </span>
                  <span className="text-sm text-neutral-500">{plan.cadence}</span>
                </p>
                <ul className="mt-6 flex flex-1 flex-col gap-2.5 text-sm text-neutral-600 dark:text-neutral-400">
                  {plan.features.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={
                    plan.highlighted
                      ? "mt-8 rounded-md bg-neutral-900 px-4 py-2.5 text-center text-sm font-semibold text-white dark:bg-white dark:text-neutral-900"
                      : "mt-8 rounded-md border border-neutral-300 px-4 py-2.5 text-center text-sm font-semibold dark:border-neutral-700"
                  }
                >
                  Start free
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Contact</p>
        <h2
          style={{ fontFamily: "var(--font-display)" }}
          className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
        >
          Questions before you sign up? Send them over.
        </h2>
        <p className="mt-4 text-neutral-600 dark:text-neutral-400">
          We usually reply within a business day.
        </p>

        {searchParams.contact === "sent" && (
          <p className="mt-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
            Thanks - your message is in. We&rsquo;ll get back to you soon.
          </p>
        )}
        {searchParams.contact === "error" && (
          <p className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            Please fill in your name, email, and a message before sending.
          </p>
        )}

        <form action={submitContactMessage} className="mt-8 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="name"
              type="text"
              placeholder="Your name"
              required
              className="rounded-md border border-neutral-300 px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
            <input
              name="email"
              type="email"
              placeholder="Email address"
              required
              className="rounded-md border border-neutral-300 px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
          <input
            name="company"
            type="text"
            placeholder="Company (optional)"
            className="rounded-md border border-neutral-300 px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <textarea
            name="message"
            placeholder="What can we help with?"
            required
            rows={5}
            className="rounded-md border border-neutral-300 px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button
            type="submit"
            className="w-fit rounded-md bg-neutral-900 px-6 py-3 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900"
          >
            Send message
          </button>
        </form>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100 dark:border-neutral-900">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-10 text-sm text-neutral-500 sm:flex-row sm:justify-between">
          <span style={{ fontFamily: "var(--font-display)" }} className="font-semibold text-neutral-700 dark:text-neutral-300">
            Truck Dispatch Platform
          </span>
          <span>&copy; {new Date().getFullYear()} - Built for dispatchers, run by dispatchers.</span>
          <Link href="/login" className="hover:text-neutral-900 dark:hover:text-white">
            Sign in
          </Link>
        </div>
      </footer>
    </main>
  );
}
