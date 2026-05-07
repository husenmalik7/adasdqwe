import { useEffect, useRef } from 'react';
import { X, ExternalLink, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Booth = {
  cells: { x: number; y: number }[];
  id: number;
  circle_code: string;
  name: string;
  circle_cut: string;
  circle_facebook: string;
  circle_instagram: string;
  circle_twitter: string;
  circle_other_socials: string;
  sampleworks_images: string[];
  day: string;
  circle_type: string;
};

type BoothModalProps = {
  booth: Booth | null;
  onClose: () => void;
  onLocate?: (booth: Booth) => void;
};

export const BoothModal = ({ booth, onClose, onLocate }: BoothModalProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (booth) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [booth]);

  if (!booth) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  // const coverImage = booth.sampleworks_images?.[0] ?? null;
  const coverImage = booth.circle_cut ?? null;

  const socials = [
    booth.circle_instagram && { label: 'Instagram', url: booth.circle_instagram },
    booth.circle_twitter && { label: 'Twitter / X', url: booth.circle_twitter },
    booth.circle_facebook && { label: 'Facebook', url: booth.circle_facebook },
    booth.circle_other_socials && { label: 'Lainnya', url: booth.circle_other_socials },
  ].filter(Boolean) as { label: string; url: string }[];

  return (
    /* Overlay */
    <div
      ref={overlayRef}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
    >
      {/* Modal card */}
      <div
        className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-card shadow-2xl border border-border"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
          aria-label="Tutup modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Cover image */}
        <div className="relative h-44 w-full shrink-0 overflow-hidden bg-muted">
          {coverImage ? (
            <img
              src={coverImage}
              alt={`Cover ${booth.name}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
              Tidak ada gambar
            </div>
          )}
          {/* Gradient fade bottom */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card/80 to-transparent" />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3 overflow-y-auto p-4 pt-3">
          {/* Badge & name */}
          <div className="flex items-start gap-2">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="flex gap-1.5 flex-wrap">
                {booth.circle_code && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    {booth.circle_code}
                  </span>
                )}
                {booth.day && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {booth.day}
                  </span>
                )}
                {booth.circle_type && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {booth.circle_type}
                  </span>
                )}
              </div>
              <h2 className="truncate text-lg font-bold text-foreground leading-tight">
                {booth.name}
              </h2>
            </div>
          </div>

          {/* Sample works grid (remaining images) */}
          {booth.sampleworks_images && booth.sampleworks_images.length > 1 && (
            <div className="grid grid-cols-3 gap-1 rounded-lg overflow-hidden">
              {booth.sampleworks_images.slice(1, 4).map((img, i) => (
                <div key={i} className="aspect-square overflow-hidden bg-muted">
                  <img src={img} alt={`Sample ${i + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Socials */}
          {socials.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
                >
                  <ExternalLink className="h-3 w-3" />
                  {s.label}
                </a>
              ))}
            </div>
          )}

          {/* circle_cut / description */}
          {booth.circle_cut && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
              {booth.circle_cut}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            {onLocate && (
              <Button
                size="sm"
                variant="default"
                className="flex-1 gap-1.5 text-xs"
                onClick={() => {
                  onLocate(booth);
                  onClose();
                }}
              >
                <MapPin className="h-3.5 w-3.5" />
                Tunjukkan di Peta
              </Button>
            )}
            <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
