import { ORDER_INDEX_GAP } from '@/lib/constants';

/**
 * Computes a fractional order index that sits between two neighbors.
 * Falls back to the gap constant when there is no neighbor on that side.
 */
export function computeOrderIndexBetween(
  before: number | null,
  after: number | null,
): number {
  if (before === null && after === null) {
    return ORDER_INDEX_GAP;
  }

  if (before === null) {
    return (after as number) / 2;
  }

  if (after === null) {
    return before + ORDER_INDEX_GAP;
  }

  return (before + after) / 2;
}

export function reorderIds<T extends { id: string }>(
  items: T[],
  activeId: string,
  overId: string,
): string[] {
  const ids = items.map((item) => item.id);
  const activeIndex = ids.indexOf(activeId);
  const overIndex = ids.indexOf(overId);

  if (activeIndex === -1 || overIndex === -1) {
    return ids;
  }

  const next = [...ids];
  next.splice(activeIndex, 1);
  next.splice(overIndex, 0, activeId);

  return next;
}
