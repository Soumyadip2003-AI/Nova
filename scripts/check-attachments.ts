// Self-check for the attachment, link-reader and API-route logic. No database is used; the URL only satisfies the import.
// Run: DATABASE_URL=postgresql://x@localhost/x npx tsx scripts/check-attachments.ts
import assert from "node:assert/strict";
import { attachmentProblem, fileKind, isFetchableUrl, uploadType, type Attachment } from "../src/lib/attachments";
import { isPrivateIp, summarizePage } from "../src/lib/link-reader";
import { apiRoutesFor, problemFiles } from "../src/inngest/verify";
import { isDefinitelyQuestion } from "../src/lib/question-detector";

const U = "user_1";
const file = (name: string, extra: Partial<Attachment & { kind: "file" }> = {}): Attachment =>
    ({ kind: "file", pathname: `uploads/${U}/${name}`, name, contentType: "image/png", size: 1000, ...extra }) as Attachment;

// File kinds
assert.equal(fileKind("image/png", "a.png"), "image");
assert.equal(fileKind("", "shot.JPG"), "image");
assert.equal(fileKind("video/quicktime", "rec.mov"), "recording");
assert.equal(fileKind("application/pdf", "brief.pdf"), "pdf");
assert.equal(fileKind("", "page.tsx"), "text");
assert.equal(fileKind("application/zip", "a.zip"), "unsupported");
assert.equal(uploadType("text", "", "page.tsx"), "text/plain");
assert.equal(uploadType("pdf", "", "x.pdf"), "application/pdf");

// Limits
assert.equal(attachmentProblem([file("a.png")], U, "FREE"), null);
assert.match(attachmentProblem([file("a.png", { pathname: "uploads/other/a.png" })], U, "FREE")!, /belong/);
assert.match(attachmentProblem([file("a"), file("b"), file("c"), file("d")], U, "FREE")!, /up to 3 files/);
assert.equal(attachmentProblem([file("a"), file("b"), file("c"), file("d")], U, "PRO"), null);
assert.match(attachmentProblem([file("f1", { from: "rec.mp4" })], U, "FREE")!, /Pro feature/);
const frames = Array.from({ length: 6 }, (_, i) => file(`f${i}`, { from: "rec.mp4" }));
assert.equal(attachmentProblem([...frames, file("a"), file("b")], U, "PRO"), null, "a recording counts as one file");
assert.match(attachmentProblem([file("big", { size: 11 * 1024 * 1024 })], U, "FREE")!, /10 MB/);
assert.equal(attachmentProblem([{ kind: "link", url: "https://stripe.com" }], U, "FREE"), null);
assert.match(attachmentProblem([{ kind: "link", url: "http://localhost:3000" }], U, "FREE")!, /public/);

// Links Nova may fetch
assert.ok(isFetchableUrl("https://stripe.com/pricing"));
for (const bad of ["ftp://x.com", "http://localhost", "http://intranet", "https://a.b:8443", "https://u:p@x.com", "http://db.internal"]) {
    assert.ok(!isFetchableUrl(bad), bad);
}
for (const ip of ["127.0.0.1", "10.0.0.5", "172.20.1.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:10.0.0.1"]) {
    assert.ok(isPrivateIp(ip), ip);
}
for (const ip of ["8.8.8.8", "172.32.0.1", "2606:4700::1111"]) assert.ok(!isPrivateIp(ip), ip);

// Page summary
const s = summarizePage(
    `<html><head><title>Acme &amp; Co</title><meta name="description" content="We build things">
     <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400" rel="stylesheet">
     <style>body{color:#111;background:#FAFAFA}h1{font-family:"Satoshi",sans-serif;color:#111}</style></head>
     <body><nav><a href="/">Home</a><a href="/p">Pricing</a></nav><h1>Ship faster</h1><script>var x="#ff0000"</script></body></html>`,
    [".btn{background:#635bff}"],
);
assert.equal(s.title, "Acme & Co");
assert.equal(s.description, "We build things");
assert.equal(s.colours[0], "#111111");
assert.ok(s.colours.includes("#635bff") && !s.colours.includes("#ff0000"), "script colours are ignored");
assert.deepEqual(s.fonts.sort(), ["Inter Tight", "Satoshi"]);
assert.deepEqual(s.nav, ["Home", "Pricing"]);
assert.ok(s.headings.includes("h1: Ship faster"));

// API routes the self-check calls
assert.deepEqual(apiRoutesFor(["app/api/tasks/route.ts", "app/api/tasks/[id]/route.ts", "app/page.tsx", "src/app/api/(admin)/stats/route.ts"]), ["/api/tasks", "/api/stats"]);
assert.deepEqual(problemFiles(["GET /api/tasks returns HTTP 500: no such table"]), ["app/api/tasks/route.ts", "lib/db.ts"]);
assert.deepEqual(problemFiles(["app/page.tsx(3,1): error TS2307: x"]), ["app/page.tsx"]);

// Change requests vs questions
assert.equal(isDefinitelyQuestion("Show how many open tasks each filter has, next to Today, Upcoming and Done"), false);
assert.equal(isDefinitelyQuestion("Add dark mode"), false);
assert.equal(isDefinitelyQuestion("Make the header sticky"), false);
assert.equal(isDefinitelyQuestion("How many files did you create?"), true);
assert.equal(isDefinitelyQuestion("Show me how this works?"), true);
assert.equal(isDefinitelyQuestion("What does the API route do"), true);

console.log("attachments self-check: ok");
