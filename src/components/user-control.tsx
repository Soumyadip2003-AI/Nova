"use client";

import { useCurrentTheme } from "@/hooks/use-current-theme";
import { UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

interface Props {
    showName?: boolean;
}

export const UserControl = ({ showName }: Props) => {
    const currentTheme = useCurrentTheme();
    return (
        <div className="flex items-center gap-2">
            <UserButton
                showName={showName}
                appearance={{
                    elements: {
                        userButtonBox: "rounded-[10px]! font-sans! text-foreground!",
                        userButtonAvatarBox: "rounded-[10px]! size-8! border-[1.5px]! border-foreground!",
                        userButtonTrigger: "rounded-[10px]! focus-visible:ring-2! focus-visible:ring-ring!",
                    },
                    baseTheme: currentTheme === "dark" ? dark : undefined,
                }}
            />
        </div>
    );
};
