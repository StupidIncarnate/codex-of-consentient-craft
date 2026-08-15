import { workItemRoleStatics } from '@dungeonmaster/shared/statics';

import { blightscoutOperationStatics } from './blightscout-operation-statics';

// The complement of `committingRoles` over the FULL role set, derived from both statics so the two
// can never disagree. Partitioning rather than spot-checking is what forces a role added to
// workItemRoleStatics.names to land here and get the "does its session commit?" call made, instead
// of silently defaulting to "no review".
const ROLES_EARNING_NO_REVIEW = workItemRoleStatics.names.filter(
  (name) => !blightscoutOperationStatics.committingRoles.some((role) => role === name),
);

describe('blightscoutOperationStatics', () => {
  it('VALID: exported value => the scout text template plus the roles whose session earns one', () => {
    expect(blightscoutOperationStatics).toStrictEqual({
      textTemplate:
        'Blightscout: review the commit this session just landed against the five standards concerns — commit: {reviewedOperation}',
      placeholders: {
        reviewedOperation: '{reviewedOperation}',
      },
      committingRoles: [
        'codeweaver',
        'flowrider',
        'groundstomper',
        'siegemaster',
        'pesteater',
        'spiritmender',
      ],
    });
  });

  // A placeholder the template does not actually contain makes `String.replace` a silent no-op, and
  // every scout on the quest goes back to sharing one base text — the exact collapse that made
  // `slotManagerStatics.blightscout.maxAttempts` a per-QUEST budget instead of a per-COMMIT one.
  // Substituting two different reviewed items and comparing is what proves the substitution lands.
  it('VALID: {two different reviewed operation items} => the template yields two DIFFERENT texts, so each review keys its own pt chain', () => {
    const forFirst = blightscoutOperationStatics.textTemplate.replace(
      blightscoutOperationStatics.placeholders.reviewedOperation,
      'codeweaver 11111111-1111-4111-8111-111111111111',
    );
    const forSecond = blightscoutOperationStatics.textTemplate.replace(
      blightscoutOperationStatics.placeholders.reviewedOperation,
      'codeweaver 22222222-2222-4222-8222-222222222222',
    );

    expect({ forFirst, forSecond }).toStrictEqual({
      forFirst:
        'Blightscout: review the commit this session just landed against the five standards concerns — commit: codeweaver 11111111-1111-4111-8111-111111111111',
      forSecond:
        'Blightscout: review the commit this session just landed against the five standards concerns — commit: codeweaver 22222222-2222-4222-8222-222222222222',
    });
  });

  // THE TERMINATION PROOF. The signal-back handler appends a scout on membership in
  // `committingRoles` alone, so a blightscout that WERE a member would mint a scout on completing,
  // which would mint another — a relay that never drains. Its absence is what bounds the append at
  // one review per committing session, structurally rather than by a guard at the call site.
  it('VALID: {committingRoles} => blightscout is absent, so a scout can never mint a scout', () => {
    expect(ROLES_EARNING_NO_REVIEW.filter((role) => role === 'blightscout')).toStrictEqual([
      'blightscout',
    ]);
  });

  it('VALID: {committingRoles} => every member is a real work-item role name', () => {
    expect(
      blightscoutOperationStatics.committingRoles.filter(
        (role) => !workItemRoleStatics.names.some((name) => name === role),
      ),
    ).toStrictEqual([]);
  });

  it('VALID: {every work-item role} => the ones earning no review are the chat roles, both command roles, warpgate, and blightscout itself', () => {
    expect(ROLES_EARNING_NO_REVIEW).toStrictEqual([
      'chaoswhisperer',
      'glyphsmith',
      'bughunt',
      'tavernkeeper',
      // Both COMMAND roles. `riftcarver` carves a workspace and `ward` grades one; neither writes a
      // line of code, so there is no commit for a scout to review.
      'riftcarver',
      'ward',
      'blightscout',
      'warpgate',
    ]);
  });
});
