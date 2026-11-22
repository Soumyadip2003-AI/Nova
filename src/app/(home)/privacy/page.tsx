import type { Metadata } from "next";
import Link from "next/link";
import { DocPage } from "@/modules/home/ui/components/doc-page";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "What personal data Nova collects, why, who processes it, and your rights.",
};

const PROCESSORS = [
    ["Clerk", "Sign-in, account details and subscription billing"],
    ["Stripe", "Card payments for Pro, through Clerk Billing. We never see or store your card number."],
    ["OpenAI", "The AI models that read your prompts and write your code"],
    ["E2B", "The temporary cloud sandboxes that run your app"],
    ["Inngest", "Running each build step by step in the background"],
    ["Neon", "The database that stores your projects and messages"],
    ["Vercel", "Hosting the Nova website and its server functions, and private storage (Vercel Blob) for files you upload"],
];

const Page = () => (
    <DocPage title="Privacy Policy" meta={`Last updated ${SITE.legalUpdated}`}>
        <p className="!mt-0">
            This policy explains how {SITE.operator} (&ldquo;we&rdquo;), who operates Nova from {SITE.country}, handles your
            personal data. We follow India&apos;s Digital Personal Data Protection Act, 2023 and collect only what we need to run Nova.
        </p>

        <h2>1. What we collect</h2>
        <ul>
            <li>
                <strong>Account details:</strong> your name, email address and profile picture, and the sign-in method you use
                (email, Google or GitHub), handled by Clerk.
            </li>
            <li>
                <strong>What you create:</strong> your prompts, chat messages, the code and files Nova generates, project names, and
                the build log for each version.
            </li>
            <li>
                <strong>Design references you add:</strong> screenshots, still frames from screen recordings (the recording itself is
                not uploaded; your browser takes the frames), PDFs, text and code files, and links. Do not upload anything that
                contains other people&apos;s personal data or secrets.
            </li>
            <li>
                <strong>Plan and usage:</strong> your plan, remaining credits and when they reset, and the AI model you chose.
            </li>
            <li>
                <strong>Payment status:</strong> whether your Pro subscription is active. Card details go straight to Stripe; we never
                receive them.
            </li>
            <li>
                <strong>Technical data:</strong> basic logs such as time, pages requested, errors and IP address, kept by our hosting
                provider to run and secure the service.
            </li>
        </ul>
        <p>We do not use advertising trackers or analytics cookies, and we do not sell your data.</p>

        <h2>2. Why we use it</h2>
        <ul>
            <li>to create your account and sign you in;</li>
            <li>to build, run, check and save your apps, and answer your questions about them;</li>
            <li>to count credits, manage your plan and process payments;</li>
            <li>to keep Nova secure, prevent abuse and fix problems;</li>
            <li>to contact you about your account, important changes or support requests.</li>
        </ul>
        <p>We rely on your consent when you sign up and use Nova, and on what is needed to provide the service you asked for.</p>

        <h2>3. Who processes your data</h2>
        <p>We share data only with the providers that run parts of Nova for us, and only what each one needs:</p>
        <ul>
            {PROCESSORS.map(([name, use]) => (
                <li key={name}>
                    <strong>{name}:</strong> {use}
                </li>
            ))}
        </ul>
        <p>
            Your prompts, code and design references are sent to OpenAI to generate your app; when you add a link, our server
            visits that page to read its design. Under OpenAI&apos;s API terms, data sent through the API is
            not used to train their models by default. Some providers store data outside India; we use providers that protect data
            under contract. We may also disclose data if the law requires it.
        </p>

        <h2>4. How long we keep it</h2>
        <ul>
            <li>Projects, messages and code: until you delete the project or your account.</li>
            <li>
                Uploaded files: until you remove them before sending, or delete the project or your account. Links you add are read
                when you send them; we keep only the address.
            </li>
            <li>Sandboxes: deleted automatically when they time out, within minutes.</li>
            <li>Account and plan records: while your account exists.</li>
            <li>Payment records: as long as tax and accounting law requires.</li>
            <li>Server logs: for a short period set by our hosting provider.</li>
        </ul>

        <h2>5. Your rights</h2>
        <p>You can ask us to:</p>
        <ul>
            <li>tell you what personal data we hold about you and how we use it;</li>
            <li>correct or update it;</li>
            <li>delete it, and withdraw your consent;</li>
            <li>name someone to exercise these rights for you if you cannot.</li>
        </ul>
        <p>
            You can delete any project from your project list. Deleting your account from your account settings also deletes your
            projects, messages, code and credit record. For anything else, write to{" "}
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>. We reply within 30 days.
        </p>

        <h2>6. Cookies</h2>
        <p>
            Nova uses only the cookies needed to keep you signed in and secure, set by Clerk. It also remembers your light or dark
            theme in your browser. We do not use advertising or analytics cookies.
        </p>

        <h2>7. Security</h2>
        <p>
            Data is encrypted in transit, access is limited to what each service needs, and your app&apos;s code runs in isolated
            sandboxes rather than on our servers. No system is perfectly secure; if a breach affects you, we will tell you and the
            authorities as the law requires.
        </p>

        <h2>8. Children</h2>
        <p>
            Nova is not meant for children under 18 without a parent or guardian. We do not knowingly collect children&apos;s data
            without that consent; if you think we have, contact us and we will delete it.
        </p>

        <h2>9. Changes</h2>
        <p>
            We will post any changes here and update the date at the top. If a change is important, we will tell you by email or in
            the app first.
        </p>

        <h2>10. Contact and grievance officer</h2>
        <p>
            {SITE.operator} is responsible for your data and acts as grievance officer. Write to{" "}
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>. If you are not satisfied with our reply, you may complain to the Data
            Protection Board of India. See also our <Link href="/terms">Terms of Service</Link>.
        </p>
    </DocPage>
);

export default Page;
