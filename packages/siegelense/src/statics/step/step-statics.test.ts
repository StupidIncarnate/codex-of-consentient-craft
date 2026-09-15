import { stepStatics } from './step-statics';

describe('stepStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(stepStatics).toStrictEqual({
      verbs: {
        all: ['goto', 'waitFor', 'click', 'type', 'screenshot', 'eval'],
        acting: ['goto', 'click', 'type'],
        targeting: ['waitFor', 'click', 'type'],
        browser: ['goto', 'waitFor', 'click', 'type', 'screenshot', 'eval'],
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

  it('VALID: {verbs.targeting} => every member is also a member of verbs.all', () => {
    const isSubsetOfAll = stepStatics.verbs.targeting.every((verb) =>
      stepStatics.verbs.all.includes(verb),
    );

    expect(isSubsetOfAll).toBe(true);
  });
});
