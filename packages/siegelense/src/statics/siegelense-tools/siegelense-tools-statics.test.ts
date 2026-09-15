import { siegelenseToolsStatics } from './siegelense-tools-statics';

describe('siegelenseToolsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(siegelenseToolsStatics).toStrictEqual({
      tools: {
        prefix: 'siegelense-',
        names: [
          'start',
          'run',
          'results',
          'kill',
          'capacity',
          'profile',
          'status',
          'cleanup',
          'prune',
          'compare',
          'snapshots',
          'recipes',
          'docs',
        ],
      },
      docs: {
        scopes: [
          'operating',
          'planning',
          'walking',
          'attacking',
          'fixing',
          'driving',
          'operational',
        ],
      },
    });
  });

  it.each(siegelenseToolsStatics.tools.names)(
    'VALID: {name: %s} => reachable as prefix concatenated with the name',
    (name) => {
      expect(`${siegelenseToolsStatics.tools.prefix}${name}`).toBe(`siegelense-${name}`);
    },
  );
});
