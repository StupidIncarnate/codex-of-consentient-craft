/**
 * PURPOSE: Checks if terminal output matches a specific CLI screen type
 *
 * USAGE:
 * if (isCliScreenMatchGuard({ frame: outputBuffer, screen: 'menu' })) { ... }
 * // Returns true if output matches menu screen patterns
 */

import type { CliScreenName } from '../../contracts/cli-screen-name/cli-screen-name-contract';
import { screenFrameContract } from '../../contracts/screen-frame/screen-frame-contract';
import { stripAnsiTransformer } from '../../transformers/strip-ansi/strip-ansi-transformer';

// Menu pattern: matches menu with navigation options
const MENU_PATTERN = /Add|Run|List/u;
// Add pattern: matches the add screen prompt
const ADD_PATTERN = /What would you like/iu;
// List pattern: matches actual quest file paths like .dungeonmaster-quests/001-my-quest
// but NOT the menu text "List all active quests"
const LIST_PATTERN = /\.dungeonmaster-quests\//iu;
const HELP_PATTERN = /Help|Usage/iu;
const RUN_PATTERN = /Running|Execute/iu;
// Init pattern: matches init screen content like "Initializing..." or installation progress
// but NOT the menu text "Init - Initialize dungeonmaster"
const INIT_PATTERN = /Initializing|Installing|already present|devDependencies/iu;
// Answer pattern: question mark preceded by word character (not ANSI escape like [?25l)
// but NOT the add screen prompt "What would you like to build?"
const ANSWER_PATTERN = /\w\?/u;
// Negative pattern for answer: don't match if it looks like the add screen
const ADD_SCREEN_NEGATIVE = /What would you like/iu;

export const isCliScreenMatchGuard = ({
  frame,
  screen,
}: {
  frame?: string;
  screen?: CliScreenName;
}): boolean => {
  if (frame === undefined || screen === undefined) {
    return false;
  }

  // Strip ANSI escape codes before pattern matching to avoid false positives
  // from codes like [?25l (hide cursor) triggering the answer screen detection
  const cleanFrame = stripAnsiTransformer({ frame: screenFrameContract.parse(frame) });

  switch (screen) {
    case 'menu':
      return MENU_PATTERN.test(cleanFrame);
    case 'add':
      return ADD_PATTERN.test(cleanFrame);
    case 'list':
      return LIST_PATTERN.test(cleanFrame);
    case 'answer':
      // Match question mark but exclude the add screen prompt
      return ANSWER_PATTERN.test(cleanFrame) && !ADD_SCREEN_NEGATIVE.test(cleanFrame);
    case 'help':
      return HELP_PATTERN.test(cleanFrame);
    case 'run':
      return RUN_PATTERN.test(cleanFrame);
    case 'init':
      return INIT_PATTERN.test(cleanFrame);
    default:
      return false;
  }
};
