import { siegelenseToolsStatics } from '@dungeonmaster/siegelense/statics';

import { SiegelenseFlow } from './siegelense-flow';

// This chunk registers exactly these three of the thirteen pinned tool names — the plan's own
// words (chunk-02-driver-and-batch.md §3): "register the tools a chunk IMPLEMENTS, as that chunk
// lands them." Filtering `siegelenseToolsStatics.tools.names` (rather than typing the full
// prefixed strings by hand) means a rename or drop of any of the three in the statics fails this
// test instead of silently drifting away from what the flow actually registers.
const REGISTERED_TOOL_SUFFIXES = ['start', 'run', 'kill'];
const expectedNames = siegelenseToolsStatics.tools.names
  .filter((name) => REGISTERED_TOOL_SUFFIXES.includes(name))
  .map((name) => `${siegelenseToolsStatics.tools.prefix}${name}`);

describe('SiegelenseFlow', () => {
  describe('tool registrations', () => {
    it('VALID: returns 3 registrations under their full prefixed names', () => {
      const registrations = SiegelenseFlow();

      const names = registrations.map(({ name }) => name);

      expect(names).toStrictEqual(expectedNames);
    });

    it('VALID: each registration has a handler function', () => {
      const registrations = SiegelenseFlow();

      const handlerTypes = registrations.map(({ handler }) => typeof handler);

      expect(handlerTypes).toStrictEqual(['function', 'function', 'function']);
    });

    it('VALID: each registration has a non-empty description', () => {
      const registrations = SiegelenseFlow();

      const descriptionLengths = registrations.map(({ description }) => description.length > 0);

      expect(descriptionLengths).toStrictEqual([true, true, true]);
    });

    it('VALID: each registration has an inputSchema object', () => {
      const registrations = SiegelenseFlow();

      const schemaTypes = registrations.map(({ inputSchema }) => typeof inputSchema);

      expect(schemaTypes).toStrictEqual(['object', 'object', 'object']);
    });
  });

  describe('no fourteenth tool, no renamed tool', () => {
    it('VALID: every registered name is a member of the pinned thirteen tool names', () => {
      const registrations = SiegelenseFlow();
      const pinnedNames = new Set(
        siegelenseToolsStatics.tools.names.map(
          (name) => `${siegelenseToolsStatics.tools.prefix}${name}`,
        ),
      );

      const allRegisteredNamesArePinned = registrations.every((registration) =>
        pinnedNames.has(registration.name),
      );

      expect(allRegisteredNamesArePinned).toBe(true);
    });
  });
});
