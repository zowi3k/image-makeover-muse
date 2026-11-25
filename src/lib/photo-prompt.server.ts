import type { z } from "zod";
import type { photoInputSchema } from "./photo-input";

const instructions = {
  studio: "Create a professional studio portrait with softbox lighting, a tasteful studio background, natural skin texture and premium photographic retouching.",
  cyber: "Reimagine this subject in a futuristic cyberpunk city at night with neon violet and blue lighting, futuristic details and cinematic atmosphere.",
  anime: "Reimagine the subject as a high-quality hand-drawn anime character with expressive eyes, detailed linework and beautiful cel shading.",
  cinema: "Create a cinematic photograph with dramatic film lighting, carefully composed shadows, rich film color grading and subtle film grain.",
  bg: "Remove the entire background. Preserve the foreground subject and fine hair edges. Return an isolated subject on a truly transparent background, not a checkerboard drawn into the image.",
};

export function buildPhotoPrompt(input: Pick<z.infer<typeof photoInputSchema>, "style" | "prompt">) {
  return [
    "Edit the uploaded photograph to create a new image. Preserve the identity, recognizable facial features, pose and composition of the original subject unless the additional description requests a change. Do not add text or watermarks.",
    instructions[input.style],
    input.prompt ? `Additional description from the user: ${input.prompt}` : "",
    input.style === "bg" ? "Background removal and genuine transparency take priority over any background mentioned in the additional description." : "",
  ].filter(Boolean).join("\n");
}