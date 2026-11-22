import { cn } from "@/lib/utils";

/** An illustrative app Nova could build, drawn as a small live-looking site. */
export const YogaPreview = ({ className }: { className?: string }) => (
    <div className={cn("h-full bg-[#fbfaf7] p-4 text-[#1f1d1a] sm:p-5", className)} aria-hidden="true">
        <div className="flex items-center gap-4 text-[11px] text-[#6b6660]">
            <b className="mr-auto text-[13px] text-[#1f1d1a]">Stillwater Yoga</b>
            <span>Classes</span>
            <span className="hidden sm:inline">Teachers</span>
            <span>Prices</span>
        </div>
        <div className="mt-4 grid grid-cols-[1.4fr_1fr] gap-4">
            <div>
                <p className="text-2xl font-bold tracking-[-0.03em]">Book a class</p>
                <p className="mt-0.5 text-[11px] text-[#8a847c]">Week of 2 December</p>
                <div className="mt-3 grid grid-cols-5 gap-1.5">
                    {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, i) => (
                        <div
                            key={day}
                            className={cn(
                                "rounded-lg py-1.5 text-center text-[13px] font-bold",
                                i === 2 ? "bg-[#2f5d50] text-white" : "bg-[#efece6]",
                            )}
                        >
                            <span className={cn("block text-[9.5px] font-medium", i === 2 ? "text-[#cfe3dc]" : "text-[#8a847c]")}>
                                {day}
                            </span>
                            {i + 2}
                        </div>
                    ))}
                </div>
                <div className="mt-2.5 grid gap-1.5 text-[11px]">
                    <div className="rounded-lg border border-[#e8e4dd] px-2.5 py-1.5"><b>7:00</b> Vinyasa flow</div>
                    <div className="rounded-lg border border-[#2f5d50] px-2.5 py-1.5 shadow-[inset_0_0_0_1px_#2f5d50]"><b>12:30</b> Lunchtime stretch</div>
                    <div className="rounded-lg border border-[#e8e4dd] px-2.5 py-1.5"><b>18:00</b> Yin and breath</div>
                </div>
            </div>
            <div className="self-start rounded-xl border border-[#e8e4dd] bg-white p-3 text-[11px]">
                <p className="text-[13.5px] font-bold">Lunchtime stretch</p>
                <p className="mb-2 text-[#8a847c]">Wed 4, 12:30</p>
                <div className="mb-1.5 h-7 rounded-md border border-[#ddd8cf] px-2 py-1.5">Priya Shah</div>
                <div className="mb-1.5 h-7 rounded-md border border-[#ddd8cf] px-2 py-1.5">priya@hey.com</div>
                <div className="grid h-[30px] place-items-center rounded-lg bg-[#2f5d50] font-bold text-white">Book my spot</div>
            </div>
        </div>
    </div>
);
