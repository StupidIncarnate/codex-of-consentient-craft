import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { flowriderCoverageMinionStatics } from './flowrider-coverage-minion-statics';

describe('flowriderCoverageMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(flowriderCoverageMinionStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => stays under the MCP tool-result verbatim-delivery ceiling', () => {
    const { template } = flowriderCoverageMinionStatics.prompt;

    expect(template.length).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  it('VALID: template => carries $ARGUMENTS exactly once, on its own line', () => {
    const { template } = flowriderCoverageMinionStatics.prompt;

    expect({
      count: template.split('$ARGUMENTS').length - 1,
      ownLine: /^\$ARGUMENTS$/mu.test(template),
    }).toStrictEqual({ count: 1, ownLine: true });
  });

  it('VALID: template => has a Briefing section heading', () => {
    expect(flowriderCoverageMinionStatics.prompt.template).toMatch(/^## Briefing$/mu);
  });

  it('VALID: template => is the ONLY writer of the Flowrider track, because the authoring minion signs nothing', () => {
    const needle =
      '**You are the ONLY thing that writes the Flowrider track.** The `flowrider-authoring-minion` does NOT sign its own work — not one unit, not one field.';
    const { template } = flowriderCoverageMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => names self-signing as the exact failure the design exists to prevent', () => {
    const needle =
      'the audit gate would be pre-satisfied the moment the authoring pass returned, which is verbatim the failure this whole design exists to prevent: a session grading its own homework';
    const { template } = flowriderCoverageMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => runs as a real gate ahead of the reconcile, ward and commit gates', () => {
    const needle =
      "**You run as a REAL GATE**, before the operator's reconcile, ward and commit gates.";
    const { template } = flowriderCoverageMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => measures the diff from the quest baseRef, not a default-branch diff', () => {
    const needle =
      "The branch diff you audit against is measured from the quest's pinned `baseRef`.";
    const { template } = flowriderCoverageMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => confirmed requires a test file:line plus what makes that test fail', () => {
    const needle =
      'Evidence is a test `file:line` PLUS what makes that test fail: the production line you broke and the assertion that went red.';
    const { template } = flowriderCoverageMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => a test the auditor has not seen fail is not evidence', () => {
    const needle = '**A test you have not seen fail is not evidence.**';
    const { template } = flowriderCoverageMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => unconfirmable requires what was tried plus a routable question', () => {
    const needle =
      'Evidence says what you TRIED and why each attempt could not reach it; `question` says what someone else would need in order to settle it.';
    const { template } = flowriderCoverageMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => has no third verdict, so a measured defect becomes a NEW observable', () => {
    const { template } = flowriderCoverageMinionStatics.prompt;

    const noThird = '**There is no third verdict, and there is no `failed`.**';

    expect(
      template.slice(template.indexOf(noThird), template.indexOf(noThird) + noThird.length),
    ).toBe(noThird);

    const inverse = '"send it `bleh` and the server returns 500 instead of 400"';

    expect(
      template.slice(template.indexOf(inverse), template.indexOf(inverse) + inverse.length),
    ).toBe(inverse);

    const additive =
      "ADD it to the flow via the additive spec authority (`modify-quest`, `addedBy: 'flowrider'`)";

    expect(
      template.slice(template.indexOf(additive), template.indexOf(additive) + additive.length),
    ).toBe(additive);
  });

  it('VALID: template => writes sign-offs by patching id plus the sign-off field, and nothing else', () => {
    const { template } = flowriderCoverageMinionStatics.prompt;

    const patch =
      "Patch the unit's own element through `modify-quest`: `{ id, flowriderSignoff }` on the observable, node, edge, or `offMapSignoffs` entry.";

    expect(template.slice(template.indexOf(patch), template.indexOf(patch) + patch.length)).toBe(
      patch,
    );

    const onlyId = 'Send **only `id` plus the sign-off field** on that element.';

    expect(template.slice(template.indexOf(onlyId), template.indexOf(onlyId) + onlyId.length)).toBe(
      onlyId,
    );
  });

  it('VALID: template => batches the sign-off writes into one modify-quest call per flow', () => {
    const { template } = flowriderCoverageMinionStatics.prompt;

    const batch =
      '**Batch the writes: ONE `modify-quest` call per flow, carrying every sign-off for that flow.**';

    expect(template.slice(template.indexOf(batch), template.indexOf(batch) + batch.length)).toBe(
      batch,
    );

    const never = '**Never one call per unit.**';

    expect(template.slice(template.indexOf(never), template.indexOf(never) + never.length)).toBe(
      never,
    );

    const cost =
      '45 outbox appends, 45 WebSocket broadcasts and 45 browser refetches of a quest file that grows with every one of them';

    expect(template.slice(template.indexOf(cost), template.indexOf(cost) + cost.length)).toBe(cost);
  });

  it('VALID: template => never writes the qaLedger, which is Siegemaster track', () => {
    const needle =
      "**You never write `quest.planningNotes.qaLedger`.** That is Siegemaster's ledger, answering Siegemaster's question.";
    const { template } = flowriderCoverageMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  // The Flowrider track is narrowed twice before this pass sees a unit — by the package KINDS a
  // browser can reach, which are Groundstomper's, and by the dispatching item's own package NAMES.
  // A call missing either measures a set no operation item is gated on.
  it('VALID: template => passes packageNames alongside track so its denominator is the item’s slice', () => {
    const { template } = flowriderCoverageMinionStatics.prompt;

    const slice =
      '**Your scope is a SLICE, and the tool computes it — you never widen it by hand.**';

    expect(template.slice(template.indexOf(slice), template.indexOf(slice) + slice.length)).toBe(
      slice,
    );

    const pass = '**Pass `packageNames` too, exactly as your brief states them.**';

    expect(template.slice(template.indexOf(pass), template.indexOf(pass) + pass.length)).toBe(pass);

    const cost =
      'Omit them and you measure the whole quest: you inherit units a sibling flowrider item owns';

    expect(template.slice(template.indexOf(cost), template.indexOf(cost) + cost.length)).toBe(cost);
  });

  // A Playwright spec proves a claim read out of a browser, which is a Groundstomper unit and out of
  // this track's denominator by package kind — so an e2e worked example taught this prompt's only
  // sign-off writer that the sibling track's artifact settles its own units.
  it('VALID: template => shows a Jest test as the confirmed evidence example and rules Playwright out', () => {
    const { template } = flowriderCoverageMinionStatics.prompt;

    const example =
      '`<package>/src/brokers/comment/count/comment-count-broker.integration.test.ts:64 — asserts 2 against a two-comment fixture; returning a hardcoded 1 from commentCountTransformer turns it red`';

    expect(
      template.slice(template.indexOf(example), template.indexOf(example) + example.length),
    ).toBe(example);

    const ruledOut = '**A Playwright `.e2e.ts` is never evidence on this track.**';

    expect(
      template.slice(template.indexOf(ruledOut), template.indexOf(ruledOut) + ruledOut.length),
    ).toBe(ruledOut);

    const jestOnly = 'Your evidence is a `.test.ts` or a `.integration.test.ts`, run under Jest.';

    expect(
      template.slice(template.indexOf(jestOnly), template.indexOf(jestOnly) + jestOnly.length),
    ).toBe(jestOnly);
  });

  it('VALID: template => names no package literally and cites no e2e file of its own', () => {
    const { template } = flowriderCoverageMinionStatics.prompt;

    expect({
      hardcodedUiPackage: template.indexOf('packages/web'),
      citedE2eFile: template.indexOf('.e2e.ts:'),
      uiPackagePlaceholder: template.indexOf('<ui-package>'),
    }).toStrictEqual({ hardcodedUiPackage: -1, citedE2eFile: -1, uiPackagePlaceholder: -1 });
  });

  it('VALID: template => scopes itself to runtime flows and excludes operational ones', () => {
    const needle = '**Runtime flows only.** An operational flow is NOT your scope';
    const { template } = flowriderCoverageMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => tells the operator it signs the observables it adds at its own later spec gate', () => {
    const needle =
      '**The Flowrider operator can ADD observables at its own final spec gate, AFTER you have already run.**';
    const { template } = flowriderCoverageMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => moving an observable is impossible, so the operator restates and adds instead', () => {
    const { template } = flowriderCoverageMinionStatics.prompt;

    const impossible =
      '**"Move the observable to the runtime flow" is IMPOSSIBLE.** The additive guard refuses every observable delete, by design';

    expect(
      template.slice(
        template.indexOf(impossible),
        template.indexOf(impossible) + impossible.length,
      ),
    ).toBe(impossible);

    const restate =
      'it RESTATES the operational observable so its text names the runtime flow that proves it, and it ADDS the covering observable on that runtime flow. Both observables exist afterwards, and `addedBy` links the added one to the pass that added it.';

    expect(
      template.slice(template.indexOf(restate), template.indexOf(restate) + restate.length),
    ).toBe(restate);
  });

  it('VALID: template => ward paths must be explicit files, never a bare directory scope', () => {
    const needle =
      'These paths must be explicit FILE paths — never a bare directory (`-- packages/<pkg>`); a directory scope pulls in the whole package, runs long, and gets auto-backgrounded, stranding you with no wakeup.';
    const { template } = flowriderCoverageMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => carries a DO NOT STASH hard rule', () => {
    const needle = '**Hard rule — DO NOT STASH.**';
    const { template } = flowriderCoverageMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => audits rather than authors, so it never writes the test it then signs', () => {
    const needle = '**You do NOT author the missing tests.**';
    const { template } = flowriderCoverageMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => forbids git for ANY purpose, read or write', () => {
    const needle = '**Never run `git` — for ANY purpose, read or write.**';
    const { template } = flowriderCoverageMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  describe('minion operating rules', () => {
    it('VALID: template => embeds the minion rules variant, which forbids signal-back', () => {
      const needle =
        '**1. NEVER call `signal-back` — your final message IS your terminal action.**';
      const { template } = flowriderCoverageMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });
  });
});
