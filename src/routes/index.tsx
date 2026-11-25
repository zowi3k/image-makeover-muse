import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Sparkles, Download, RefreshCw, X, Camera, Zap, Clapperboard, Scissors, Wand2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PixelMagic — ИИ-фотостудия в Telegram" },
      { name: "description", content: "Загрузите фото и преобразите его в студийный, аниме, киберпанк или киношный стиль за секунды." },
      { property: "og:title", content: "PixelMagic — ИИ-фотостудия" },
      { property: "og:description", content: "Преобразите своё фото с помощью ИИ прямо в Telegram." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const STYLES = [
  { id: "studio", name: "Студийное фото", icon: Camera, filter: "contrast(1.1) saturate(1.1) brightness(1.08)" },
  { id: "cyber", name: "Киберпанк", icon: Zap, filter: "hue-rotate(250deg) saturate(2) contrast(1.2)" },
  { id: "anime", name: "Аниме", icon: Sparkles, filter: "saturate(1.8) contrast(1.3) brightness(1.1)" },
  { id: "cinema", name: "Киношный свет", icon: Clapperboard, filter: "sepia(.35) contrast(1.25) saturate(1.2) brightness(.92)" },
  { id: "bg", name: "Удалить фон", icon: Scissors, filter: "grayscale(.2) contrast(1.15)" },
] as const;

type Stage = "edit" | "loading" | "result";

function Index() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [style, setStyle] = useState<string>("studio");
  const [prompt, setPrompt] = useState("");
  const [stage, setStage] = useState<Stage>("edit");
  const [progress, setProgress] = useState(0);
  const [split, setSplit] = useState(50);
  const inputRef = useRef<HTMLInputElement>(null);
  const current = STYLES.find((s) => s.id === style)!;

  useEffect(() => {
    if (stage !== "loading") return;
    setProgress(0);
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(t); setStage("result"); return 100; }
        return p + 4;
      });
    }, 110);
    return () => clearInterval(t);
  }, [stage]);

  const onFile = (f?: File) => { if (f) { setPhoto(URL.createObjectURL(f)); } };

  const download = () => {
    if (!photo) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d")!;
      ctx.filter = current.filter;
      ctx.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.href = c.toDataURL("image/jpeg", 0.92);
      a.download = `pixelmagic-${style}.jpg`;
      a.click();
    };
    img.src = photo;
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-32 pt-5">
      <header className="mb-5 flex items-center justify-between">
        {stage === "result" ? (
          <button onClick={() => setStage("edit")} className="glass grid size-10 place-items-center rounded-full" aria-label="Назад"><ArrowLeft className="size-5" /></button>
        ) : (
          <div className="bg-neon shadow-glow grid size-10 place-items-center rounded-xl"><Wand2 className="size-5 text-primary-foreground" /></div>
        )}
        <h1 className="font-display text-xl font-extrabold tracking-tight">Pixel<span className="text-neon">Magic</span></h1>
        <div className="glass rounded-full px-3 py-1 text-xs text-muted-foreground">ИИ-студия</div>
      </header>

      {stage === "edit" && (
        <>
          <section>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            {photo ? (
              <div className="relative overflow-hidden rounded-3xl shadow-glow">
                <img src={photo} alt="Ваше фото" className="aspect-[4/5] w-full object-cover" />
                <button onClick={() => setPhoto(null)} className="glass absolute right-3 top-3 grid size-9 place-items-center rounded-full" aria-label="Удалить фото"><X className="size-4" /></button>
                <button onClick={() => inputRef.current?.click()} className="glass absolute bottom-3 left-3 rounded-full px-4 py-2 text-sm font-medium">Заменить фото</button>
              </div>
            ) : (
              <button onClick={() => inputRef.current?.click()} className="glass group relative flex aspect-[4/5] w-full flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed">
                <div className="bg-neon shadow-glow animate-pulse-glow grid size-20 place-items-center rounded-full"><ImagePlus className="size-9 text-primary-foreground" /></div>
                <div className="text-center">
                  <p className="font-display text-base font-semibold">Загрузите фото</p>
                  <p className="mt-1 text-sm text-muted-foreground">Из галереи или камеры телефона</p>
                </div>
              </button>
            )}
          </section>

          <section className="mt-6">
            <h2 className="mb-3 font-display text-sm font-semibold text-muted-foreground">Выберите стиль</h2>
            <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
              {STYLES.map((s) => {
                const active = s.id === style;
                const Icon = s.icon;
                return (
                  <button key={s.id} onClick={() => setStyle(s.id)}
                    className={`snap-start shrink-0 w-28 rounded-2xl p-[2px] transition ${active ? "bg-neon shadow-glow" : "bg-border"}`}>
                    <div className="flex h-32 flex-col justify-between rounded-[14px] bg-card p-3 text-left">
                      <div className={`grid size-10 place-items-center rounded-xl ${active ? "bg-neon" : "bg-secondary"}`}><Icon className="size-5" /></div>
                      <span className="text-sm font-semibold leading-tight">{s.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-5">
            <label htmlFor="prompt" className="mb-2 block font-display text-sm font-semibold text-muted-foreground">Своё описание <span className="font-sans font-normal">(необязательно)</span></label>
            <textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3}
              placeholder="Например: неоновый город ночью, мягкий свет…"
              className="glass w-full resize-none rounded-2xl px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" />
          </section>
        </>
      )}

      {stage === "loading" && photo && (
        <section className="flex flex-1 flex-col items-center justify-center gap-6">
          <div className="relative w-full overflow-hidden rounded-3xl shadow-glow">
            <img src={photo} alt="" className="aspect-[4/5] w-full object-cover blur-sm brightness-50" />
            <div className="bg-neon animate-scan absolute inset-x-0 h-1 shadow-glow" />
            <div className="absolute inset-0 grid place-items-center">
              <div className="relative size-24">
                <div className="bg-neon animate-spin-slow absolute inset-0 rounded-full p-1 [mask:radial-gradient(farthest-side,transparent_calc(100%-4px),black_0)]" />
                <div className="absolute inset-0 grid place-items-center font-display text-xl font-bold">{progress}%</div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="font-display font-semibold">Творим магию…</p>
            <p className="mt-1 text-sm text-muted-foreground">Стиль «{current.name}»</p>
          </div>
        </section>
      )}

      {stage === "result" && photo && (
        <section>
          <div className="relative aspect-[4/5] w-full touch-none select-none overflow-hidden rounded-3xl shadow-glow">
            <img src={photo} alt="После" className="absolute inset-0 size-full object-cover" style={{ filter: current.filter }} />
            <img src={photo} alt="До" className="absolute inset-0 size-full object-cover" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }} />
            <div className="absolute inset-y-0 w-0.5 bg-neon shadow-glow" style={{ left: `${split}%` }}>
              <div className="bg-neon shadow-glow absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-xs font-bold">⇆</div>
            </div>
            <span className="glass absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold">До</span>
            <span className="glass absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold">После</span>
            <input type="range" min={0} max={100} value={split} onChange={(e) => setSplit(+e.target.value)} aria-label="Сравнить до и после" className="absolute inset-0 size-full cursor-ew-resize opacity-0" />
          </div>
          <p className="mt-3 text-center text-sm text-muted-foreground">Двигайте ползунок, чтобы сравнить · {current.name}</p>
          <button onClick={() => setStage("edit")} className="glass mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-semibold">
            <RefreshCw className="size-4" /> Попробовать другой стиль
          </button>
        </section>
      )}

      {stage !== "loading" && (
        <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background via-background/90 to-transparent px-4 pb-6 pt-8">
          <div className="mx-auto max-w-md">
            {stage === "edit" ? (
              <button disabled={!photo} onClick={() => setStage("loading")}
                className="bg-neon shadow-glow flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-display text-base font-bold text-primary-foreground transition active:scale-[.98] disabled:opacity-40 disabled:shadow-none">
                <Sparkles className="size-5" /> {photo ? "Сгенерировать" : "Сначала загрузите фото"}
              </button>
            ) : (
              <button onClick={download} className="bg-neon shadow-glow flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-display text-base font-bold text-primary-foreground active:scale-[.98]">
                <Download className="size-5" /> Скачать
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
