import { useEffect } from 'react';
import { PhaserGame } from '@/game/PhaserGame';
import { useCurrentScene } from '@/game/useCurrentScene';
import { useGameStore } from '@/store/gameStore';
import { TopBar } from './TopBar';
import { HouseControls } from '@/features/furniture/HouseControls';
import { WardrobeTab } from '@/features/wardrobe/WardrobeTab';
import { DressingBoothPanel } from '@/features/wardrobe/DressingBoothPanel';
import { ShopControls } from '@/features/wardrobe/ShopControls';

export function GameShell() {
  const scene = useCurrentScene();
  const status = useGameStore((s) => s.status);
  const offline = useGameStore((s) => s.offline);
  const init = useGameStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-dc-fog">
      <PhaserGame />

      {status === 'loading' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-dc-fog">
          <p className="animate-pulse font-display text-3xl font-bold text-dc-ink">
            Loading Doll City...
          </p>
        </div>
      )}

      {status === 'ready' && (
        <>
          <TopBar scene={scene} offline={offline} />

          {scene === 'House' && <HouseControls />}

          {scene === 'ClothingShop' && (
            <div className="safe-area-padding pointer-events-none absolute inset-0 z-20 flex flex-col items-end justify-between p-6 pt-24">
              <WardrobeTab />
              <div className="flex w-full items-center justify-between">
                <ShopControls />
                <div className="flex-1" />
                <DressingBoothPanel />
                <div className="flex-1" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
