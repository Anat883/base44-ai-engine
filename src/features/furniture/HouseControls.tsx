import { useState } from 'react';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { useGameStore } from '@/store/gameStore';
import { playSound } from '@/lib/sound';

/**
 * "Tidy Up" is instant and non-destructive (pets nudged back). "Reset Room"
 * discards the player's custom furniture layout, so it always asks first -
 * per the product rule against accidental destructive actions.
 */
export function HouseControls() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const tidyHouse = useGameStore((s) => s.tidyHouse);
  const resetHouse = useGameStore((s) => s.resetHouse);

  return (
    <div className="safe-area-padding pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center gap-4 p-6">
      <div className="pointer-events-auto flex gap-4">
        <Button variant="secondary" icon="🧹" onClick={() => tidyHouse()}>
          Tidy Up
        </Button>
        <Button variant="secondary" icon="↩️" onClick={() => setConfirmOpen(true)}>
          Reset Room
        </Button>
      </div>

      <Modal open={confirmOpen} title="Reset this room?" onClose={() => setConfirmOpen(false)}>
        <p className="mb-5 text-dc-stone">
          Furniture will go back to how the room started. Your own arrangement will be lost.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              resetHouse();
              playSound('roomReset');
              setConfirmOpen(false);
            }}
          >
            Yes, reset
          </Button>
        </div>
      </Modal>
    </div>
  );
}
