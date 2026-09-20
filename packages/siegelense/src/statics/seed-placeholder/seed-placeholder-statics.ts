/**
 * PURPOSE: The syntax a later step reads a `seed` step's ids back by — `{binding.field}`, the form
 * every worked batch in the spec writes (`{g.guildSlug}`, `{s.sessions.nested}`,
 * siegelense-tooling.md lines 2917-2922). Reach for this over retyping the pattern: the
 * transformer that substitutes and the docs that describe the syntax read one source, so the
 * thing a session is told to type is the thing that resolves.
 *
 * DELIBERATELY NARROW — an identifier, a dot, a dotted path, no whitespace anywhere. An `eval`
 * step's source is JavaScript, and `() => { return 1 }` must not read as a placeholder; a
 * `{s.sessions.nested}` in that same source must.
 *
 * USAGE:
 * seedPlaceholderStatics.pattern.source;
 * // Returns the regex source the interpolator compiles with the `g` flag
 */

export const seedPlaceholderStatics = {
  pattern: {
    source:
      '\\{([A-Za-z_][A-Za-z0-9_]*)\\.([A-Za-z_][A-Za-z0-9_]*(?:\\.[A-Za-z_][A-Za-z0-9_]*)*)\\}',
  },
} as const;
