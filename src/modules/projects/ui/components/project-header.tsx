"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Logo } from "@/components/logo";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronDownIcon, ChevronLeftIcon, SunIcon, MoonIcon, MonitorIcon } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
    projectId: string;
}

export const ProjectHeader = ({ projectId }: Props) => {
    const trpc = useTRPC();
    const { data: project } = useSuspenseQuery(
        trpc.projects.getOne.queryOptions({ id: projectId })
    );
    const { setTheme, theme } = useTheme();

    return (
        <header className="p-3 flex justify-between items-center border-b bg-background/80 backdrop-blur-sm">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "gap-2 px-2 h-9 rounded-xl transition-all",
                            "hover:bg-muted focus-visible:ring-0",
                            "group"
                        )}
                    >
                        {/* Logo with glow effect */}
                        <Logo size={16} withContainer containerClassName="size-7 p-1.5" hover />

                        {/* Project name */}
                        <span className="text-sm font-semibold truncate max-w-[100px] sm:max-w-[150px]">
                            {project.name}
                        </span>

                        <ChevronDownIcon className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    side="bottom"
                    align="start"
                    className="w-56 rounded-xl border-border/50 shadow-xl"
                >
                    <DropdownMenuItem asChild className="rounded-lg gap-3 py-2.5 cursor-pointer">
                        <Link href="/">
                            <div className="size-8 rounded-lg bg-muted flex items-center justify-center">
                                <ChevronLeftIcon className="size-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium">Dashboard</span>
                                <span className="text-xs text-muted-foreground">Back to all projects</span>
                            </div>
                        </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="rounded-lg gap-3 py-2.5">
                            <div className="size-8 rounded-lg bg-muted flex items-center justify-center">
                                {theme === "dark" ? (
                                    <MoonIcon className="size-4" />
                                ) : theme === "light" ? (
                                    <SunIcon className="size-4" />
                                ) : (
                                    <MonitorIcon className="size-4" />
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium">Appearance</span>
                                <span className="text-xs text-muted-foreground capitalize">{theme} mode</span>
                            </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent className="rounded-xl">
                                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                                    <DropdownMenuRadioItem value="light" className="rounded-lg gap-2 py-2">
                                        <SunIcon className="size-4" />
                                        <span>Light</span>
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="dark" className="rounded-lg gap-2 py-2">
                                        <MoonIcon className="size-4" />
                                        <span>Dark</span>
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="system" className="rounded-lg gap-2 py-2">
                                        <MonitorIcon className="size-4" />
                                        <span>System</span>
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
};
