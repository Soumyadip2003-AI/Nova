import { ProjectForm } from "@/modules/home/ui/components/project-form";
import { ProjectList } from "@/modules/home/ui/components/project-list";
import { SignedIn } from "@clerk/nextjs";

const STEPS = [
  {
    label: "Writes",
    text: "Builds the calendar, the form and the page.",
    className: "border border-border",
    labelClassName: "text-muted-foreground",
  },
  {
    label: "Checks",
    text: "Finds a problem: the sign-up form does not load.",
    className: "border-[1.5px] border-destructive",
    labelClassName: "text-destructive",
  },
  {
    label: "Fixes",
    text: "Repairs it and checks again. Only then do you see it.",
    className: "border-[1.5px] border-success",
    labelClassName: "text-success-strong",
  },
];

const POINTS = [
  {
    title: "It reads its own code",
    text: "After writing, Nova type-checks every file it touched, the way a developer would before handing it over.",
  },
  {
    title: "It opens your app",
    text: "It loads the running app and looks for crashes or error screens. Anything it finds goes back to the agent to fix, up to two rounds.",
  },
  {
    title: "You never pay for a failure",
    text: "If a build still cannot finish, your credit comes back and Nova tells you what happened in plain words.",
  },
];

const Page = () => {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col px-4 pb-20 sm:px-8">
      <div className="grid items-start gap-12 pt-8 md:pt-14 lg:grid-cols-2 lg:gap-14">
        <section aria-labelledby="hero-title">
          <h1
            id="hero-title"
            className="font-display text-[2.5rem] font-bold leading-[1.02] tracking-[-0.02em] text-balance sm:text-6xl lg:text-[4.25rem]"
          >
            Describe your app. Nova builds it,{" "}
            <span className="mark-highlight dark:rounded-sm dark:bg-accent dark:px-1 dark:text-accent-foreground">checks it</span> and fixes it.
          </h1>
          <p className="mt-5 max-w-[520px] text-lg leading-relaxed text-muted-foreground">
            No code to write and nothing to debug. Tell Nova what you want in
            plain words, watch it run, then change it by chatting.
          </p>
          <div className="mt-8">
            <ProjectForm />
          </div>
        </section>

        <section aria-label="Nova checking its own work" className="hidden md:block">
          <figure className="overflow-hidden rounded-2xl border-[1.5px] border-foreground bg-card md:rotate-[1.2deg]">
            <figcaption className="border-b-[1.5px] border-foreground px-4 py-2.5 font-mono text-xs text-muted-foreground">
              Example: a yoga booking page
            </figcaption>
            <div className="grid grid-cols-[1.2fr_1fr] gap-4 p-6" aria-hidden="true">
              <div>
                <p className="font-display text-2xl font-bold">Book a class</p>
                <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
                  {[2, 3, 4, 5, 6, 7, 8].map((day) => (
                    <span
                      key={day}
                      className={
                        day === 4
                          ? "rounded-md bg-primary py-1.5 text-primary-foreground"
                          : "rounded-md bg-background py-1.5"
                      }
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>
              <div className="relative flex flex-col gap-2">
                <span className="h-[34px] rounded-lg border border-border" />
                <span className="h-[34px] rounded-lg border border-border" />
                <span className="h-[38px] rounded-lg bg-primary" />
                <svg
                  width="190"
                  height="64"
                  viewBox="0 0 190 64"
                  className="absolute -left-3.5 top-7 text-destructive"
                >
                  <ellipse
                    cx="95"
                    cy="32"
                    rx="90"
                    ry="27"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    transform="rotate(-3 95 32)"
                  />
                </svg>
              </div>
            </div>
          </figure>
          <ol className="mt-6 flex flex-col gap-2.5 text-[15px]">
            {STEPS.map((step) => (
              <li
                key={step.label}
                className={`flex gap-3 rounded-[10px] bg-card px-4 py-3 ${step.className}`}
              >
                <span className={`min-w-16 font-mono text-xs leading-[1.6rem] ${step.labelClassName}`}>
                  {step.label}
                </span>
                {step.text}
              </li>
            ))}
          </ol>
        </section>
      </div>

      <SignedIn>
        <div className="mt-16">
          <ProjectList />
        </div>
      </SignedIn>

      <section
        id="how-it-works"
        aria-labelledby="how-title"
        className="mt-16 scroll-mt-6 border-t-[1.5px] border-foreground pt-8 md:mt-20"
      >
        <h2 id="how-title" className="sr-only">
          How it works
        </h2>
        <div className="grid gap-8 md:grid-cols-3 md:gap-10">
          {POINTS.map((point) => (
            <div key={point.title}>
              <h3 className="font-display text-2xl font-bold tracking-[-0.02em]">
                {point.title}
              </h3>
              <p className="mt-2.5 max-w-[65ch] text-[15px] leading-relaxed text-muted-foreground">
                {point.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Page;
