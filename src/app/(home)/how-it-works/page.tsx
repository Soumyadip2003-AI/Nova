import type { Metadata } from "next";
import Link from "next/link";
import { DocPage } from "@/modules/home/ui/components/doc-page";

export const metadata: Metadata = {
    title: "How Nova works",
    description: "What happens between describing an app and using it: writing, running, checking, repairing and changing it by chat.",
};

const STEPS = [
    {
        title: "You describe the app",
        body: "Write what you want in plain words, the way you would explain it to a friend. Who is it for, what should people be able to do, and how should it feel. You can start from one of the starter ideas and change it. One build uses one credit.",
    },
    {
        title: "Nova plans and writes the code",
        body: "An AI agent reads your request and writes a real web app: pages, components, styles and the logic that ties them together. Apps are built with Next.js, Tailwind CSS and shadcn/ui, the same tools many professional teams use. You can watch each step in the build log as it happens.",
    },
    {
        title: "It runs the app in a private sandbox",
        body: "The code runs in an isolated cloud sandbox made just for your build, never on your computer. When it starts, you get a live preview you can click through like a normal website.",
    },
    {
        title: "It checks its own work",
        body: "Before you see anything, Nova type-checks every file it changed and loads the running app to look for crashes and error screens, the way a developer would before handing work over.",
    },
    {
        title: "It fixes what it finds",
        body: "Any problem goes back to the agent with the exact error, and it repairs the code, up to two rounds. If a build still cannot finish, your credit is given back automatically and Nova tells you what happened in plain words.",
    },
    {
        title: "You keep changing it by chatting",
        body: "Ask for a new page, a different colour or a working form. Every change is saved as a new version you can open again, and each one goes through the same checks. You can also ask questions about your app in the chat.",
    },
];

const Page = () => (
    <DocPage
        title="How Nova works"
        intro="From a sentence to a working app in about a minute. Here is exactly what happens in between."
    >
        <ol className="!mt-0 !list-none !space-y-0 !pl-0">
            {STEPS.map((step, i) => (
                <li key={step.title} className="grid grid-cols-[44px_1fr] gap-4 border-b border-border py-6 first:pt-0 last:border-0 sm:grid-cols-[56px_1fr]">
                    <span
                        aria-hidden="true"
                        className="grid size-10 place-items-center rounded-full bg-accent text-base font-bold text-accent-foreground sm:size-12 sm:text-lg"
                    >
                        {i + 1}
                    </span>
                    <div>
                        <h2 className="!mt-1 !text-xl">{step.title}</h2>
                        <p className="!mt-2">{step.body}</p>
                    </div>
                </li>
            ))}
        </ol>

        <h2>Credits and plans</h2>
        <ul>
            <li><strong>One credit</strong> covers one build, one change, or one question in the chat.</li>
            <li><strong>Free</strong> includes 5 credits every month and the fast models (GPT-6 Luna and GPT-4o Mini).</li>
            <li><strong>Pro</strong> includes 100 credits every month, every model including GPT-6.2 Astra and Sol, and longer build sessions for bigger apps.</li>
            <li>Credits reset monthly and do not roll over. Failed builds give their credit back.</li>
        </ul>
        <p>See <Link href="/pricing">pricing</Link> for current prices.</p>

        <h2>Previews and your code</h2>
        <p>
            Previews run in a temporary sandbox that pauses about 15 minutes after it was last used (up to 20 minutes on Pro). Your code and every version stay saved in your account, and a stopped preview can be started again with one click, without using a credit.
        </p>
        <p>
            Open the <strong>Code</strong> tab to read or copy every file. You can take the code anywhere and run or host it yourself.
        </p>

        <h2>What Nova is good at, and its limits</h2>
        <ul>
            <li>Great for websites and web apps people click through: landing pages, booking pages, dashboards, portfolios, stores and internal tools.</li>
            <li>Nova does not host your finished app on your own domain yet. To publish it, copy the code and deploy it with a host of your choice.</li>
            <li>AI can still make mistakes the checks do not catch, such as a button that works but does the wrong thing. Try your app in the preview and ask Nova to fix anything that is off.</li>
            <li>Do not put passwords, payment details or other secrets in your prompts.</li>
        </ul>

        <h2>Still have a question?</h2>
        <p>
            Read the <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link>, or write to us from the Contact link at the bottom of every page.
        </p>
    </DocPage>
);

export default Page;
