import { useEffect, useRef } from 'react';
import { X, ExternalLink, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck } from 'lucide-react';

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
  isBookmarked?: boolean; // ← baru
  onToggleBookmark?: (booth: Booth) => void; // ← baru
};

export const BoothModal = ({
  booth,
  onClose,
  onLocate,
  isBookmarked,
  onToggleBookmark,
}: BoothModalProps) => {
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

  const coverImage = booth.circle_cut ?? null;

  const socials = [
    booth.circle_instagram && { label: 'Instagram', url: booth.circle_instagram },
    booth.circle_twitter && { label: 'Twitter / X', url: booth.circle_twitter },
    booth.circle_facebook && { label: 'Facebook', url: booth.circle_facebook },
    booth.circle_other_socials && { label: 'Lainnya', url: booth.circle_other_socials },
  ].filter(Boolean) as { label: string; url: string }[];

  return (
    /*
     * Overlay
     * Mobile  : bottom sheet (items-end), rounded top corners only
     * Desktop : center modal (sm:items-center), side-by-side layout
     */
    <div
      ref={overlayRef}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center sm:p-8 "
      style={{
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        padding: 'clamp(1rem, 5vh, 5vh) clamp(1rem, 5vw, 5vw)',
      }}
    >
      {/* Modal card */}
      <div
        className="relative flex w-full flex-col overflow-hidden rounded-2xl bg-card shadow-2xl border border-border sm:flex-row sm:max-w-[680px] "
        style={{ maxHeight: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image — top on mobile (fixed height), left panel on desktop (full height) */}
        <div className="relative bg-slate-200 shrink-0 bg-muted overflow-hidden">
          <div className="h-72 sm:h-full sm:w-[260px]">
            {coverImage ? (
              <img
                src={coverImage}
                alt={`Cover ${booth.name}`}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm px-4 text-center">
                Tidak ada gambar
              </div>
            )}
          </div>
        </div>

        {/* Info panel */}
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 sm:p-5 min-w-0">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Badges */}
          <div className="flex flex-col gap-2 pr-8">
            {/* Baris 1: Circle code */}
            {booth.circle_code && (
              <div>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xl font-semibold uppercase tracking-wide text-primary">
                  {booth.circle_code}
                </span>
              </div>
            )}

            {/* Baris 2: Day & Circle type */}
            <div className="flex gap-1.5 flex-wrap">
              {booth.day && (
                <span className="rounded-full bg-blue-200 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {booth.day}
                </span>
              )}
            </div>
          </div>

          {/* Name */}
          <h2 className="text-lg sm:text-xl font-bold text-foreground leading-tight pr-6">
            {booth.name}
          </h2>

          {/* Spacer — push socials & buttons to bottom on desktop */}
          <div className="flex-1" />

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

          {/* Action buttons */}
          <div className="flex flex-col lg:flex-row gap-2 pb-1">
            {onLocate && (
              <Button
                size="sm"
                variant="default"
                className="gap-1.5 text-xs"
                onClick={() => {
                  onLocate(booth);
                  onClose();
                }}
              >
                <MapPin className="h-3.5 w-3.5" />
                Show on Map
              </Button>
            )}

            <Button
              size="sm"
              variant={isBookmarked ? 'default' : 'outline'}
              className={`gap-1.5 text-xs ${isBookmarked ? 'bg-violet-600 hover:bg-violet-700 border-violet-600' : ''}`}
              onClick={() => onToggleBookmark?.(booth)}
            >
              {isBookmarked ? (
                <>
                  <BookmarkCheck className="h-3.5 w-3.5" /> Bookmarked
                </>
              ) : (
                <>
                  <Bookmark className="h-3.5 w-3.5" /> Bookmark
                </>
              )}
            </Button>

            <Button size="sm" variant="outline" className="text-xs" asChild>
              <a
                href={booth.id ? `https://catalog.comifuro.net/circle/${booth.id}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
              >
                Catalog Detail
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
