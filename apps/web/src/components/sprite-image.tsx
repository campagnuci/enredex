import { useState, type ImgHTMLAttributes } from "react";

/**
 * Renders a sprite <img> with automatic female→base variant fallback.
 * Showdown doesn't host female sprites for every species — when a
 * gendered variant 404s we retry without the "-f" suffix.
 */
export function SpriteImage({
  className,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const [didFallback, setDidFallback] = useState(false);

  return (
    <img
      {...props}
      className={className}
      onError={(e) => {
        if (didFallback) return;
        const img = e.currentTarget;
        if (img.src.includes("-f.png")) {
          setDidFallback(true);
          img.src = img.src.replace("-f.png", ".png");
        }
      }}
    />
  );
}
