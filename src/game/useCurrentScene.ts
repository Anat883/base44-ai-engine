import { useEffect, useState } from 'react';
import { EventBus } from './EventBus';

export type SceneKey = 'CityMap' | 'House' | 'ClothingShop' | 'GiftArea';

/** Tracks which Phaser scene is active so React overlays know what to render. */
export function useCurrentScene(): SceneKey {
  const [scene, setScene] = useState<SceneKey>('CityMap');

  useEffect(() => {
    const handler = (key: SceneKey) => setScene(key);
    EventBus.on('scene:changed', handler);
    return () => {
      EventBus.off('scene:changed', handler);
    };
  }, []);

  return scene;
}
