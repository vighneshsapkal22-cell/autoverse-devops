import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import type { CarImage } from '@/types';

interface ImageGalleryProps {
  images: CarImage[];
  carTitle: string;
}

export default function ImageGallery({ images, carTitle }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const sortedImages = [...images].sort((a, b) => {
    if (a.is_main !== b.is_main) return a.is_main ? -1 : 1;
    return a.sort_order - b.sort_order;
  });

  useEffect(() => {
    setActiveIndex(0);
  }, [images.length]);

  const next = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % sortedImages.length);
  }, [sortedImages.length]);

  const prev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length);
  }, [sortedImages.length]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, next, prev]);

  if (sortedImages.length === 0) {
    return (
      <div className="aspect-[4/3] bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
        <p className="text-sm">No images available</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 group">
          <img
            src={sortedImages[activeIndex]?.public_url}
            alt={`${carTitle} - ${sortedImages[activeIndex]?.label || 'view'}`}
            className="w-full h-full object-cover"
          />

          {sortedImages.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-700 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-700 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          <button
            onClick={() => setLightbox(true)}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-700 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          {sortedImages[activeIndex]?.label && (
            <span className="absolute bottom-3 left-3 px-3 py-1 rounded-md bg-slate-900/70 text-white text-xs font-medium backdrop-blur-sm">
              {sortedImages[activeIndex].label}
            </span>
          )}
        </div>

        {sortedImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {sortedImages.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveIndex(i)}
                className={`relative flex-shrink-0 w-20 h-16 sm:w-24 sm:h-18 rounded-lg overflow-hidden border-2 transition-all ${
                  i === activeIndex
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
                style={{ height: '4.5rem' }}
              >
                <img src={img.public_url} alt={img.label || 'thumbnail'} className="w-full h-full object-cover" />
                {img.is_main && (
                  <span className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-[8px] font-bold uppercase text-center py-0.5">
                    Main
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-[95] bg-slate-950/95 flex items-center justify-center" onClick={() => setLightbox(false)}>
          <button className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
          <img
            src={sortedImages[activeIndex]?.public_url}
            alt={`${carTitle} - ${sortedImages[activeIndex]?.label || 'fullscreen'}`}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {sortedImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 text-white text-sm">
            {activeIndex + 1} / {sortedImages.length}
          </div>
        </div>
      )}
    </>
  );
}
