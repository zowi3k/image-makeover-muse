import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Sparkles, Download, RefreshCw, X, Camera, Zap, Clapperboard, Scissors, Wand2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generatePhoto } from "@/lib/photos.functions";

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
  { id: "studio", name: "Студийное фото", icon: Camera },
  { id: "cyber", name: "Киберпанк", icon: Zap },
  { id: "anime", name: "Аниме", icon: Sparkles },
  { id: "cinema", name: "Киношный свет", icon: Clapperboard },
  { id: "bg", name: "Удалить фон", icon: Scissors },
] as const;

type Stage = "edit" | "loading" | "result";

function Index() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [style, setStyle] = useState<(typeof STYLES)[number]["id"]>("studio");
  const [resultPhoto, setResultPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const generate = useServerFn(generatePhoto);
  const busyRef = useRef(false);
  const [prompt, setPrompt] = useState("");
  const [stage, setStage] = useState<Stage>("edit");
  const [split, setSplit] = useState(50);
  const inputRef = useRef<HTMLInputElement>(null);
  const current = STYLES.find((s) => s.id === style) ?? STYLES[0];

  useEffect(() => {
    if (stage !== "loading") return;
    const preventLeave = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", preventLeave);
    return () => window.removeEventListener("beforeunload", preventLeave);
  }, [stage]);

  const onFile = async (file?: File) => {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) { setError("Выберите изображение."); return; }
    setReading(true);
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const ratio = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.naturalWidth * ratio);
      canvas.height = Math.round(img.naturalHeight * ratio);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      setPhoto(canvas.toDataURL("image/png"));
      setResultPhoto(null);
    } catch {
      setError("Не удалось открыть фото. Попробуйте файл JPEG, PNG или WebP.");
    } finally {
      URL.revokeObjectURL(url);
      setReading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onGenerate = async () => {
    if (!photo || busyRef.current || reading) return;
    busyRef.current = true;
    setError(null);
    setResultPhoto(null);
    setStage("loading");
    try {
      const result = await generate({ data: { image: photo, style, prompt } });
      if (!result.image) { setError(result.error); setStage("edit"); return; }
      const img = new Image();
      img.src = result.image;
      await img.decode();
      setResultPhoto(result.image);
      setSplit(50);
      setStage("result");
    } catch {
      setError("Не удалось получить изображение. Попробуйте позже или сократите описание.");
      setStage("edit");
    } finally {
      busyRef.current = false;
    }
  };

  const download = () => {
    if (!resultPhoto) return;
    const a = document.createElement("a");
    a.href = resultPhoto;
    a.download = `pixelmagic-${style}.png`;
    a.click();
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-32 pt-5">
      <header className="mb-5 flex items-center justify-between">
        {stage === "result" ? (
          <Button variant="ghost" onClick={() => setStage("edit")} className="glass grid size-10 place-items-center rounded-full" aria-label="Назад"><ArrowLeft className="size-5" /></Button>
        ) : (
          <div className="bg-neon shadow-glow grid size-10 place-items-center rounded-xl"><Wand2 className="size-5 text-primary-foreground" /></div>
        )}
        <h1 className="font-display text-xl font-extrabold tracking-tight">Pixel<span className="text-neon">Magic</span></h1>
        <div className="glass rounded-full px-3 py-1 text-xs text-muted-foreground">ИИ-студия</div>
      </header>

      {stage === "edit" && (
        <>
          <section>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" disabled={reading} onChange={(e) => onFile(e.target.files?.[0])} />
            {photo ? (
              <div className="relative overflow-hidden rounded-3xl shadow-glow">
                <img src={photo} alt="Ваше фото" className="aspect-[4/5] w-full object-cover" />
                <Button variant="ghost" onClick={() => setPhoto(null)} className="glass absolute right-3 top-3 grid size-9 place-items-center rounded-full" aria-label="Удалить фото"><X className="size-4" /></Button>
                <Button variant="ghost" onClick={() => inputRef.current?.click()} className="glass absolute bottom-3 left-3 rounded-full px-4 py-2 text-sm font-medium">Заменить фото</Button>
              </div>
            ) : (
              <Button variant="ghost" onClick={() => inputRef.current?.click()} className="glass group relative h-auto flex aspect-[4/5] w-full flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed">
                <div className="bg-neon shadow-glow animate-pulse-glow grid size-20 place-items-center rounded-full"><ImagePlus className="size-9 text-primary-foreground" /></div>
                <div className="text-center">
                  <p className="font-display text-base font-semibold">Загрузите фото</p>
                  <p className="mt-1 text-sm text-muted-foreground">Из галереи или камеры телефона</p>
                </div>
              </Button>
            )}
          </section>

          <section className="mt-6">
            <h2 className="mb-3 font-display text-sm font-semibold text-muted-foreground">Выберите стиль</h2>
            <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
              {STYLES.map((s) => {
                const active = s.id === style;
                const Icon = s.icon;
                return (
                  <Button variant="ghost" key={s.id} onClick={() => setStyle(s.id)}
                    className={`h-auto whitespace-normal snap-start shrink-0 w-28 rounded-2xl p-[2px] transition ${active ? "bg-neon shadow-glow" : "bg-border"}`}>
                    <div className="flex h-32 flex-col justify-between rounded-[14px] bg-card p-3 text-left">
                      <div className={`grid size-10 place-items-center rounded-xl ${active ? "bg-neon" : "bg-secondary"}`}><Icon className="size-5" /></div>
                      <span className="text-sm font-semibold leading-tight">{s.name}</span>
                    </div>
                  </Button>
                );
              })}
            </div>
          </section>

          <section className="mt-5">
            <label htmlFor="prompt" className="mb-2 block font-display text-sm font-semibold text-muted-foreground">Своё описание <span className="font-sans font-normal">(необязательно)</span></label>
            <textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} maxLength={2000}
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
                 <div className="absolute inset-0 grid place-items-center"><Sparkles className="size-8 motion-safe:animate-pulse" /></div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="font-display font-semibold">Творим магию…</p>
            <p className="mt-1 text-sm text-muted-foreground">Стиль «{current.name}»</p>
          </div>
        </section>
      )}

      {stage === "result" && photo && resultPhoto && (
        <section>
          <div className="relative aspect-[4/5] w-full touch-none select-none overflow-hidden rounded-3xl shadow-glow">
            <img src={resultPhoto} alt="После" className="absolute inset-0 size-full object-contain bg-secondary" />
            <img src={photo} alt="До" className="absolute inset-0 size-full object-contain" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }} />
            <div className="absolute inset-y-0 w-0.5 bg-neon shadow-glow" style={{ left: `${split}%` }}>
              <div className="bg-neon shadow-glow absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-xs font-bold">⇆</div>
            </div>
            <span className="glass absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold">До</span>
            <span className="glass absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold">После</span>
            <input type="range" min={0} max={100} value={split} onChange={(e) => setSplit(+e.target.value)} aria-label="Сравнить до и после" className="absolute inset-0 size-full cursor-ew-resize opacity-0" />
          </div>
          <p className="mt-3 text-center text-sm text-muted-foreground">{current.name}</p>
          <Button variant="ghost" onClick={() => setStage("edit")} className="glass mt-5 h-auto flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-semibold">
            <RefreshCw className="size-4" /> Попробовать другой стиль
          </Button>
        </section>
      )}

      {error && <p role="alert" className="glass mt-4 rounded-xl p-4 text-sm text-foreground">{error}</p>}

      {stage !== "loading" && (
        <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background via-background/90 to-transparent px-4 pb-6 pt-8">
          <div className="mx-auto max-w-md">
            {stage === "edit" ? (
              <Button variant="ghost" disabled={!photo || reading} onClick={onGenerate}
                className="bg-neon shadow-glow h-auto flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-display text-base font-bold text-primary-foreground transition active:scale-[.98] disabled:opacity-40 disabled:shadow-none">
                <Sparkles className="size-5" /> {reading ? "Загружаем фото…" : photo ? "Сгенерировать" : "Сначала загрузите фото"}
              </Button>
            ) : (
              <Button variant="ghost" onClick={download} className="bg-neon shadow-glow h-auto flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-display text-base font-bold text-primary-foreground active:scale-[.98]">
                <Download className="size-5" /> Скачать
              </Button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
