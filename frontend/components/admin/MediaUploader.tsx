"use client";

import { useRef, useState } from "react";

import { ImageCropDialog } from "@/components/admin/ImageCropDialog";
import { buttonClasses } from "@/components/ui/Button";
import { uploadMedia } from "@/lib/admin/api";
import { toJpgName } from "@/lib/admin/crop";

const VIDEO_RE = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i;

function isVideo(url: string): boolean {
  return VIDEO_RE.test(url);
}

type MediaUploaderProps = {
  /** Ordered list of media URLs. The first item is the storefront cover. */
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
};

/** Upload product images/videos from the device. Images are squared (cropped or
 *  black-padded) via the crop dialog before upload; videos upload as-is. The
 *  returned public URLs are appended to `value`. */
export function MediaUploader({ value, onChange, disabled }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Images waiting to be cropped, processed one at a time via ImageCropDialog.
  const [cropQueue, setCropQueue] = useState<File[]>([]);

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const urls = await uploadMedia(files);
      onChange([...value, ...urls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleFiles(fileList: FileList | null) {
    const files = fileList ? Array.from(fileList) : [];
    if (inputRef.current) inputRef.current.value = ""; // allow re-selecting the same file
    if (files.length === 0) return;
    setError(null);

    const images = files.filter((f) => f.type.startsWith("image/"));
    const videos = files.filter((f) => f.type.startsWith("video/"));
    if (images.length + videos.length !== files.length) {
      setError("Only images and videos are allowed.");
    }

    await uploadFiles(videos); // videos need no cropping
    if (images.length > 0) setCropQueue((q) => [...q, ...images]); // crop images first
  }

  async function onCropDone(blob: Blob) {
    const source = cropQueue[0];
    const file = new File([blob], toJpgName(source.name), { type: "image/jpeg" });
    await uploadFiles([file]);
    setCropQueue((q) => q.slice(1)); // advance only after the upload settles
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function makeCover(index: number) {
    if (index === 0) return;
    const next = [...value];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    onChange(next);
  }

  const busy = uploading || cropQueue.length > 0;

  return (
    <div className="mt-1 space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={(e) => void handleFiles(e.target.files)}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || busy}
          className={buttonClasses("primary", "md", "!font-bold !text-base")}
        >
          {busy ? "Uploading…" : value.length > 0 ? "Add more" : "Upload images / videos"}
        </button>
        <span className="text-sm text-muted-soft">Images are squared (1:1); videos up to 25 MB.</span>
      </div>

      {error && (
        <p role="alert" className="text-base text-primary">
          {error}
        </p>
      )}

      {value.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {value.map((url, i) => (
            <li
              key={url}
              className="relative aspect-square overflow-hidden rounded-lg border border-line bg-surface-alt"
            >
              {isVideo(url) ? (
                <video src={url} className="h-full w-full object-cover" muted playsInline />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- admin preview of arbitrary storage URLs; next/image remote config not warranted
                <img src={url} alt="" className="h-full w-full object-cover" />
              )}

              {i === 0 ? (
                <span className="absolute left-1 top-1 rounded bg-primary/85 px-1.5 py-0.5 text-xs font-semibold text-primary-fg">
                  Cover
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => makeCover(i)}
                  className="absolute left-1 top-1 rounded bg-surface/90 px-1.5 py-0.5 text-xs font-semibold text-primary hover:bg-surface"
                >
                  Make cover
                </button>
              )}

              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label="Remove media"
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-primary text-base leading-none text-primary-fg opacity-90 hover:opacity-100"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {cropQueue.length > 0 && (
        <ImageCropDialog
          key={cropQueue.length}
          file={cropQueue[0]}
          remaining={cropQueue.length}
          onDone={onCropDone}
          onSkip={() => setCropQueue((q) => q.slice(1))}
        />
      )}
    </div>
  );
}
