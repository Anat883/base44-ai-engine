import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ALL_CONTENT } from '@/data';
import type { EntityType } from '@/types/entities';

/**
 * Dev-only proof that game content is data-driven: every seeded record from
 * src/data, browsable and filterable. Not a real CMS yet - see
 * docs/CONTENT-GUIDE.md for how a future creator dashboard would build on
 * this same `AnyContentEntity` model.
 */
export function ContentCatalogPage() {
  const [filter, setFilter] = useState<EntityType | 'all'>('all');
  const [search, setSearch] = useState('');

  const types = useMemo(() => Array.from(new Set(ALL_CONTENT.map((c) => c.type))).sort(), []);

  const rows = ALL_CONTENT.filter((item) => {
    if (filter !== 'all' && item.type !== filter) return false;
    if (
      search &&
      !`${item.id} ${item.name} ${item.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  if (!import.meta.env.DEV) {
    return (
      <div className="p-8">
        <p>This page is only available in development mode.</p>
        <Link to="/" className="text-dc-rainbowBlue underline">
          Back to Doll City
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dc-fog p-8 font-body">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-dc-ink">
          Doll City Content Catalog (dev)
        </h1>
        <Link to="/" className="rounded-xl2 bg-dc-rainbowPurple px-4 py-2 font-bold text-white">
          ← Back to game
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search id / name / tag..."
          className="rounded-xl2 border border-dc-fog px-4 py-2"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as EntityType | 'all')}
          className="rounded-xl2 border border-dc-fog px-4 py-2"
        >
          <option value="all">All types ({ALL_CONTENT.length})</option>
          {types.map((type) => (
            <option key={type} value={type}>
              {type} ({ALL_CONTENT.filter((c) => c.type === type).length})
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl2 bg-white shadow-soft">
        <table className="w-full text-left text-sm">
          <thead className="bg-dc-fog text-dc-ink">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Type</th>
              <th className="p-3">Category</th>
              <th className="p-3">Asset Key</th>
              <th className="p-3">Tags</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-dc-fog">
                <td className="p-3 font-mono text-xs">{item.id}</td>
                <td className="p-3">{item.name}</td>
                <td className="p-3">{item.type}</td>
                <td className="p-3">{item.category}</td>
                <td className="p-3 font-mono text-xs">{item.assetKey}</td>
                <td className="p-3">{item.tags.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
