"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Loader2Icon, ClockIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export const ProjectList = () => {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { data: projects, isLoading } = useQuery(
        trpc.projects.getMany.queryOptions()
    );

    const deleteMutation = useMutation(
        trpc.projects.remove.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: trpc.projects.getMany.queryKey() });
                setDeleteId(null);
            },
        })
    );

    if (isLoading) {
        return (
            <div role="status" className="flex items-center gap-3 py-10 text-sm text-muted-foreground">
                <Loader2Icon className="size-5 animate-spin" aria-hidden="true" />
                Loading your projects…
            </div>
        );
    }

    if (!projects || projects.length === 0) {
        return null;
    }

    return (
        <section aria-labelledby="projects-title" className="space-y-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="projects-title" className="font-display text-3xl font-bold tracking-[-0.02em]">
                    Your projects
                </h2>
                <p className="font-mono text-[13px] text-muted-foreground">
                    {projects.length} project{projects.length !== 1 ? "s" : ""}
                </p>
            </div>

            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                    <li
                        key={project.id}
                        className={cn(
                            "group relative flex h-full flex-col gap-4 rounded-2xl border-[1.5px] border-foreground bg-card p-5",
                            "hover:shadow-stamp-sm focus-within:shadow-stamp-sm"
                        )}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <Link
                                href={`/projects/${project.id}`}
                                className={cn(
                                    "line-clamp-2 min-w-0 rounded-[10px] font-medium leading-snug text-foreground",
                                    "after:absolute after:inset-0 after:rounded-2xl after:content-['']",
                                    "focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring",
                                    "group-hover:underline underline-offset-4"
                                )}
                            >
                                {project.messages[0]?.content || project.name}
                            </Link>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Delete project"
                                className={cn(
                                    "relative z-10 size-9 shrink-0 rounded-[10px] text-muted-foreground",
                                    "hover:bg-destructive-soft hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring"
                                )}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDeleteId(project.id);
                                }}
                            >
                                <TrashIcon className="size-4" aria-hidden="true" />
                            </Button>
                        </div>

                        <p className="mt-auto flex items-center gap-1.5 border-t border-border pt-3 font-mono text-xs text-muted-foreground">
                            <ClockIcon className="size-3.5" aria-hidden="true" />
                            Updated{" "}
                            {formatDistanceToNow(new Date(project.updatedAt), {
                                addSuffix: true,
                            })}
                        </p>
                    </li>
                ))}
            </ul>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-2xl border-[1.5px] border-foreground shadow-stamp">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-display text-xl">Delete this project?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            The project, its chat and every version will be removed for good. You cannot undo this.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel
                            disabled={deleteMutation.isPending}
                            className="rounded-[10px]"
                        >
                            Keep it
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
                            disabled={deleteMutation.isPending}
                            className="rounded-[10px] bg-destructive text-primary-foreground hover:bg-destructive/90"
                        >
                            {deleteMutation.isPending ? (
                                <>
                                    <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
                                    Deleting…
                                </>
                            ) : (
                                "Delete project"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    );
};
