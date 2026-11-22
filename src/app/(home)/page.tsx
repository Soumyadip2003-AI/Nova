import Link from "next/link";
import { SignedIn, SignedOut, SignUpButton } from "@clerk/nextjs";
import { CheckIcon, RotateCwIcon, TriangleAlertIcon } from "lucide-react";
import { ProjectForm } from "@/modules/home/ui/components/project-form";
import { ProjectList } from "@/modules/home/ui/components/project-list";
import { ExampleGallery } from "@/modules/home/ui/components/example-gallery";
import { YogaPreview } from "@/modules/home/ui/components/yoga-preview";
import { Greeting } from "@/modules/home/ui/components/greeting";

const pill =
  "inline-flex h-12 items-center justify-center rounded-full px-6 text-[15px] font-bold transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#ff3d7f]";

const BUILD_STEPS = [
  { icon: CheckIcon, tone: "bg-primary", text: "Wrote 3 files" },
  { icon: TriangleAlertIcon, tone: "bg-destructive", text: "Found a problem in the form" },
  { icon: RotateCwIcon, tone: "bg-[var(--nova-orange)]", text: "Fixed it, attempt 1 of 2" },
  { icon: CheckIcon, tone: "bg-success", text: "Checked: the app works", strong: true },
];

const HOW = [
  { title: "It writes the code", text: "Every page, component and style your idea needs." },
  { title: "It tests what it wrote", text: "A type check on every file it touched, then a real load of the running app." },
  { title: "It fixes what broke", text: "Up to two repair rounds before you see anything. If it still cannot finish, your credit comes back." },
];

const Page = () => {
  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 pb-16 sm:px-8">
      {/* Signed in: a focused start page, the prompt box first, then projects. */}
      <SignedIn>
        <section aria-labelledby="start-title" className="mx-auto max-w-[760px] pt-8 sm:pt-16">
          <h1
            id="start-title"
            className="text-center text-[34px] font-bold leading-[1.05] tracking-[-0.04em] text-white text-balance sm:text-[52px]"
          >
            <Greeting />
          </h1>
          <p className="mt-3 text-center text-base font-medium text-white/90 sm:text-lg">
            Describe it in plain words. Nova builds it, checks it and fixes it.
          </p>
          <div className="mt-8">
            <ProjectForm />
          </div>
        </section>
        <div id="projects" className="scroll-mt-6 pt-20 sm:pt-28">
          <ProjectList />
        </div>
      </SignedIn>

      <SignedOut>
      {/* Hero: the promise on the left, the working prompt box on the right. */}
      <div className="grid items-start gap-10 pt-6 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_540px] lg:gap-12 lg:pt-16">
        <section aria-labelledby="hero-title" className="text-white">
          <h1
            id="hero-title"
            className="max-w-[620px] text-[44px] font-bold leading-[1] tracking-[-0.045em] text-balance sm:text-[64px] lg:text-[80px] lg:leading-[0.98]"
          >
            Turn an idea into an app you can use today.
          </h1>
          <p className="mt-5 max-w-[470px] text-lg font-medium leading-relaxed text-white/90 sm:text-xl">
            Describe it in plain words. Nova writes the code, runs it, fixes its own mistakes and hands you a live app.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <SignUpButton>
              <button type="button" className={`${pill} bg-[#0b1b33] text-white`}>
                Start building free
              </button>
            </SignUpButton>
            <Link href="#examples" className={`${pill} bg-white text-[#0b1b33] shadow-sm`}>
              See examples
            </Link>
          </div>
        </section>

        <section aria-label="Start a build" className="relative">
          <ProjectForm />
          {/* Illustration: what happens after you press Build. */}
          <div aria-hidden="true" className="relative mt-6 hidden h-[360px] md:block">
            <div className="absolute left-0 top-10 w-[86%] overflow-hidden rounded-2xl bg-white shadow-float [transform:perspective(1400px)_rotateY(-6deg)_rotateX(3deg)]">
              <div className="flex h-[30px] items-center gap-1.5 border-b border-border bg-[#f3f4f7] px-3">
                <i className="size-2.5 rounded-full bg-[#dfe2e8]" />
                <i className="size-2.5 rounded-full bg-[#dfe2e8]" />
                <i className="size-2.5 rounded-full bg-[#dfe2e8]" />
                <span className="ml-3 font-mono text-[11px] text-muted-foreground">stillwater-yoga.nova.run</span>
              </div>
              <div className="h-[270px]">
                <YogaPreview />
              </div>
            </div>
            <div className="absolute -right-4 top-0 w-[270px] rounded-2xl bg-white p-4 text-[13.5px] shadow-float">
              <p className="mb-1 text-[12.5px] font-medium text-muted-foreground">Building, 46s</p>
              {BUILD_STEPS.map(({ icon: Icon, tone, text, strong }) => (
                <p key={text} className={`flex items-center gap-2.5 py-1.5 ${strong ? "font-bold" : ""}`}>
                  <span className={`grid size-5 shrink-0 place-items-center rounded-full text-white ${tone}`}>
                    <Icon className="size-3" strokeWidth={3} />
                  </span>
                  {text}
                </p>
              ))}
            </div>
          </div>
        </section>
      </div>

      <ExampleGallery />

      <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-6 pt-24 sm:pt-32">
        <h2 id="how-title" className="max-w-[720px] text-4xl font-bold tracking-[-0.04em] sm:text-[52px] sm:leading-[1.04]">
          Nova checks its own work, so you never have to debug.
        </h2>
        <div className="mt-12 grid items-center gap-10 lg:grid-cols-[420px_minmax(0,1fr)] lg:gap-16">
          <ol>
            {HOW.map((step) => (
              <li key={step.title} className="border-t border-border py-5 last:border-b">
                <h3 className="text-xl font-bold tracking-[-0.02em]">{step.title}</h3>
                <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
          <figure className="overflow-hidden rounded-2xl bg-card shadow-float">
            <figcaption className="flex items-center gap-2.5 border-b border-border px-5 py-3.5 text-sm font-bold">
              <span className="grid size-5 place-items-center rounded-full bg-destructive text-white">
                <TriangleAlertIcon className="size-3" strokeWidth={3} aria-hidden="true" />
              </span>
              Problem found in signup-form.tsx
              <span className="ml-auto font-mono text-xs font-normal text-muted-foreground">repair 1 of 2</span>
            </figcaption>
            <pre className="overflow-x-auto py-3.5 font-mono text-[13px] leading-[1.85]" aria-label="Example fix: a missing date picker is replaced with the date input already in the app">
              <code>
                <span className="block px-5 text-muted-foreground">  import {"{ Input }"} from &quot;@/components/ui/input&quot;</span>
                <span className="block bg-destructive-soft px-5 text-destructive">- import {"{ DatePicker }"} from &quot;@/components/ui/date-picker&quot;</span>
                <span className="block bg-success-soft px-5 text-success-strong">+ // use the date input that already exists</span>
                <span className="block px-5 text-muted-foreground">  …</span>
                <span className="block bg-destructive-soft px-5 text-destructive">-   &lt;DatePicker value={"{day}"} onChange={"{setDay}"} /&gt;</span>
                <span className="block bg-success-soft px-5 text-success-strong">+   &lt;Input type=&quot;date&quot; value={"{day}"} onChange={"{(e) => setDay(e.target.value)}"} /&gt;</span>
              </code>
            </pre>
            <p className="flex items-center gap-2.5 border-t border-border px-5 py-3.5 text-sm font-bold">
              <span className="grid size-5 place-items-center rounded-full bg-success text-white">
                <CheckIcon className="size-3" strokeWidth={3} aria-hidden="true" />
              </span>
              Checked again: types pass and the page loads.
            </p>
          </figure>
        </div>
      </section>

      <section aria-labelledby="closer-title" className="bg-nova mt-24 overflow-hidden rounded-[28px] px-6 py-14 text-white sm:mt-32 sm:px-16 sm:py-20">
        <h2 id="closer-title" className="max-w-[640px] text-4xl font-bold leading-[1.02] tracking-[-0.04em] sm:text-[56px]">
          Your first five apps are on us, every month.
        </h2>
        <p className="mt-4 max-w-[520px] text-lg font-medium text-white/90">
          No card needed. Go Pro when you want the most capable models and bigger builds.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <SignUpButton>
            <button type="button" className={`${pill} bg-white text-[#0b1b33]`}>Start building free</button>
          </SignUpButton>
          <Link href="/pricing" className={`${pill} bg-[#0b1b33]/90 text-white`}>See pricing</Link>
        </div>
      </section>

      </SignedOut>

      <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-2 font-bold text-foreground">
          <span aria-hidden="true" className="size-5 rounded-full [background:conic-gradient(from_200deg,#ff6a3d,#ff3d7f,#7c5cff,#1fc8e6,#ff6a3d)] [mask:radial-gradient(circle,transparent_4px,#000_4.5px)]" />
          nova
        </span>
        <nav aria-label="Footer" className="flex gap-6">
          <Link href="/#examples" className="hover:text-foreground">Examples</Link>
          <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link href="/sign-in" className="hover:text-foreground">Sign in</Link>
        </nav>
      </footer>
    </div>
  );
};

export default Page;
