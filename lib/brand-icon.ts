import part1 from "@/lib/brand-icon-1.json";
import part2 from "@/lib/brand-icon-2.json";

const png = part1.png + part2.png;

export function brandIconPng(): Uint8Array {
  return Uint8Array.from(Buffer.from(png, "base64"));
}

export function brandIconResponse(): Response {
  return new Response(Buffer.from(png, "base64"), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
