"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { Loader2Icon, ArrowRightIcon, ClockIcon, SparklesIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
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
            <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 blur-xl animate-pulse" />
                    <Loader2Icon className="size-8 animate-spin text-amber-500 relative" />
                </div>
                <p className="text-sm text-muted-foreground animate-pulse">Loading your projects...</p>
            </div>
        );
    }

    if (!projects || projects.length === 0) {
        return null;
    }

    return (
        <section className="space-y-8 pb-12">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                    <SparklesIcon className="size-5 text-amber-500" />
                </div>
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        Saved Projects
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {projects.length} project{projects.length !== 1 ? "s" : ""} created
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {projects.map((project, index) => (
                    <div
                        key={project.id}
                        className="group relative"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        {/* Glow effect on hover */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/0 via-orange-500/0 to-rose-500/0 rounded-2xl blur-lg group-hover:from-amber-500/20 group-hover:via-orange-500/20 group-hover:to-rose-500/20 transition-all duration-500 opacity-0 group-hover:opacity-100" />

                        <div className="relative flex flex-col p-5 rounded-xl bg-card border border-border/50 hover:border-amber-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5 group-hover:-translate-y-1">
                            {/* Top section with icon and actions */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="relative">
                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 blur-md opacity-30 group-hover:opacity-50 transition-opacity" />
                                    <div className="relative size-14 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 flex items-center justify-center ring-1 ring-amber-500/20 group-hover:ring-amber-500/40 transition-all">
                                        <Image
                                            src="/logo.svg"
                                            alt="Project"
                                            width={32}
                                            height={32}
                                            className="group-hover:scale-110 transition-transform duration-300"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {/* Delete button */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-500"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setDeleteId(project.id);
                                        }}
                                    >
                                        <TrashIcon className="size-4" />
                                    </Button>
                                    {/* Arrow link */}
                                    <Link
                                        href={`/projects/${project.id}`}
                                        className="size-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-amber-500/10 transition-colors"
                                    >
                                        <ArrowRightIcon className="size-4 text-muted-foreground group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                                    </Link>
                                </div>
                            </div>

                            {/* Project name - clickable */}
                            <Link href={`/projects/${project.id}`}>
                                <h3 className="font-semibold text-lg mb-2 truncate group-hover:text-amber-500 transition-colors cursor-pointer">
                                    {project.name}
                                </h3>
                            </Link>

                            {/* Timestamp */}
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <ClockIcon className="size-3.5" />
                                <span>
                                    {formatDistanceToNow(new Date(project.updatedAt), {
                                        addSuffix: true,
                                    })}
                                </span>
                            </div>

                            {/* Bottom accent line */}
                            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-amber-500/0 to-transparent group-hover:via-amber-500/50 transition-all duration-500 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this project? This action cannot be undone and all associated data will be permanently removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
                            disabled={deleteMutation.isPending}
                            className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                        >
                            {deleteMutation.isPending ? (
                                <>
                                    <Loader2Icon className="size-4 animate-spin mr-2" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    );
};
