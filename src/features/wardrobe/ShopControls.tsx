import { Button } from '@/components/Button';
import { useGameStore } from '@/store/gameStore';
import { playSound } from '@/lib/sound';

/**
 * Shop "mess" is simpler than the house's: wandered-off characters and a
 * dressing booth stuck mid-flow. One tap, no confirmation needed - nothing
 * here is destructive to player-authored content.
 */
export function ShopControls() {
  const cleanUpShop = useGameStore((s) => s.cleanUpShop);

  return (
    <div className="pointer-events-auto">
      <Button
        variant="secondary"
        icon="🧹"
        onClick={() => {
          cleanUpShop();
          playSound('roomReset');
        }}
      >
        Clean Up
      </Button>
    </div>
  );
}
