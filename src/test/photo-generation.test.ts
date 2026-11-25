import { describe, expect, it } from "vitest";
import { buildPhotoPrompt } from "@/lib/photo-prompt.server";
import { photoInputSchema } from "@/lib/photo-input";

describe("Photo generation", () => {
  it("uses a distinct transformation for every selected style", () => {
    const expected = { studio: "softbox lighting", cyber: "cyberpunk city", anime: "anime character", cinema: "dramatic film lighting", bg: "truly transparent background" } as const;
    for (const style of ["studio", "cyber", "anime", "cinema", "bg"] as const) {
      expect(buildPhotoPrompt({ style, prompt: "" })).toContain(expected[style]);
    }
  });
  it("includes the user's description in the image editing request", () => {
    expect(buildPhotoPrompt({ style: "studio", prompt: "Красный пиджак, мягкий свет" })).toContain("Красный пиджак, мягкий свет");
  });
  it("accepts an optional empty description", () => {
    expect(photoInputSchema.parse({ image: "data:image/png;base64,aGVsbG8=", style: "anime", prompt: "" }).prompt).toBe("");
  });
  it("rejects remote image URLs rather than fetching arbitrary addresses", () => {
    expect(photoInputSchema.safeParse({ image: "https://example.com/photo.png", style: "studio", prompt: "" }).success).toBe(false);
  });
});