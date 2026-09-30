/**
 * PURPOSE: Builds the 8-character unicode block bar for a rate-limit window — '▰' for filled, '▱' for empty
 *
 * USAGE:
 * rateLimitBarTransformer({ usedPercentage: 42 });
 * // Returns: '▰▰▰▱▱▱▱▱'
 *
 * Logic mirrors statusline-command.sh:88-97 (`bar` bash function with width=8 and rounded fill).
 */


const BAR_WIDTH = 8;
const FILLED_CHAR = '▰';
const EMPTY_CHAR = '▱';
const PERCENT_MAX = 100;
const ROUND_OFFSET = 50;

export const rateLimitBarTransformer = ({
  usedPercentage,
}: {
  usedPercentage: number;
}): string => {
  const rawFilled = Math.floor((usedPercentage * BAR_WIDTH + ROUND_OFFSET) / PERCENT_MAX);
  const filled = Math.max(0, Math.min(BAR_WIDTH, rawFilled));
  const empty = BAR_WIDTH - filled;
  return `${FILLED_CHAR.repeat(filled)}${EMPTY_CHAR.repeat(empty)}`;
};
