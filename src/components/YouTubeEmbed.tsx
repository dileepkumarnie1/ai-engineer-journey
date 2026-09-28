import { Play } from 'lucide-react';
import { useState } from 'react';
import { ytEmbed, ytThumb } from '@/lib/formats';

/** Loads the YouTube iframe only after a click (privacy-enhanced domain, faster pages). */
export function YouTubeEmbed({ id, title }: { id: string; title: string }) {
  const [active, setActive] = useState(false);
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
      {active ? (
        <iframe
          className="absolute inset-0 size-full"
          src={ytEmbed(id)}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          className="group absolute inset-0 size-full"
          aria-label={`Play video: ${title}`}
        >
          <img src={ytThumb(id)} alt="" loading="lazy" className="size-full object-cover opacity-90 transition group-hover:scale-105 group-hover:opacity-100" />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-16 place-items-center rounded-full bg-red-600 text-white shadow-xl transition group-hover:scale-110">
              <Play className="size-7 translate-x-0.5 fill-white" />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
