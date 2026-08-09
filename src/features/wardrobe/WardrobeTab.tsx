import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { ACCESSORIES, HAIR, OUTFITS, charactersById } from '@/data';
import { canSelectOutfit } from '@/game/interactions/dressingBoothMachine';
import type { AccessoryEntity, HairEntity, OutfitEntity } from '@/types/entities';

type Category = 'outfits' | 'hair' | 'accessories';

const CATEGORY_LABEL: Record<Category, string> = {
  outfits: '👗 Outfits',
  hair: '💇 Hair',
  accessories: '✨ Accessories',
};

function Swatch({
  color,
  emoji,
  selected,
  onClick,
  label,
}: {
  color: string;
  emoji: string;
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={selected}
      className={`touch-target flex h-16 w-16 flex-col items-center justify-center rounded-xl2 text-2xl shadow-soft transition active:scale-95 ${
        selected ? 'ring-4 ring-dc-rainbowBlue' : ''
      }`}
      style={{ backgroundColor: color }}
    >
      {emoji}
    </button>
  );
}

/**
 * Permanent wardrobe grid. Operates on whichever character currently stands
 * in the dressing booth - outfits go through the curtain state machine,
 * hair/accessories apply immediately (no curtain needed for those).
 */
export function WardrobeTab() {
  const [category, setCategory] = useState<Category>('outfits');
  const state = useGameStore((s) => s.state);
  const dispatchBoothEvent = useGameStore((s) => s.dispatchBoothEvent);
  const setCharacterHair = useGameStore((s) => s.setCharacterHair);
  const attachAccessory = useGameStore((s) => s.attachAccessoryToCharacter);
  const detachAccessory = useGameStore((s) => s.detachAccessoryFromCharacter);

  const characterId = state.shop.dressingBoothCharacterId;
  const character = characterId ? state.characters[characterId] : null;
  const characterEntity = characterId ? charactersById.get(characterId) : null;

  return (
    <div className="pointer-events-auto w-80 rounded-xl2 bg-white/95 p-4 shadow-soft">
      <div className="mb-3 flex gap-2">
        {(Object.keys(CATEGORY_LABEL) as Category[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setCategory(key)}
            className={`flex-1 touch-target rounded-xl2 px-2 py-2 text-sm font-bold ${
              category === key ? 'bg-dc-rainbowPurple text-white' : 'bg-dc-fog text-dc-ink'
            }`}
          >
            {CATEGORY_LABEL[key]}
          </button>
        ))}
      </div>

      {!character && (
        <p className="p-4 text-center text-dc-stone">
          Drag a character into the dressing booth first!
        </p>
      )}

      {character && category === 'outfits' && (
        <OutfitGrid
          items={OUTFITS.filter(
            (o) => !characterEntity || o.fitsArchetypes.includes(characterEntity.archetype),
          )}
          currentOutfitId={
            state.shop.dressingBoothSelectedOutfitId ?? character.outfitState.outfitId
          }
          canSelect={canSelectOutfit(state.shop.dressingBoothState)}
          onSelect={(id) => dispatchBoothEvent({ type: 'SELECT_OUTFIT', outfitId: id })}
        />
      )}

      {character && category === 'hair' && (
        <HairGrid
          items={HAIR}
          currentHairId={character.outfitState.hairId}
          onSelect={(id) => characterId && setCharacterHair(characterId, id)}
        />
      )}

      {character && category === 'accessories' && (
        <AccessoryGrid
          items={ACCESSORIES}
          outfitState={character.outfitState}
          onToggle={(accessory, active) => {
            if (!characterId) return;
            if (active) detachAccessory(characterId, accessory.slot);
            else attachAccessory(characterId, accessory.id);
          }}
        />
      )}
    </div>
  );
}

function OutfitGrid({
  items,
  currentOutfitId,
  canSelect,
  onSelect,
}: {
  items: OutfitEntity[];
  currentOutfitId: string;
  canSelect: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((outfit) => (
        <Swatch
          key={outfit.id}
          color={outfit.primaryColor}
          emoji="👗"
          label={outfit.name}
          selected={outfit.id === currentOutfitId}
          onClick={() => canSelect && onSelect(outfit.id)}
        />
      ))}
    </div>
  );
}

function HairGrid({
  items,
  currentHairId,
  onSelect,
}: {
  items: HairEntity[];
  currentHairId: string;
  onSelect: (id: string) => void;
}) {
  const colorMap: Record<HairEntity['color'], string> = {
    rainbow: '#B98CFF',
    pink: '#FF8FD1',
    purple: '#B98CFF',
    blue: '#4DB8FF',
    brown: '#8A5A3B',
    blonde: '#F2D06B',
    black: '#3A2E4D',
    gray: '#D9D9E0',
  };
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((hair) => (
        <Swatch
          key={hair.id}
          color={colorMap[hair.color]}
          emoji={hair.length === 'long' ? '💁' : '💇'}
          label={hair.name}
          selected={hair.id === currentHairId}
          onClick={() => onSelect(hair.id)}
        />
      ))}
    </div>
  );
}

function AccessoryGrid({
  items,
  outfitState,
  onToggle,
}: {
  items: AccessoryEntity[];
  outfitState: {
    glassesId: string | null;
    earringsId: string | null;
    hairAccessoryId: string | null;
    faceAccessoryId: string | null;
  };
  onToggle: (accessory: AccessoryEntity, currentlyActive: boolean) => void;
}) {
  const activeIds = new Set(
    [
      outfitState.glassesId,
      outfitState.earringsId,
      outfitState.hairAccessoryId,
      outfitState.faceAccessoryId,
    ].filter(Boolean),
  );
  const emojiFor: Record<AccessoryEntity['slot'], string> = {
    glasses: '👓',
    earrings: '💎',
    hairAccessory: '🎀',
    faceAccessory: '🦋',
    bag: '👜',
  };
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((accessory) => (
        <Swatch
          key={accessory.id}
          color={accessory.primaryColor}
          emoji={emojiFor[accessory.slot]}
          label={accessory.name}
          selected={activeIds.has(accessory.id)}
          onClick={() => onToggle(accessory, activeIds.has(accessory.id))}
        />
      ))}
    </div>
  );
}
