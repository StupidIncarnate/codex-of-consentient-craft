import { fleetListingStatics } from './fleet-listing-statics';

describe('fleetListingStatics', () => {
  it('VALID: exported value => matches the complete statics shape', () => {
    expect(fleetListingStatics).toStrictEqual({
      table: {
        header: ['ID', 'STATE', 'SPEC', 'PORTS', 'LAST BEAT'],
        columnGap: 2,
        cellPadding: 2,
      },
      evidence: {
        shapeLine: 'evidence: <repoRoot>/.siegelense/{unowned|guilds/<guildId>}/instances/<id>/\n',
      },
      killedFooter: {
        tombstoneSingular: 'tombstone',
        tombstonePlural: 'tombstones',
        body:
          ', not leaks: no process, no port, no memory. The row and its evidence\n' +
          'are kept so `results` and `status` still answer for a dead instance, which is the normal\n' +
          'case for anyone reading a run that broke. No built call removes them; that is `prune`.\n',
      },
    });
  });
});
