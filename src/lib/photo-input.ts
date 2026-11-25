import { z } from "zod";

export const photoInputSchema = z.object({
  image: z.string().max(12_000_000).regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/, "Не удалось прочитать фото."),
  style: z.enum(["studio", "cyber", "anime", "cinema", "bg"]),
  prompt: z.string().trim().max(2000, "Описание должно быть не длиннее 2000 символов."),
});