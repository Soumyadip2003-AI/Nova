"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Logo } from "@/components/logo";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDownIcon, ChevronLeftIcon, SunIcon, MoonIcon, MonitorIcon } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { ModelSelector } from "@/components/model-selector";
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

const iconTile = "flex size-8 items-center justify-center rounded-[10px] bg-muted";

export const ProjectHeader = ({ projectId }: Props) => {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const { data: project } = useSuspenseQuery(
        trpc.projects.getOne.queryOptions({ id: projectId })
    );
    const { setTheme, theme } = useTheme();

    const updateModel = useMutation(
        trpc.projects.updateModel.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries(
                    trpc.projects.getOne.queryOptions({ id: projectId })
                );
            },
        })
    );

    const model = project.model || "gpt-4o-mini";
    const onModelChange = (next: string) => updateModel.mutate({ id: projectId, model: next });

    return (
        <div className="flex min-w-0 items-center gap-2 md:gap-4">
            <h1 className="sr-only">{project.name}</h1>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="group flex min-w-0 items-center gap-2.5 rounded-[10px] px-1.5 py-1 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <Logo size={26} />
                        <span className="truncate font-display text-lg font-bold max-w-[6rem] sm:max-w-[16rem]">
                            {project.name}
                        </span>
                        <ChevronDownIcon
                            className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground"
                            aria-hidden
                        />
                        <span className="sr-only">Project menu</span>
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    side="bottom"
                    align="start"
                    className="w-60 rounded-2xl border-[1.5px] border-foreground p-1.5"
                >
                    <DropdownMenuItem asChild className="cursor-pointer gap-3 rounded-[10px] py-2">
                        <Link href="/">
                            <span className={iconTile}>
                                <ChevronLeftIcon className="size-4" aria-hidden />
                            </span>
                            <span className="flex flex-col">
                                <span className="font-medium">All projects</span>
                                <span className="text-xs text-muted-foreground">Back to your projects</span>
                            </span>
                        </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="gap-3 rounded-[10px] py-2">
                            <span className={iconTile}>
                                {theme === "dark" ? (
                                    <MoonIcon className="size-4" aria-hidden />
                                ) : theme === "light" ? (
                                    <SunIcon className="size-4" aria-hidden />
                                ) : (
                                    <MonitorIcon className="size-4" aria-hidden />
                                )}
                            </span>
                            <span className="flex flex-col">
                                <span className="font-medium">Appearance</span>
                                <span className="text-xs text-muted-foreground">
                                    {theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System"}
                                </span>
                            </span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent className="rounded-2xl border-[1.5px] border-foreground p-1.5">
                                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                                    <DropdownMenuRadioItem value="light" className="gap-2 rounded-[10px] py-2">
                                        <SunIcon className="size-4" aria-hidden />
                                        <span>Light</span>
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="dark" className="gap-2 rounded-[10px] py-2">
                                        <MoonIcon className="size-4" aria-hidden />
                                        <span>Dark</span>
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="system" className="gap-2 rounded-[10px] py-2">
                                        <MonitorIcon className="size-4" aria-hidden />
                                        <span>System</span>
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                </DropdownMenuContent>
            </DropdownMenu>

            {/* Small screens: the picker sits beside the menu, not inside it */}
            <div className="min-w-0 md:hidden">
                <ModelSelector
                    value={model}
                    onChange={onModelChange}
                    disabled={updateModel.isPending}
                    className="max-w-[9rem]"
                />
            </div>

            <div className="hidden items-center gap-2 text-sm md:flex">
                <label htmlFor="project-model" className="text-muted-foreground">
                    Model
                </label>
                <ModelSelector
                    id="project-model"
                    value={model}
                    onChange={onModelChange}
                    disabled={updateModel.isPending}
                />
            </div>
        </div>
    );
};
