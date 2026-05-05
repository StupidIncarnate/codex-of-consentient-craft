import { architectureOrphanDetectStatics } from './architecture-orphan-detect-statics';

describe('architectureOrphanDetectStatics', () => {
  it('VALID: statics => match expected shape', () => {
    expect(architectureOrphanDetectStatics).toStrictEqual({
      walkedFolderTypes: [
        'adapters',
        'bindings',
        'brokers',
        'flows',
        'middleware',
        'migrations',
        'responders',
        'startup',
        'state',
        'widgets',
      ],
    });
  });
});
