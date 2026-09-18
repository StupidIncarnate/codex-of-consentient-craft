import { stepStatics } from './step-statics';

describe('stepStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(stepStatics).toStrictEqual({
      verbs: {
        all: [
          'goto',
          'waitFor',
          'click',
          'type',
          'screenshot',
          'eval',
          'look',
          'box',
          'dom',
          'seed',
          'until',
          'key',
          'health',
          'resize',
          'request',
          'before',
          'file',
          'storage',
          'paste',
          'hold',
          'video',
        ],
        acting: ['goto', 'click', 'type', 'key', 'resize', 'paste'],
        capturing: ['goto', 'click', 'type', 'look', 'key', 'health', 'resize', 'paste', 'hold'],
        targeting: ['waitFor', 'click', 'type', 'paste'],
        browser: [
          'goto',
          'waitFor',
          'click',
          'type',
          'screenshot',
          'eval',
          'look',
          'box',
          'dom',
          'key',
          'health',
          'resize',
          'before',
          'storage',
          'paste',
          'hold',
          'video',
        ],
      },
      defaults: {
        stopOn: 'error',
        expect: 'ok',
      },
    });
  });

  it('VALID: {verbs.acting} => every member is also a member of verbs.all', () => {
    const isSubsetOfAll = stepStatics.verbs.acting.every((verb) =>
      stepStatics.verbs.all.includes(verb),
    );

    expect(isSubsetOfAll).toBe(true);
  });

  it('VALID: {verbs.capturing} => every member is also a member of verbs.all', () => {
    const isSubsetOfAll = stepStatics.verbs.capturing.every((verb) =>
      stepStatics.verbs.all.includes(verb),
    );

    expect(isSubsetOfAll).toBe(true);
  });

  it('VALID: {verbs.targeting} => every member is also a member of verbs.all', () => {
    const isSubsetOfAll = stepStatics.verbs.targeting.every((verb) =>
      stepStatics.verbs.all.includes(verb),
    );

    expect(isSubsetOfAll).toBe(true);
  });

  it('VALID: {verbs.browser} => every member is also a member of verbs.all', () => {
    const isSubsetOfAll = stepStatics.verbs.browser.every((verb) =>
      stepStatics.verbs.all.includes(verb),
    );

    expect(isSubsetOfAll).toBe(true);
  });

  it('VALID: {verbs.acting} => every member also captures, since a step that changed the page always has a picture worth keeping', () => {
    const actingThatDoesNotCapture = stepStatics.verbs.acting.filter(
      (verb) => !stepStatics.verbs.capturing.includes(verb),
    );

    expect(actingThatDoesNotCapture).toStrictEqual([]);
  });

  // Asserted as whole tuples rather than by filtering for `look`. `verbs.acting` is typed narrowly
  // enough that `verb === 'look'` can never be true, so a filter reads as a passing test while
  // proving nothing the type did not already prove — tsc refuses the comparison outright.
  it('VALID: {verbs.capturing} => holds look, which writes the shot beside the key', () => {
    expect(stepStatics.verbs.capturing).toStrictEqual([
      'goto',
      'click',
      'type',
      'look',
      'key',
      'health',
      'resize',
      'paste',
      'hold',
    ]);
  });

  it('VALID: {verbs.acting} => omits look, which reads the page and never changes it', () => {
    expect(stepStatics.verbs.acting).toStrictEqual([
      'goto',
      'click',
      'type',
      'key',
      'resize',
      'paste',
    ]);
  });

  // `seed` is the first verb that is in `all` and in NONE of the four subsets. It touches disk and
  // HTTP and never a screen, so it neither acts, captures, targets nor needs a browser — and a
  // regression putting it in `browser` would make it refuse against `dungeonmaster-headless`.
  // Asserted as whole tuples rather than by filtering for `seed`, for the same reason the `look`
  // cases above are: each subset is typed narrowly enough that `verb === 'seed'` cannot be true,
  // so tsc refuses the comparison outright and a filter would prove nothing.
  it('VALID: {verbs.browser} => omits seed, which touches disk and HTTP and never a screen', () => {
    expect(stepStatics.verbs.browser).toStrictEqual([
      'goto',
      'waitFor',
      'click',
      'type',
      'screenshot',
      'eval',
      'look',
      'box',
      'dom',
      'key',
      'health',
      'resize',
      'before',
      'storage',
      'paste',
      'hold',
      'video',
    ]);
  });

  it('VALID: {verbs.targeting} => omits seed, which resolves no element', () => {
    expect(stepStatics.verbs.targeting).toStrictEqual(['waitFor', 'click', 'type', 'paste']);
  });

  // `until` is the second verb in `all` that is in NONE of the four subsets, for a DIFFERENT
  // reason than `seed`: it carries no `target` at all, and only one of its five forms (`file`)
  // needs no browser while the other four do — a split `stepStatics.verbs.browser` cannot express
  // per-member, so it happens inside `stepUntilBroker` itself instead.
  it('VALID: {verbs.browser} => omits until, whose forms split per-call rather than by this list', () => {
    expect(stepStatics.verbs.browser).toStrictEqual([
      'goto',
      'waitFor',
      'click',
      'type',
      'screenshot',
      'eval',
      'look',
      'box',
      'dom',
      'key',
      'health',
      'resize',
      'before',
      'storage',
      'paste',
      'hold',
      'video',
    ]);
  });

  it('VALID: {verbs.targeting} => omits until, which carries no target field at all', () => {
    expect(stepStatics.verbs.targeting).toStrictEqual(['waitFor', 'click', 'type', 'paste']);
  });

  it('VALID: {verbs.all} => ends with video, the twenty-first verb', () => {
    expect(stepStatics.verbs.all).toStrictEqual([
      'goto',
      'waitFor',
      'click',
      'type',
      'screenshot',
      'eval',
      'look',
      'box',
      'dom',
      'seed',
      'until',
      'key',
      'health',
      'resize',
      'request',
      'before',
      'file',
      'storage',
      'paste',
      'hold',
      'video',
    ]);
  });
});
