import { ImageResponse } from "next/og";

// The card shown when a Nova link is shared on social apps and chats.
export const alt = "Nova: describe an app, get it built and working";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "64px 72px",
                    color: "#fff",
                    background: "linear-gradient(120deg, #ffb36b, #ff6a3d 20%, #ff3d7f 40%, #7c5cff 62%, #1fc8e6 85%, #7fe3c0)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 44, fontWeight: 800 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 999, border: "12px solid #fff" }} />
                    nova
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1, letterSpacing: -3 }}>
                        Your ideas, built and working.
                    </div>
                    <div style={{ fontSize: 34, fontWeight: 500, opacity: 0.95 }}>
                        Describe an app. Nova writes, runs and fixes the code.
                    </div>
                </div>
            </div>
        ),
        size,
    );
}
