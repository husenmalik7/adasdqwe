import { useState, useMemo } from 'react';
import { Search, X, PanelLeftClose, PanelLeftOpen, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BOOTHS } from '@/data/booths';
import boothIcon from '@/assets/booth.png';

type Booth = (typeof BOOTHS)[number];

interface SidePanelProps {
  selectedBoothName: string | null;
  onLocate: (booth: Booth) => void;
  onClear: () => void;
  onDayChange: (day: 'SAT' | 'SUN' | 'Both Days') => void; // ← tambah ini
  bookmarkedIds: Set<number>;
  onToggleBookmark: (booth: Booth) => void;
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export const SidePanel = ({
  selectedBoothName,
  onLocate,
  onClear,
  onDayChange,
  bookmarkedIds,
  onToggleBookmark,
}: SidePanelProps) => {
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState('');

  const bookmarkedBooths = useMemo(() => {
    return BOOTHS.filter((b) => bookmarkedIds.has(b.id)).filter((b) => {
      const q = query.toLowerCase();
      return !q || b.name.toLowerCase().includes(q) || b.circle_code?.toLowerCase().includes(q);
    });
  }, [bookmarkedIds, query]);

  // debug
  const latestBooths = useMemo(() => {
    return [...BOOTHS].sort((a, b) => b.id - a.id).slice(0, 3);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return BOOTHS.filter((b) => {
      const matchQuery =
        !q || b.name.toLowerCase().includes(q) || b.circle_code?.toLowerCase().includes(q);
      return matchQuery;
    });
  }, [query]);

  const highlight = (text: string) => {
    if (!query) return <>{text}</>;
    const i = text.toLowerCase().indexOf(query.toLowerCase());
    if (i < 0) return <>{text}</>;
    return (
      <>
        {text.slice(0, i)}
        <mark className="bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded-[2px]">
          {text.slice(i, i + query.length)}
        </mark>
        {text.slice(i + query.length)}
      </>
    );
  };

  const handleLocate = (booth: Booth) => {
    const boothDay = booth.day as 'SAT' | 'SUN' | 'Both Days';
    onDayChange(boothDay); // ← tambah ini
    if (window.innerWidth < 640) {
      // sm breakpoint
      setOpen(false);
    }
    onLocate(booth);
  };

  const BoothCard = ({
    booth,
    variant = 'default',
  }: {
    booth: Booth;
    variant?: 'default' | 'bookmark';
  }) => {
    const isActive = selectedBoothName === booth.name;
    const isBookmarked = bookmarkedIds.has(booth.id);

    return (
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className={[
          'flex items-start gap-2 rounded-md border p-2 mb-1.5 cursor-pointer transition-colors',
          variant === 'bookmark'
            ? isActive
              ? 'border-violet-400 bg-violet-100 dark:bg-violet-950'
              : 'border-violet-200 bg-violet-50/60 hover:bg-violet-50 dark:border-violet-800 dark:bg-violet-950/40 dark:hover:bg-violet-950'
            : isActive
              ? 'border-primary/50 bg-primary/5'
              : 'border-border hover:border-border/80 hover:bg-muted/40',
        ].join(' ')}
      >
        {/* Avatar */}
        <div
          className={[
            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-[11px] font-medium',
            variant === 'bookmark'
              ? 'bg-violet-200 text-violet-800 dark:bg-violet-800 dark:text-violet-200'
              : 'bg-muted text-muted-foreground bg-gray-300',
          ].join(' ')}
          onClick={() => (isActive ? onClear() : handleLocate(booth))}
        >
          {initials(booth.name)}
        </div>

        {/* Info */}
        <div
          className="min-w-0 flex-1"
          onClick={() => (isActive ? onClear() : handleLocate(booth))}
        >
          <p className={['text-xs font-medium truncate', isActive ? 'text-primary' : ''].join(' ')}>
            {highlight(booth.name)}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1">
            <span
              className={[
                'rounded-full px-1.5 py-px text-[10px]',
                variant === 'bookmark'
                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300'
                  : booth.day === 'SAT'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
              ].join(' ')}
            >
              {booth.day}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">{booth.circle_code}</span>
          </div>
        </div>

        {/* Bookmark toggle button */}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark(booth);
          }}
          className={[
            'flex-shrink-0 rounded-md p-1 transition-colors',
            isBookmarked
              ? 'text-violet-600 hover:text-violet-800 dark:text-violet-400'
              : 'text-muted-foreground hover:text-violet-500',
          ].join(' ')}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
        >
          <Bookmark className={['h-3.5 w-3.5', isBookmarked ? 'fill-current' : ''].join(' ')} />
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Toggle button — selalu tampil di atas canvas */}

      <div className="absolute left-4 top-4 z-10">
        <Button
          size="sm"
          variant="secondary"
          style={{ background: '#FFD6A6' }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Sembunyikan panel' : 'Tampilkan panel'}
        >
          {open ? (
            <PanelLeftClose className="h-4 w-4 mr-1.5" />
          ) : (
            <PanelLeftOpen className="h-4 w-4 mr-1.5" />
          )}
          {open ? 'Hide Panel' : 'Search Booth'}
        </Button>
      </div>

      {/* Side Panel */}
      <div
        className={[
          // Desktop: panel di sebelah kanan, geser keluar kalau hidden
          'absolute inset-y-0 left-0 z-20 flex flex-col',
          'bg-background border-r border-border',
          'transition-transform duration-300',
          // Mobile: full width
          'w-full sm:w-72',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border flex-shrink-0">
          {/* <Store className="h-4 w-4 text-muted-foreground" /> */}
          <img src={boothIcon} alt="Booth" className="h-4 w-4" />

          <span className="text-sm font-medium flex-1">Search Booth</span>
          <button
            className="rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setOpen(false)}
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-border flex-shrink-0">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search booth name or code..."
              className="w-full rounded-md border border-input bg-muted/40 py-1.5 pl-8 pr-7 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
            />
            {query && (
              <button
                className="absolute right-2 text-muted-foreground hover:text-foreground"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                onPointerDown={(e) => e.stopPropagation()} // ← tambahkan ini
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* DEBUG: Latest 3 booths by ID */}
          {!query && (
            <div className="mb-3">
              <p className="px-1 pb-1.5 text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                🆕 Latest (debug)
              </p>
              {latestBooths.map((booth) => {
                const isActive = selectedBoothName === booth.name;
                return (
                  <div
                    key={booth.id}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => (isActive ? onClear() : handleLocate(booth))}
                    className={[
                      'flex items-start gap-2 rounded-md border p-2 mb-1.5 cursor-pointer transition-colors border-dashed',
                      isActive
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-amber-400/60 bg-amber-50/40 hover:bg-amber-50',
                    ].join(' ')}
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-amber-200 text-[11px] font-bold text-amber-800">
                      #{booth.id}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{booth.name}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1">
                        <span className="rounded-full px-1.5 py-px text-[10px] bg-amber-100 text-amber-800">
                          {booth.day}
                        </span>
                        <span className="text-sm text-muted-foreground font-mono">
                          {booth.circle_code}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <hr className="my-2 border-border" />
            </div>
          )}
        </div>
        {/* existing filtered list... */}

        {/* Results  */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* ── Bookmark section ── */}
          {bookmarkedBooths.length > 0 && (
            <div className="mb-3">
              <p className="px-1 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-violet-600 dark:text-violet-400 flex items-center gap-1">
                <Bookmark className="h-3 w-3 fill-current" />
                Bookmarks ({bookmarkedBooths.length})
              </p>
              {bookmarkedBooths.map((booth) => (
                <BoothCard key={booth.id} booth={booth} variant="bookmark" />
              ))}
              <hr className="my-2 border-border" />
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground text-xs">
              {/* <Store className="h-8 w-8 opacity-30" /> */}
              <img src={boothIcon} alt="Booth" className="h-8 w-8" />
              Booth not found
            </div>
          ) : (
            <>
              <p className="px-1 pb-2 text-[11px] text-muted-foreground">
                {filtered.length} booth found
              </p>
              {filtered.map((booth) => {
                const isActive = selectedBoothName === booth.name;
                return (
                  <div
                    key={booth.id}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => (isActive ? onClear() : handleLocate(booth))}
                    className={[
                      'flex items-start gap-2 rounded-md border p-2 mb-1.5 cursor-pointer transition-colors',
                      isActive
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-border hover:border-border/80 hover:bg-muted/40',
                    ].join(' ')}
                  >
                    {/* Avatar */}
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-medium text-muted-foreground bg-gray-300">
                      {initials(booth.name)}
                    </div>
                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={[
                          'text-xs font-medium truncate',
                          isActive ? 'text-primary' : '',
                        ].join(' ')}
                      >
                        {highlight(booth.name)}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1">
                        <span
                          className={[
                            'rounded-full px-1.5 py-px text-[10px]',
                            booth.day === '1'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                          ].join(' ')}
                        >
                          {booth.day}
                        </span>
                        <span className="text-sm text-muted-foreground font-mono">
                          {booth.circle_code}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </>
  );
};
