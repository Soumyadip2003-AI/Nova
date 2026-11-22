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

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
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
