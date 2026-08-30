import { signoffTracksStatics } from './signoff-tracks-statics';

describe('signoffTracksStatics', () => {
  it('VALID: exported value => the two lists, side by side', () => {
    expect(signoffTracksStatics).toStrictEqual({
      fields: ['codeweaver', 'flowrider', 'siegemaster'],
      denominators: ['codeweaver', 'flowrider', 'siegemaster'],
    });
  });

  // A field with no denominator would be a column nobody is measured over — unwritable by any role
  // and unreachable from get-qa-checklist.
  it('VALID: {every field} => is also a denominator', () => {
    const denominators = new Set(signoffTracksStatics.denominators.map(String));

    expect(signoffTracksStatics.fields.filter((track) => !denominators.has(track))).toStrictEqual(
      [],
    );
  });

  // A denominator with no field of its own SHARES another role's column, and the two lists are what
  // record that. There is no such denominator today, and this asserts the empty difference rather
  // than dropping the check — the day one lands, the assertion is the place it is declared.
  it('VALID: {denominators minus fields} => nothing', () => {
    const fields = new Set(signoffTracksStatics.fields.map(String));

    expect(signoffTracksStatics.denominators.filter((track) => !fields.has(track))).toStrictEqual(
      [],
    );
  });
});
