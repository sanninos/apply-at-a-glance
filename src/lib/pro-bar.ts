/** Where the PRO bar sits in the home list: right after the third offer. */
export const PRO_BAR_AFTER = 3;

/**
 * Index of the card after which the PRO bar is rendered, or -1 when the list is
 * too short to host it in the middle (then it goes after the whole list).
 */
export function proBarSlotIndex(shownCount: number): number {
  return shownCount >= PRO_BAR_AFTER ? PRO_BAR_AFTER - 1 : -1;
}
