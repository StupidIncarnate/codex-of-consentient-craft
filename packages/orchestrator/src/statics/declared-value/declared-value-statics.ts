/**
 * PURPOSE: What counts as a declared style value, written once and interpolated into the prompts that
 * author one, review one, or meet one on a walk. Reach for this when you want to move the line
 * between a declared value and a painted outcome; what each role DOES about it stays in its own
 * prompt.
 *
 * USAGE:
 * declaredValueStatics.markdown;
 * // The enumeration, the separating question and what an unflagged one costs, ready to interpolate
 *
 * ONE LIST, BECAUSE A NARROWER ONE IS INVISIBLE. The authoring role is the only one that can set
 * `verifyByReading: true`, and every other reader only meets the result — so a value this list omits
 * for the author is a value no reviewer's wider list can rescue, and the session that meets it has
 * nothing telling it what to do.
 *
 * BUDGET: every prompt that authors, reviews or meets an observable interpolates this whole block, so
 * a character here is that many characters served, and each of those prompts has to clear
 * `mcpToolResultStatics.maxVerbatimChars` on its own.
 */

export const declaredValueStatics = {
  markdown: `## What counts as a declared style value

A font size, a colour or a colour token, a class name, a typeface, a border, a padding or a margin, an
animation duration, or a "matching \`<some other component>\`" claim. The assertion for every one of
those reaches the value and reads back the literal the source declares: green the day it is written,
red on the next restyle, blind to every defect in between.

**A PAINTED OUTCOME is the opposite, and it stays a test.** A label clipped at 400px, two controls
overlapping, a control off-screen, text unreadable against its background — the source states none of
those, so a real browser is the only place they are true or false. **The question that separates the
two: could this break with no user-visible change?** Yes means it is a declared value.

**A declared value carries \`verifyByReading: true\`, and only the authoring role can set it.** Nothing
downstream can refuse an observable that arrives unflagged: no track holds a verdict meaning "this
should not have a test", so a session that meets one writes the change-detector instead.`,
} as const;
