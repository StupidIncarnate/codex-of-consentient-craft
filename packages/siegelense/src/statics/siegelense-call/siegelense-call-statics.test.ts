import { siegelenseCallStatics } from './siegelense-call-statics';

describe('siegelenseCallStatics', () => {
  it('VALID: exported value => matches the complete statics shape', () => {
    expect(siegelenseCallStatics).toStrictEqual({
      calls: {
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

  it('VALID: {calls.names} => returns the complete thirteen-name array, and it holds no "look"', () => {
    expect(siegelenseCallStatics.calls.names).toStrictEqual([
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
    ]);
  });
});
