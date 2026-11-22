import type { Metadata } from "next";
import Link from "next/link";
import { DocPage } from "@/modules/home/ui/components/doc-page";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
    title: "Terms of Service",
    description: "The terms that apply when you use Nova.",
};

const Page = () => (
    <DocPage title="Terms of Service" meta={`Last updated ${SITE.legalUpdated}`}>
        <p className="!mt-0">
            These terms are an agreement between you and {SITE.operator}, an individual based in {SITE.country}, who operates Nova
            (&ldquo;Nova&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By creating an account or using Nova at {SITE.url}, you agree to them.
            If you do not agree, do not use Nova.
        </p>

        <h2>1. What Nova is</h2>
        <p>
            Nova is an online service that uses artificial intelligence to write, run, check and change web applications from
            descriptions you give it. Apps run in temporary cloud sandboxes, and you can view and copy their code.
        </p>

        <h2>2. Who can use Nova</h2>
        <p>
            You must be at least 18 years old, or use Nova with the consent and supervision of a parent or legal guardian.
            If you use Nova for an organisation, you confirm you are allowed to accept these terms for it.
        </p>

        <h2>3. Your account</h2>
        <p>
            Keep your sign-in details safe and tell us at once if you think someone else has used your account. You are
            responsible for what happens under your account. Sign-in is provided by our authentication provider, Clerk.
        </p>

        <h2>4. Your content and the code Nova makes</h2>
        <ul>
            <li>
                <strong>You keep your rights.</strong> What you type into Nova (&ldquo;prompts&rdquo;) and the code Nova generates
                for you (&ldquo;output&rdquo;) belong to you, to the extent the law allows. You may use, change and sell the output.
            </li>
            <li>
                <strong>Permission for us to run the service.</strong> You let us store, process and send your prompts and output to
                the providers listed in our <Link href="/privacy">Privacy Policy</Link>, only as needed to operate and improve Nova
                and to keep it safe.
            </li>
            <li>
                <strong>Output may not be unique.</strong> Other people may receive similar output for similar prompts.
            </li>
            <li>
                <strong>You are responsible for what you build.</strong> Check that your app and its content are lawful and do not
                break anyone else&apos;s rights before you publish or use it.
            </li>
        </ul>

        <h2>5. AI makes mistakes</h2>
        <p>
            Nova checks its code, but AI output can still be wrong, incomplete, insecure or unsuitable for your purpose. Review and
            test anything Nova makes before you rely on it, especially for money, health, legal, safety or personal data. Nova is a
            tool to help you build; it does not give professional advice.
        </p>

        <h2>6. Acceptable use</h2>
        <p>Do not use Nova to:</p>
        <ul>
            <li>break any law, or build anything that helps others break it;</li>
            <li>create malware, phishing pages, scams, or tools to attack, scrape or overload other systems;</li>
            <li>create content that is sexual content involving minors, harassment, hate, or that infringes others&apos; rights;</li>
            <li>collect other people&apos;s personal data without a lawful basis;</li>
            <li>try to break, probe or get around Nova&apos;s security, sandboxes, limits or billing;</li>
            <li>resell or give others access to your account, or use automated means to create accounts or use credits.</li>
        </ul>
        <p>We may remove content, pause builds or suspend accounts that break these rules.</p>

        <h2>7. Credits, plans and payment</h2>
        <ul>
            <li>Builds, changes and chat questions each use one credit. Free accounts get 5 credits a month; Pro gets 100.</li>
            <li>Credits reset each month, do not roll over and have no cash value.</li>
            <li>
                If a build cannot finish after Nova&apos;s checks and repairs, its credit is returned automatically.
            </li>
            <li>
                Pro is a subscription billed in advance through our payment providers (Clerk Billing, with card processing by
                Stripe). Prices are shown on the <Link href="/pricing">pricing page</Link> before you pay and may include taxes.
            </li>
            <li>We may change prices or plan contents for future billing periods and will tell you before the change applies.</li>
        </ul>

        <h2 id="refunds">8. Cancellation and refunds</h2>
        <p>
            You can cancel Pro at any time from your account. Pro stays active until the end of the period you have paid for and is
            not renewed after that. Payments are not refundable, including for unused credits or part of a billing period, except
            where the law requires a refund or where we charged you by mistake. Nothing in these terms limits rights you have under
            consumer protection law.
        </p>

        <h2>9. Third-party services</h2>
        <p>
            Nova relies on other companies to work, including Clerk (sign-in and billing), Stripe (payments), OpenAI (AI models),
            E2B (code sandboxes), Inngest (background jobs), Neon (database) and Vercel (hosting). Their own terms may apply to
            their part of the service.
        </p>

        <h2>10. Availability and changes</h2>
        <p>
            We work to keep Nova running, but it is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. It may be slow, down
            or changed at times. We may add, change or remove features. Previews and sandboxes are temporary; keep a copy of any code
            you need.
        </p>

        <h2>11. Ending your use</h2>
        <p>
            You can stop using Nova and delete your account at any time. We may suspend or close accounts that break these terms or
            put the service or others at risk; where reasonable we will tell you why first. Sections 4, 5 and 12 to 15 continue
            after your account ends.
        </p>

        <h2>12. Disclaimers</h2>
        <p>
            To the extent the law allows, Nova is provided without warranties of any kind, including that it will meet your needs,
            be error free, or that output will be accurate, secure or fit for a particular purpose.
        </p>

        <h2>13. Limitation of liability</h2>
        <p>
            To the extent the law allows, we are not liable for indirect, incidental or consequential losses, or for lost profits,
            revenue, data or goodwill. Our total liability for any claim about Nova is limited to the greater of the amount you paid
            us in the 12 months before the claim and INR 1,000.
        </p>

        <h2>14. Indemnity</h2>
        <p>
            You agree to cover reasonable losses and costs we face because of a claim arising from your content, your apps, or your
            breach of these terms.
        </p>

        <h2>15. Governing law and disputes</h2>
        <p>
            These terms are governed by the laws of India. Before going to court, please write to us so we can try to resolve the
            issue. Any dispute will be handled by the competent courts in India.
        </p>

        <h2>16. Changes to these terms</h2>
        <p>
            We may update these terms. If a change is important, we will tell you by email or in the app before it takes effect.
            Using Nova after that means you accept the updated terms.
        </p>

        <h2>17. Contact and grievances</h2>
        <p>
            Questions, complaints and grievances go to {SITE.operator}, who also acts as grievance officer, at{" "}
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>. We aim to acknowledge complaints within 48 hours and resolve them
            within 15 days.
        </p>
    </DocPage>
);

export default Page;
