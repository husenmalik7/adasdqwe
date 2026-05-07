// SidePanel.tsx
import { useState, useMemo } from 'react';
import { Search, X, MapPin, Store, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BOOTHS } from '@/data/booths';

type Booth = (typeof BOOTHS)[number];

const DAYS = ['Semua', 'Hari 1', 'Hari 2'];

// day: 'Both Days',
// day: 'SAT',
// day: 'SUN',

interface SidePanelProps {
  selectedBoothName: string | null;
  onLocate: (booth: Booth) => void;
  onClear: () => void;
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export const SidePanel = ({ selectedBoothName, onLocate, onClear }: SidePanelProps) => {
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState('');
  const [activeDay, setActiveDay] = useState('Semua');

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return BOOTHS.filter((b) => {
      const matchQ =
        !q || b.name.toLowerCase().includes(q) || b.circle_code?.toLowerCase().includes(q);
      const matchDay =
        activeDay === 'Semua' ||
        (activeDay === 'Hari 1' && b.day === '1') ||
        (activeDay === 'Hari 2' && b.day === '2');

      return matchQ && matchDay;
    });
  }, [query, activeDay]);

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
    if (window.innerWidth < 640) {
      // sm breakpoint
      setOpen(false);
    }
    onLocate(booth);
  };

  return (
    <>
      {/* Toggle button — selalu tampil di atas canvas */}

      <div className="absolute left-4 top-4 z-10">
        <Button
          size="sm"
          variant="secondary"
          style={{ background: '#FFB399' }}
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
          <Store className="h-4 w-4 text-muted-foreground" />
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
              placeholder="Search booth name..."
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

        {/* Filter chips */}
        <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-border flex-shrink-0">
          {DAYS.map((d) => (
            <button
              key={d}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setActiveDay(d)}
              className={[
                'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                activeDay === d
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-foreground/30',
              ].join(' ')}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground text-xs">
              <Store className="h-8 w-8 opacity-30" />
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
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-medium text-muted-foreground">
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
                          Hari {booth.day}
                        </span>
                        <span className="rounded-full border border-border bg-muted/60 px-1.5 py-px text-[10px] text-muted-foreground">
                          {booth.circle_type}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {booth.circle_code}
                        </span>
                      </div>
                    </div>
                    {/* Locate button */}
                    <button
                      className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLocate(booth);
                      }}
                      aria-label={`Find ${booth.name} on map`}
                    >
                      <MapPin className="h-3.5 w-3.5" />
                    </button>
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
