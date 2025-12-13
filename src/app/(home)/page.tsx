import { ProjectForm } from "@/modules/home/ui/components/project-form";
import { ProjectList } from "@/modules/home/ui/components/project-list";
import { SignedIn } from "@clerk/nextjs";
import { Logo } from "@/components/logo";

const Page = () => {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-[70vh] py-16 md:py-24">
        {/* Floating orbs background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-amber-500/15 to-orange-500/15 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto px-4 space-y-8">
          {/* Logo with glow */}
          <Logo size={56} withContainer containerClassName="p-4 rounded-2xl border border-amber-200/50 dark:border-amber-500/20 shadow-xl" hover />

          {/* Headline with gradient */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
                Build something
              </span>
              <br />
              <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                extraordinary
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Transform your ideas into reality with Nova. Create stunning apps and websites powered by AI in minutes, not months.
            </p>
          </div>

          {/* Project Form */}
          <div className="w-full max-w-2xl">
            <ProjectForm />
          </div>
        </div>
      </section>

      {/* Projects Section - Only show when signed in */}
      <SignedIn>
        <section className="max-w-6xl mx-auto w-full px-4 pb-16">
          <ProjectList />
        </section>
      </SignedIn>
    </div>
  );
};

export default Page;