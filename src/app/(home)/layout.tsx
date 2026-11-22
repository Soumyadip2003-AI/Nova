import { Navbar } from "@/modules/home/ui/components/navbar";

interface Props {
    children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
    return (
        <div className="bg-grid flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground">
            <Navbar />
            <main className="flex flex-1 flex-col">
                {children}
            </main>
        </div>
    );
};

export default Layout;
