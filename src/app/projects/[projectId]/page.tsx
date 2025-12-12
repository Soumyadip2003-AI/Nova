import { ProjectView } from "@/modules/projects/ui/views/project-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";


interface Props {
    params: Promise<{ projectId: string ;}>
};

const Page = async ({ params }: Props) => {
    const { userId } = await auth();

    // Redirect to sign-in if not authenticated
    if (!userId) {
        redirect("/sign-in");
    }

    const { projectId } = await params;
    const queryClient = getQueryClient();

    
       void queryClient.prefetchQuery(trpc.messages.getMany.queryOptions({
            projectId,
        }));
       void queryClient.prefetchQuery({
            ...trpc.projects.getOne.queryOptions({
                id: projectId,
            }),
            staleTime: 5 * 60 * 1000, // 5 minutes
       });
    

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Suspense fallback={<p>Loading.......</p>}>
                <ProjectView projectId={projectId} />
            </Suspense>
        </HydrationBoundary>
    );
};
export default Page;
