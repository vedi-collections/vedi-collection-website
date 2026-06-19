// Helpers for product media (images + videos stored in `Product.media`).

const VIDEO_RE = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i;

/** True when a media URL points at a video file (by extension). */
export function isVideoUrl(url: string): boolean {
  return VIDEO_RE.test(url);
}

/** The product's media list, ordered for the gallery rail: the chosen cover
 *  image first, then any other images (original order), then video(s) last.
 *  Falls back to the single cover image (or an empty list) for products that
 *  predate the `media` field. */
export function productMedia(product: { media?: string[]; imageUrl: string | null }): string[] {
  if (!product.media || product.media.length === 0) {
    return product.imageUrl ? [product.imageUrl] : [];
  }

  const images = product.media.filter((url) => !isVideoUrl(url));
  const videos = product.media.filter((url) => isVideoUrl(url));

  // Cover (imageUrl) leads the images, keeping the rest in their original order.
  if (product.imageUrl && images.includes(product.imageUrl)) {
    const rest = images.filter((url) => url !== product.imageUrl);
    return [product.imageUrl, ...rest, ...videos];
  }

  return [...images, ...videos];
}
