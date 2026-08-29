/**
 * PURPOSE: Caps how much of an over-long value a surface draws before it offers the rest, and the
 * limits are not interchangeable because the surfaces are measuring different things. `charLimit`
 * and `lineLimit` cap a chat message, whose prose wraps freely. `longFieldLimit` caps a tool
 * argument drawn INLINE beside its key, where staying on one line IS the affordance. The
 * `blockField` pair caps an argument drawn as a DOCUMENT — a Write's file body, a heredoc — and
 * leads with the LINE count because that preview goes on to be parsed as markdown: cutting a
 * document by character count strands it mid-heading, and half a mark renders as the wrong mark.
 * The character ceiling is only the backstop for the file that offers no line break to cut on.
 *
 * USAGE:
 * contentTruncationConfigStatics.blockFieldLineLimit;
 * // Returns 12
 */

export const contentTruncationConfigStatics = {
  charLimit: 200,
  lineLimit: 8,
  longFieldLimit: 120,
  blockFieldLineLimit: 12,
  blockFieldCharLimit: 1200,
  msDivisor: 1000,
} as const;
