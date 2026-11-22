"use client";

import { useCurrentTheme } from "@/hooks/use-current-theme";
import { UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { cn } from "@/lib/utils";

interface Props {
    showName?: boolean;
    /** White name, for use on the nova gradient. */
    inverted?: boolean;
}

export const UserControl = ({ showName, inverted }: Props) => {
    const currentTheme = useCurrentTheme();
    return (
        <div className="flex items-center gap-2">
            <UserButton
                showName={showName}
                appearance={{
                    elements: {
                        userButtonBox: cn("rounded-full! font-sans! font-medium!", inverted ? "text-white!" : "text-foreground!"),
                        userButtonAvatarBox: "size-8! ring-2! ring-white/70!",
                        userButtonTrigger: "rounded-full! focus-visible:ring-2! focus-visible:ring-ring!",
                    },
                    baseTheme: currentTheme === "dark" ? dark : undefined,
                }}
            />
        </div>
    );
};
