import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';
import { minimatchMatchAdapterProxy } from '../../../adapters/minimatch/match/minimatch-match-adapter.proxy';

export const isInsideGatewayLayerBrokerProxy = (): {
  setupFilename: ({ filename, matches }: { filename: string; matches: boolean }) => void;
} => {
  const minimatchProxy = minimatchMatchAdapterProxy();

  return {
    // Stages EVERY gateway glob for this filename with the same answer: `.some()` only needs the
    // aggregate outcome, so which specific glob "matched" is not a distinction this test cares
    // about — staging all four identically still exercises the real `.some()` scan honestly.
    setupFilename: ({ filename, matches }: { filename: string; matches: boolean }): void => {
      gatewayLocationsStatics.packageGlobs.forEach((glob) => {
        minimatchProxy.returns({ filePath: filename, pattern: `**/${glob}`, result: matches });
      });
    },
  };
};
