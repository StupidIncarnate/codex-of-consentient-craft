import { architectureOrphanDetectStatics } from './architecture-orphan-detect-statics';

describe('architectureOrphanDetectStatics', () => {
  it('VALID: statics => match expected shape', () => {
    expect(architectureOrphanDetectStatics).toStrictEqual({
      walkedFolderTypes: [
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
