import { PathSegmentStub, ContentTextStub } from '@dungeonmaster/shared/contracts';
import { siegelenseState } from './siegelense-state';
import { siegelenseStateProxy } from './siegelense-state.proxy';

describe('siegelenseState', () => {
  it('VALID: {key: "a", value: "b"} => get returns "b"', () => {
    const proxy = siegelenseStateProxy();
    proxy.setupEmpty();

    siegelenseState.set({
      key: PathSegmentStub({ value: 'a' }),
      value: ContentTextStub({ value: 'b' }),
    });

    expect(siegelenseState.get({ key: PathSegmentStub({ value: 'a' }) })).toBe(
      ContentTextStub({ value: 'b' }),
    );
  });

  it('EMPTY: {key: "missing"} => get returns undefined', () => {
    const proxy = siegelenseStateProxy();
    proxy.setupEmpty();

    expect(siegelenseState.get({ key: PathSegmentStub({ value: 'missing' }) })).toBe(undefined);
  });
});
