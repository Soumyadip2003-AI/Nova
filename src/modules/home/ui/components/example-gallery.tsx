import { YogaPreview } from "./yoga-preview";

const Caption = ({ title, prompt }: { title: string; prompt: string }) => (
    <figcaption className="relative z-10 mt-auto pt-4">
        <span className="block text-[15px] font-bold">{title}</span>
        <span className="mt-0.5 block text-[13px] font-medium opacity-75">&ldquo;{prompt}&rdquo;</span>
    </figcaption>
);

const Frame = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div aria-hidden="true" className={`overflow-hidden rounded-xl shadow-[0_18px_40px_-20px_rgba(0,0,0,.45)] ${className}`}>
        {children}
    </div>
);

/** Example apps, illustrative only, so visitors see the kind of thing Nova makes. */
export const ExampleGallery = () => (
    <section id="examples" aria-labelledby="examples-title" className="scroll-mt-6 pt-24 sm:pt-32">
        <h2 id="examples-title" className="max-w-[720px] text-4xl font-bold tracking-[-0.04em] sm:text-[52px] sm:leading-[1.04]">
            People are building real things.
        </h2>
        <p className="mt-4 max-w-[560px] text-lg leading-relaxed text-muted-foreground">
            Each one starts as a single sentence and changes by chatting. These are examples.
        </p>
        <div className="mt-12 grid gap-5 md:grid-cols-[1.3fr_1fr_1fr] md:grid-rows-[260px_260px]">
            <figure className="flex flex-col rounded-[20px] bg-[#2f5d50] p-5 text-white md:row-span-2">
                <Frame className="h-[300px] md:h-auto md:flex-1"><YogaPreview /></Frame>
                <Caption title="Stillwater Yoga" prompt="A booking site for my yoga studio" />
            </figure>
            <figure className="flex min-h-[260px] flex-col rounded-[20px] bg-[#ffe8d6] p-5 text-[#3b1d0c]">
                <Frame className="flex-1 bg-white p-3.5">
                    <p className="text-lg font-bold tracking-[-0.03em]">Crumb &amp; Co.</p>
                    <div className="mt-2.5 grid grid-cols-3 gap-2">
                        <span className="h-14 rounded-lg bg-[#f6c89f]" />
                        <span className="h-14 rounded-lg bg-[#e9a56b]" />
                        <span className="h-14 rounded-lg bg-[#c7794a]" />
                    </div>
                </Frame>
                <Caption title="Bakery shop" prompt="An order page for my bakery" />
            </figure>
            <figure className="flex min-h-[260px] flex-col rounded-[20px] bg-[#e8e6ff] p-5 text-[#22175e]">
                <Frame className="grid flex-1 grid-cols-3 gap-2 bg-white p-3.5">
                    {[["#c9c2ff", "#fff"], ["#fff"], ["#9f90ff", "#fff", "#fff"]].map((col, i) => (
                        <div key={i} className="grid content-start gap-1.5 rounded-lg bg-[#f1f0ff] p-1.5">
                            {col.map((c, j) => <span key={j} className="h-3.5 rounded" style={{ background: c }} />)}
                        </div>
                    ))}
                </Frame>
                <Caption title="Team board" prompt="A kanban board for my team" />
            </figure>
            <figure className="flex min-h-[260px] flex-col rounded-[20px] bg-[#0b1b33] p-5 text-white">
                <Frame className="flex-1 bg-[#121f38] p-3.5">
                    <p className="text-[11px] text-[#8ea0c0]">Revenue</p>
                    <p className="text-2xl font-bold">$48,210</p>
                    <div className="mt-2 flex h-12 items-end gap-1.5">
                        {[40, 60, 52, 85, 70].map((h, i) => (
                            <span key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i === 3 ? "#1fc8e6" : "#2b4d8f" }} />
                        ))}
                    </div>
                </Frame>
                <Caption title="Admin dashboard" prompt="A sales dashboard for my shop" />
            </figure>
            <figure className="flex min-h-[260px] flex-col rounded-[20px] bg-[#d9f3ec] p-5 text-[#0d3b2e]">
                <Frame className="flex-1 bg-white p-4">
                    <p className="text-xl font-bold tracking-[-0.03em]">Aarav Mehta</p>
                    <p className="text-[11px] text-[#667]">Photographer in Pune</p>
                    <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                        <span className="h-11 rounded-md bg-[#9cd9c6]" />
                        <span className="h-11 rounded-md bg-[#5fb79d]" />
                        <span className="h-11 rounded-md bg-[#2f8f74]" />
                    </div>
                </Frame>
                <Caption title="Portfolio" prompt="A portfolio for my photos" />
            </figure>
        </div>
    </section>
);
