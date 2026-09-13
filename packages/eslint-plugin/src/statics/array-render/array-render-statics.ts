/**
 * PURPOSE: Names the array methods that can put a rendered row on screen, for the
 * ban-anonymous-jsx-in-map rule. Reach for this over a literal in the rule broker: a consumer whose
 * codebase renders through another helper extends the list here rather than forking the rule.
 *
 * USAGE:
 * arrayRenderStatics.renderingMethods.names;
 * // Returns the method names whose callback is treated as a row renderer
 */
export const arrayRenderStatics = {
  // `filter`, `sort` and `slice` are deliberately absent. They choose WHICH rows render and never
  // produce markup themselves, so a callback of theirs holding a variable is ordinary data work.
  renderingMethods: {
    names: ['map', 'flatMap'],
  },
} as const;
