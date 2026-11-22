"use client";

import { useUser } from "@clerk/nextjs";

/** Signed-in heading: uses the first name when the account has one. */
export const Greeting = () => {
    const { user } = useUser();
    const name = user?.firstName?.trim();
    return <>{name ? `What should we build today, ${name}?` : "What should we build today?"}</>;
};
