// Client-side square cropping for product images. The seller uploads photos of
// any shape; we normalise every image to a 1:1 square so the storefront gallery
// shows uniform dimensions. The transform lets staff pan/zoom to crop; at the
// minimum zoom the whole image is kept and the leftover space is filled black
// (letterbox), so nothing is ever cut off unless they choose to crop.

export type CropTransform = {
  /** 1 = fit whole image (padded). >1 zooms in and crops. */
  zoom: number;
  /** Pan, as a fraction of the square side, in [-1, 1]. */
  offsetX: number;
  offsetY: number;
};

export const OUTPUT_SIZE = 1080; // exported square side, in px

/** Letterbox padding for uncropped images. Resolved from the site background
 *  token (`--color-bg`) so the bars blend into the page instead of showing as
 *  black; falls back to the cream default when no DOM/theme is available. */
function padColor(): string {
  if (typeof document !== "undefined") {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--color-bg").trim();
    if (v) return `rgb(${v})`;
  }
  return "#faf5ec"; // matches --color-bg default (cream)
}

/** Draw the image into a square canvas: site-background padding + the image
 *  scaled by `zoom` (relative to a contain-fit) and panned by the offsets. Same
 *  math for the live preview and the final export, so what you see is what you
 *  get. */
export function drawSquare(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  t: CropTransform,
  size: number,
): void {
  ctx.fillStyle = padColor();
  ctx.fillRect(0, 0, size, size);

  const fit = Math.min(size / img.naturalWidth, size / img.naturalHeight);
  const scale = fit * t.zoom;
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  const x = (size - w) / 2 + t.offsetX * size;
  const y = (size - h) / 2 + t.offsetY * size;
  ctx.drawImage(img, x, y, w, h);
}

/** Largest allowed pan (fraction of the side) so a cropped image still covers
 *  the square; 0 when zoomed out (image stays centred and padded). */
export function panBounds(img: HTMLImageElement, t: CropTransform, size: number): { x: number; y: number } {
  const fit = Math.min(size / img.naturalWidth, size / img.naturalHeight);
  const scale = fit * t.zoom;
  return {
    x: Math.max(0, (img.naturalWidth * scale - size) / 2) / size,
    y: Math.max(0, (img.naturalHeight * scale - size) / 2) / size,
  };
}

/** Clamp a transform's offsets to the pan bounds for its zoom. */
export function clampTransform(img: HTMLImageElement, t: CropTransform, size = OUTPUT_SIZE): CropTransform {
  const b = panBounds(img, t, size);
  return {
    zoom: t.zoom,
    offsetX: Math.min(b.x, Math.max(-b.x, t.offsetX)),
    offsetY: Math.min(b.y, Math.max(-b.y, t.offsetY)),
  };
}

/** Render the final square as a JPEG blob at OUTPUT_SIZE. */
export function exportSquare(img: HTMLImageElement, t: CropTransform): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas not supported"));
  drawSquare(ctx, img, t, OUTPUT_SIZE);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image"))),
      "image/jpeg",
      0.9,
    ),
  );
}

/** Load a File into an HTMLImageElement. Caller revokes via the returned url. */
export function loadImageFromFile(file: File): Promise<{ img: HTMLImageElement; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

/** Swap a filename's extension to .jpg (cropped output is always JPEG). */
export function toJpgName(name: string): string {
  const base = name.replace(/\.[^./\\]+$/, "");
  return `${base || "image"}.jpg`;
}
