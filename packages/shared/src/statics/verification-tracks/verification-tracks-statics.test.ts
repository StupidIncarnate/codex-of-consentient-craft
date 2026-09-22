import { verificationTracksStatics } from './verification-tracks-statics';

describe('verificationTracksStatics', () => {
  it('VALID: exported value => the three roles, in relay order', () => {
    expect(verificationTracksStatics).toStrictEqual({
      roles: ['codeweaver', 'flowrider', 'siegemaster'],
    });
  });
});
