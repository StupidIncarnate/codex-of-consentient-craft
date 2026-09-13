/**
 * PURPOSE: Caps how much of one test failure's message the summary prints inline on a run the caller
 * scoped to files. Enough lines for a jest `Expected`/`Received` diff to arrive whole, and a ceiling
 * so a suite of long failures cannot push the summary past the tool-result limit that spills it to a
 * file.
 *
 * USAGE:
 * inlineFailureStatics.message.maxLines;
 * // Returns: 40
 *
 * WHY 40: a `toStrictEqual` over an eight-key object renders in roughly twenty lines — the shape
 * that sent a measured run to `ward detail` for a 47.2KB blob it then had to read back out of a
 * file. Double that leaves room for a nested diff while still bounding a handful of failures to a
 * few hundred lines.
 */
export const inlineFailureStatics = {
  message: {
    maxLines: 40,
  },
} as const;
