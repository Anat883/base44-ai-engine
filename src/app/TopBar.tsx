import { useState } from 'react';
import { IconButton } from '@/components/IconButton';
import { gameController } from '@/game/gameController';
import { isMuted, setMuted } from '@/lib/sound';
import type { SceneKey } from '@/game/useCurrentScene';

const SCENE_TITLES: Record<SceneKey, string> = {
  CityMap: 'Doll City',
  House: 'My House',
  ClothingShop: 'Rainbow Threads',
  GiftArea: 'Gift Garden',
};

export function TopBar({ scene, offline }: { scene: SceneKey; offline: boolean }) {
  const [muted, setMutedState] = useState(isMuted());

  return (
    <div className="safe-area-padding pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4">
      <div className="pointer-events-auto flex items-center gap-3">
        {scene !== 'CityMap' && (
          <IconButton label="Back to map" onClick={() => gameController.goToScene('CityMap')}>
            🏡
          </IconButton>
        )}
        <span className="rounded-full bg-white/90 px-4 py-2 font-display text-lg font-bold text-dc-ink shadow-soft">
          {SCENE_TITLES[scene]}
        </span>
        {offline && (
          <span className="rounded-full bg-dc-fog px-3 py-1 text-sm font-semibold text-dc-stone shadow-soft">
            Playing offline
          </span>
        )}
      </div>
      <div className="pointer-events-auto">
        <IconButton
          label={muted ? 'Unmute sound' : 'Mute sound'}
          onClick={() => {
            const next = !muted;
            setMuted(next);
            setMutedState(next);
          }}
        >
          {muted ? '🔇' : '🔊'}
        </IconButton>
      </div>
    </div>
  );
}
