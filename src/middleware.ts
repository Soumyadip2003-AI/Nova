import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/pricing(.*)",
  "/how-it-works",
  "/terms",
  "/privacy",
  "/robots.txt",
  "/sitemap.xml",
  "/api/inngest(.*)",
  "/api/webhooks(.*)",
  // Every tRPC procedure checks auth itself (protectedProcedure) and answers a
  // signed-out call with a JSON 401. Protecting it here too turned those calls
  // into an HTML 404 page, which the client cannot read.
  "/api/trpc(.*)",
])

// Pages that need an account. Every other page is public, so a mistyped or
// old link shows the 404 page instead of a sign-in screen. API routes stay
// deny-by-default: anything under /api not listed as public needs a session.
const isPrivatePage = createRouteMatcher([
  "/projects(.*)",
  "/payment-success(.*)",
])

export default clerkMiddleware(async (auth, req) => {
  const isApi = req.nextUrl.pathname.startsWith("/api/") || req.nextUrl.pathname.startsWith("/trpc")
  if ((isApi && !isPublicRoute(req)) || isPrivatePage(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
