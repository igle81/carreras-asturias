import icon from "@/lib/brand-icon.json";

export function brandIconPng(): Uint8Array {
  return Uint8Array.from(Buffer.from(icon.png, "base64"));
}

export function brandIconResponse(): Response {
  return new Response(Buffer.from(icon.png, "base64"), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
