/**
 * PURPOSE: Detects the CLI screen type from terminal output
 *
 * USAGE:
 * const screen = detectCliScreenTransformer({ frame: outputBuffer });
 * // Returns CliScreenName like 'menu', 'add', 'list', etc.
 */

import { cliScreenNameContract } from '../../contracts/cli-screen-name/cli-screen-name-contract';
import { isCliScreenMatchGuard } from '../../guards/is-cli-screen-match/is-cli-screen-match-guard';
import { e2eScreenPatternsStatics } from '../../statics/e2e-screen-patterns/e2e-screen-patterns-statics';
import type { CliScreenName } from '../../contracts/cli-screen-name/cli-screen-name-contract';

export const detectCliScreenTransformer = ({ frame }: { frame: string }): CliScreenName => {
  for (const screen of e2eScreenPatternsStatics.screenPriority) {
    const parsedScreen = cliScreenNameContract.parse(screen);
    if (isCliScreenMatchGuard({ frame, screen: parsedScreen })) {
      return parsedScreen;
    }
  }
  return cliScreenNameContract.parse('menu');
};
