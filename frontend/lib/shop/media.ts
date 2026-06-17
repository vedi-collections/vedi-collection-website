// Helpers for product media (images + videos stored in `Product.media`).

const VIDEO_RE = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i;

/** True when a media URL points at a video file (by extension). */
export function isVideoUrl(url: string): boolean {
  return VIDEO_RE.test(url);
}

/** The product's media list, cover first. Falls back to the single cover image
 *  (or an empty list) for products that predate the `media` field. */
export function productMedia(product: { media?: string[]; imageUrl: string | null }): string[] {
  if (product.media && product.media.length > 0) return product.media;
  return product.imageUrl ? [product.imageUrl] : [];
}
