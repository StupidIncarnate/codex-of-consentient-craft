import { signoffTracksStatics } from '@dungeonmaster/shared/statics';

import { signoffPatchFieldsStatics } from './signoff-patch-fields-statics';

const TRACK_FIELDS = signoffTracksStatics.fields.map((track) => `${track}Signoff`);

describe('signoffPatchFieldsStatics', () => {
  describe('signoffFields', () => {
    it('VALID: {signoffFields} => names every track, so any one of them marks an element as signing', () => {
      expect(signoffPatchFieldsStatics.signoffFields).toStrictEqual([
        'codeweaverSignoff',
        'flowriderSignoff',
        'siegemasterSignoff',
      ]);
    });
  });

  describe('allowedOnSigningElement', () => {
    it('VALID: {allowedOnSigningElement} => `id` plus every sign-off field and nothing else', () => {
      expect(signoffPatchFieldsStatics.allowedOnSigningElement).toStrictEqual([
        'id',
        'codeweaverSignoff',
        'flowriderSignoff',
        'siegemasterSignoff',
      ]);
    });

    it('VALID: {every sign-off field} => appears in the signing-element allowlist, so signing itself is never the violation', () => {
      const allowed = new Set(signoffPatchFieldsStatics.allowedOnSigningElement.map(String));

      expect(
        signoffPatchFieldsStatics.signoffFields.filter((field) => allowed.has(field)),
      ).toStrictEqual(['codeweaverSignoff', 'flowriderSignoff', 'siegemasterSignoff']);
    });
  });

  describe('allowedOnSigningNode', () => {
    it('VALID: {allowedOnSigningNode} => the element allowlist plus the `observables` container', () => {
      expect(signoffPatchFieldsStatics.allowedOnSigningNode).toStrictEqual([
        'id',
        'codeweaverSignoff',
        'flowriderSignoff',
        'siegemasterSignoff',
        'observables',
      ]);
    });
  });

  // The three lists are DERIVED from `signoffTracksStatics.fields`, so a fourth track declared there
  // is marked as signing and allowed on a signing element the same day. Hardcoded, that track's own
  // sign-off would be refused as the offending key — the inversion of what the allowlist is for.
  describe('derivation from signoffTracksStatics', () => {
    it('VALID: {every list} => is the track fields, in track order, plus only the container keys', () => {
      expect({
        signoffFields: signoffPatchFieldsStatics.signoffFields.map(String),
        allowedOnSigningElement: signoffPatchFieldsStatics.allowedOnSigningElement.map(String),
        allowedOnSigningNode: signoffPatchFieldsStatics.allowedOnSigningNode.map(String),
      }).toStrictEqual({
        signoffFields: TRACK_FIELDS,
        allowedOnSigningElement: ['id', ...TRACK_FIELDS],
        allowedOnSigningNode: ['id', ...TRACK_FIELDS, 'observables'],
      });
    });
  });

  describe('full exported value', () => {
    it('VALID: {statics} => matches the complete sign-off patch field map', () => {
      expect(signoffPatchFieldsStatics).toStrictEqual({
        signoffFields: ['codeweaverSignoff', 'flowriderSignoff', 'siegemasterSignoff'],
        allowedOnSigningElement: [
          'id',
          'codeweaverSignoff',
          'flowriderSignoff',
          'siegemasterSignoff',
        ],
        allowedOnSigningNode: [
          'id',
          'codeweaverSignoff',
          'flowriderSignoff',
          'siegemasterSignoff',
          'observables',
        ],
      });
    });
  });
});
