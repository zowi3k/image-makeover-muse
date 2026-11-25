import { createServerFn } from "@tanstack/react-start";
import { photoInputSchema } from "./photo-input";

// Public, like the existing upload screen; accepts only a bounded inline image,
// never external URLs, and reads or stores no private application data.
export const generatePhoto = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => photoInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { editImage, GatewayError } = await import("@lovable.dev/ai-gateway");
    const { buildPhotoPrompt } = await import("./photo-prompt.server");
    try {
      const image = await (await fetch(data.image)).blob();
      const result = await editImage({
        model: "openai/gpt-image-2.5-sunburst",
        image,
        prompt: buildPhotoPrompt(data),
        n: 1,
        size: "auto",
        quality: "medium",
        output_format: "png",
        background: data.style === "bg" ? "transparent" : "opaque",
      });
      const output = result.data?.[0];
      if (!output?.b64_json) {
        console.error("PixelMagic: image response contained no encoded image");
        return { image: null, error: "ИИ не вернул изображение. Попробуйте изменить описание." };
      }
      return { image: `data:image/png;base64,${output.b64_json}`, error: null };
    } catch (error) {
      if (error instanceof GatewayError) {
        console.error("PixelMagic generation failed", { code: error.code, status: error.httpStatus, ids: error.ids });
        if (error.httpStatus === 402) return { image: null, error: "Недостаточно средств для генерации. Владелец приложения может пополнить баланс Lovable AI." };
        if (error.httpStatus === 429) return { image: null, error: "Сервис занят. Подождите немного перед новой попыткой." };
        if (error.httpStatus === 403) return { image: null, error: "Генерация недоступна для этого приложения. Владелец должен проверить доступ к Lovable AI." };
      } else {
        console.error("PixelMagic generation failed", error);
      }
      return { image: null, error: "Не удалось получить новое фото. Фото и описание сохранены на экране; попробуйте позже." };
    }
  });