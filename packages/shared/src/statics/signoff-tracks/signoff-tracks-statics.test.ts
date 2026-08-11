import { signoffTracksStatics } from './signoff-tracks-statics';

describe('signoffTracksStatics', () => {
  it('VALID: exported value => the two lists, side by side', () => {
    expect(signoffTracksStatics).toStrictEqual({
      fields: ['flowrider', 'siegemaster'],
      denominators: ['flowrider', 'groundstomper', 'siegemaster'],
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

  // The surplus is the whole reason there are two lists: a role measured on its own units that
  // writes a column named after another role.
  it('VALID: {denominators minus fields} => groundstomper alone', () => {
    const fields = new Set(signoffTracksStatics.fields.map(String));

    expect(signoffTracksStatics.denominators.filter((track) => !fields.has(track))).toStrictEqual([
      'groundstomper',
    ]);
  });
});
