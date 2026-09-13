import part1 from "@/lib/brand-icon-1.json";
import part2 from "@/lib/brand-icon-2.json";
import part3 from "@/lib/brand-icon-3.json";

function brandIconBase64(): string {
  return part1.p + part2.p + part3.p;
}

export function brandIconPng(): Uint8Array {
  return Uint8Array.from(Buffer.from(brandIconBase64(), "base64"));
}

export function brandIconResponse(): Response {
  return new Response(Buffer.from(brandIconBase64(), "base64"), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
