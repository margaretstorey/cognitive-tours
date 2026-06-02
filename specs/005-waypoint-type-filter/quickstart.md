# Quickstart: Waypoint Type Filter

**Feature**: 005-waypoint-type-filter | **Date**: 2026-06-01

## Running the dev server

```bash
npm run dev
# App runs at http://localhost:3000
```

## Implementing the feature (step order)

Implement in this order — each step leaves the app runnable:

### Step 1 — Update `app/lib/types.ts`

Add `FilterState` type alias and export `WAYPOINT_TYPES` constant:

```typescript
// After the WaypointType union definition:
export const WAYPOINT_TYPES: WaypointType[] = [
  'Goal',
  'User Need',
  'Feature',
  'ADR',
  'Code Component',
  'Test',
  'Risk',
  'AI Instruction',
  'Open Question',
];

export type FilterState = Record<WaypointType, boolean>;
```

### Step 2 — Update `app/components/WaypointForm.tsx`

Remove the local `WAYPOINT_TYPES` array and import the exported one from `types.ts`:

```typescript
import type { Waypoint, WaypointType } from '@/app/lib/types';
import { WAYPOINT_TYPES } from '@/app/lib/types';
// Remove: const WAYPOINT_TYPES: WaypointType[] = [...]
```

### Step 3 — Update `app/components/ShrimpApp.tsx`

Add `filterState` state and `onFilterChange` handler, pass both to `WaypointGraph`:

```typescript
import type { FilterState } from '@/app/lib/types';
import { WAYPOINT_TYPES } from '@/app/lib/types';

// Initial value (all types visible):
const DEFAULT_FILTER_STATE: FilterState = Object.fromEntries(
  WAYPOINT_TYPES.map(t => [t, true])
) as FilterState;

// In ShrimpApp():
const [filterState, setFilterState] = useState<FilterState>(DEFAULT_FILTER_STATE);

const onFilterChange = useCallback((type: WaypointType, visible: boolean) => {
  setFilterState(prev => ({ ...prev, [type]: visible }));
}, []);

// In JSX, pass to WaypointGraph:
<WaypointGraph
  {...existingProps}
  filterState={filterState}
  onFilterChange={onFilterChange}
/>
```

### Step 4 — Update `app/components/WaypointGraph.tsx`

1. Add `filterState` and `onFilterChange` to `WaypointGraphProps`
2. Add `filterPanelOpen` local state in `Graph`
3. Compute `hiddenNodeIds` and apply to nodes/rfEdges memos
4. Add Filter button and panel to the toolbar

Key filtering logic in memos:

```typescript
const hiddenNodeIds = useMemo(
  () => new Set(waypoints.filter(w => !filterState[w.type]).map(w => w.id)),
  [waypoints, filterState]
);

// In nodes memo: filter before mapping
const nodes: Node[] = useMemo(
  () => waypoints
    .filter(w => filterState[w.type])
    .map(w => ({ ... })),
  [waypoints, selectedWaypointId, activeTourWaypointIds, filterState]
);

// In rfEdges memo: filter edges touching hidden nodes
const rfEdges: Edge[] = useMemo(
  () => edges
    .filter(e => !hiddenNodeIds.has(e.source) && !hiddenNodeIds.has(e.target))
    .map(e => ({ ... })),
  [edges, activeTourWaypointIds, selectedEdgeId, hiddenNodeIds]
);
```

Filter panel in JSX (inside `<ReactFlow>`):

```typescript
<div className="absolute top-3 left-3 z-10 flex gap-2">
  <button onClick={onAddWaypointClick} ...>+ Add Waypoint</button>
  <div className="relative">
    <button onClick={() => setFilterPanelOpen(o => !o)} ...>
      Filter {someTypesHidden ? '●' : ''}
    </button>
    {filterPanelOpen && (
      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex flex-col gap-1 min-w-[180px]">
        {WAYPOINT_TYPES.map(type => (
          <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={filterState[type]}
              onChange={e => onFilterChange(type, e.target.checked)}
            />
            <span className={`w-2 h-2 rounded-full border ${WAYPOINT_COLORS[type]}`} />
            {type}
          </label>
        ))}
      </div>
    )}
  </div>
</div>
```

## Manual verification checklist

After implementing, verify in the browser:

- [ ] Filter button appears next to "+ Add Waypoint" in the top-left of the graph
- [ ] Clicking Filter opens a panel with 9 toggles (one per type), each showing the type's colour
- [ ] All toggles are checked by default
- [ ] Unchecking "ADR" hides all ADR nodes and their edges immediately
- [ ] Re-checking "ADR" restores all ADR nodes in their original positions
- [ ] Edges whose source or target is hidden are also hidden (no dangling edges)
- [ ] Clicking the graph pane closes the filter panel
- [ ] Clicking Filter button again closes the panel
- [ ] Filtering while a tour is active: tour detail still shows, graph dims correctly
- [ ] Page refresh resets all filters to visible
- [ ] "+ Add Waypoint" button still works correctly alongside the Filter button
