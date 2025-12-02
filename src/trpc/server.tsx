import 'server-only'; // <-- ensure this file cannot be imported from the client
import { cache } from 'react';
import { createTRPCContext } from './init';
import { makeQueryClient } from './query-client';
import { appRouter } from './routers/_app';

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);

// Create a stable caller
const getCaller = async () => {
  return appRouter.createCaller(await createTRPCContext());
};

// Helper to create query options for server-side prefetching
export const trpc = {
  messages: {
    getMany: {
      queryOptions: (input: { projectId: string }) => ({
        queryKey: [['messages', 'getMany'], { input, type: 'query' }],
        queryFn: async () => {
          const caller = await getCaller();
          return caller.messages.getMany(input);
        },
      }),
    },
  },
  projects: {
    getOne: {
      queryOptions: (input: { id: string }) => ({
        queryKey: [['projects', 'getOne'], { input, type: 'query' }],
        queryFn: async () => {
          const caller = await getCaller();
          return caller.projects.getOne(input);
        },
      }),
    },
  },
};
