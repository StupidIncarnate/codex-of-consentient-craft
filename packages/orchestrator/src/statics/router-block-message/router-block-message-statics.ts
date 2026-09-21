/**
 * PURPOSE: How much of the router's evidence a block message is allowed to carry. Reach for this
 * rather than slicing a list inline: a block message is read by a human in an execution row, and the
 * one thing that makes it useless is a wall of ids.
 *
 * USAGE:
 * routerBlockMessageStatics.limits.maxUnitIds;
 * // Returns 15 — the ceiling on the `Still unmet:` list in a max-visits block
 *
 * A CEILING RATHER THAN A PAGE. Nothing pages a block message: the whole unit list is on the quest
 * and readable through the work tool, so the message's job is to name enough of it to recognise the
 * loop, never to reproduce it.
 */

export const routerBlockMessageStatics = {
  limits: {
    maxUnitIds: 15,
  },
} as const;
