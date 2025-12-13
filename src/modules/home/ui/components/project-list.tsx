"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Loader2Icon, ClockIcon, FolderOpenIcon, TrashIcon, ArrowRightIcon } from "lucide-react";
import { Logo } from "@/components/logo";
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
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/30 to-orange-500/30 blur-2xl animate-pulse scale-150" />
                    <div className="relative p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl">
                        <Loader2Icon className="size-8 animate-spin text-amber-500" />
                    </div>
                </div>
                <p className="text-sm text-muted-foreground animate-pulse font-medium">Loading your projects...</p>
            </div>
        );
    }

    if (!projects || projects.length === 0) {
        return null;
    }

    return (
        <section className="space-y-8 py-8">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl blur-lg opacity-30" />
                        <div className="relative p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
                            <FolderOpenIcon className="size-5 text-white" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                            Your Projects
                        </h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {projects.length} project{projects.length !== 1 ? "s" : ""} created
                        </p>
                    </div>
                </div>
            </div>

            {/* Project Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project, index) => (
                    <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className={cn(
                            "group relative block animate-fade-in-up",
                        )}
                        style={{ animationDelay: `${index * 75}ms` }}
                    >
                        {/* Glow effect */}
                        <div className="absolute -inset-px bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-all duration-500" />

                        {/* Card */}
                        <div className={cn(
                            "relative flex flex-col h-full p-5 rounded-2xl transition-all duration-300",
                            "bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl",
                            "border border-zinc-200/80 dark:border-zinc-800/80",
                            "group-hover:border-transparent",
                            "group-hover:shadow-2xl group-hover:shadow-amber-500/10",
                            "group-hover:-translate-y-1"
                        )}>
                            {/* Top row: Logo and Actions */}
                            <div className="flex items-start justify-between mb-4">
                                {/* Logo */}
                                <Logo size={28} withContainer containerClassName="size-12 p-2" hover />

                                {/* Action buttons */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "size-8 rounded-xl transition-all duration-200",
                                            "hover:bg-red-500/10 hover:text-red-500",
                                            "dark:hover:bg-red-500/20"
                                        )}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setDeleteId(project.id);
                                        }}
                                    >
                                        <TrashIcon className="size-4" />
                                    </Button>
                                    <div className={cn(
                                        "size-8 rounded-xl flex items-center justify-center transition-all duration-200",
                                        "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                    )}>
                                        <ArrowRightIcon className="size-4" />
                                    </div>
                                </div>
                            </div>

                            {/* Project name */}
                            <h3 className={cn(
                                "font-semibold text-lg mb-2 truncate transition-colors duration-300",
                                "group-hover:text-amber-600 dark:group-hover:text-amber-400"
                            )}>
                                {project.messages[0]?.content || project.name}
                            </h3>

                            {/* Timestamp */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-800/50">
                                <ClockIcon className="size-3.5" />
                                <span>
                                    {formatDistanceToNow(new Date(project.updatedAt), {
                                        addSuffix: true,
                                    })}
                                </span>
                            </div>

                            {/* Bottom gradient line */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>
                    </Link>
                ))}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-2xl border-zinc-200/80 dark:border-zinc-800/80">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl">Delete Project</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            Are you sure you want to delete this project? This action cannot be undone and all associated data will be permanently removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel
                            disabled={deleteMutation.isPending}
                            className="rounded-xl"
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
                            disabled={deleteMutation.isPending}
                            className="rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25"
                        >
                            {deleteMutation.isPending ? (
                                <>
                                    <Loader2Icon className="size-4 animate-spin mr-2" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete Project"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    );
};
