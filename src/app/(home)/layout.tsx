import { Navbar } from "@/modules/home/ui/components/navbar";

interface Props {
    children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
    return (
        <div className="relative isolate flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground">
            {/* The nova colour field: one slanted band across the top of every page. */}
            <div
                aria-hidden="true"
                className="bg-nova absolute inset-x-[-15%] top-[-180px] -z-10 h-[620px] origin-top-left -skew-y-[8deg] sm:h-[760px] lg:h-[820px]"
            />
            <Navbar />
            <main className="flex flex-1 flex-col">{children}</main>
        </div>
    );
};

export default Layout;
