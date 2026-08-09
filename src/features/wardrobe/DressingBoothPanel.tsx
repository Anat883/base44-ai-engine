import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/Button';
import { canCloseCurtain, isAnimating } from '@/game/interactions/dressingBoothMachine';

const STATUS_TEXT: Record<string, string> = {
  EMPTY: 'Drag a character into the booth to get started!',
  CHARACTER_INSIDE: 'Pick an outfit from the wardrobe!',
  OUTFIT_SELECTED: 'Ready! Close the curtain to change.',
  CURTAIN_CLOSING: 'Closing the curtain...',
  CHANGING: 'Changing outfit... ✨',
  CURTAIN_OPENING: 'Opening the curtain...',
  COMPLETE: 'All done! Try another outfit or step out.',
};

export function DressingBoothPanel() {
  const shop = useGameStore((s) => s.state.shop);
  const dispatchBoothEvent = useGameStore((s) => s.dispatchBoothEvent);

  if (shop.dressingBoothState === 'EMPTY') return null;

  return (
    <div className="pointer-events-auto flex flex-col items-center gap-3 rounded-xl2 bg-white/95 p-4 shadow-soft">
      <p className="text-center font-bold text-dc-ink">{STATUS_TEXT[shop.dressingBoothState]}</p>
      <div className="flex gap-3">
        {canCloseCurtain(shop.dressingBoothState) && (
          <Button
            variant="primary"
            icon="🎪"
            onClick={() => dispatchBoothEvent({ type: 'CLOSE_CURTAIN' })}
          >
            Close Curtain
          </Button>
        )}
        {!isAnimating(shop.dressingBoothState) && (
          <Button
            variant="secondary"
            icon="🚪"
            onClick={() => dispatchBoothEvent({ type: 'EXIT' })}
          >
            Exit Booth
          </Button>
        )}
      </div>
    </div>
  );
}
