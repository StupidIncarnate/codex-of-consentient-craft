/**
 * PURPOSE: Checks if terminal output matches a specific CLI screen type
 *
 * USAGE:
 * if (isCliScreenMatchGuard({ frame: outputBuffer, screen: 'menu' })) { ... }
 * // Returns true if output matches menu screen patterns
 */

import type { CliScreenName } from '../../contracts/cli-screen-name/cli-screen-name-contract';

const MENU_PATTERN = /Add|Run|List/u;
const ADD_PATTERN = /What would you like|build/iu;
const LIST_PATTERN = /quests|\.dungeonmaster-quests/iu;
const HELP_PATTERN = /Help|Usage/iu;
const RUN_PATTERN = /Running|Execute/iu;
const INIT_PATTERN = /Init|Initialize/iu;

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

  switch (screen) {
    case 'menu':
      return MENU_PATTERN.test(frame);
    case 'add':
      return ADD_PATTERN.test(frame);
    case 'list':
      return LIST_PATTERN.test(frame);
    case 'answer':
      return frame.includes('?');
    case 'help':
      return HELP_PATTERN.test(frame);
    case 'run':
      return RUN_PATTERN.test(frame);
    case 'init':
      return INIT_PATTERN.test(frame);
    default:
      return false;
  }
};
