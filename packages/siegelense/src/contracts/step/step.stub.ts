import type { StubArgument } from '@dungeonmaster/shared/@types';

import { HttpMethodStub } from '../http-method/http-method.stub';
import { LocatorStateStub } from '../locator-state/locator-state.stub';
import { ResetLevelStub } from '../reset-level/reset-level.stub';
import { StepExpectationStub } from '../step-expectation/step-expectation.stub';
import { VideoActionStub } from '../video-action/video-action.stub';
import { stepContract } from './step-contract';
import type { Step } from './step-contract';

// One complete, minimal-but-valid default PER MEMBER — every member is `.strict()`, so a single
// shared base (e.g. click's `target`/`within`/`timeoutMs`) spread under an override for a
// DIFFERENT verb would leave those fields on the object and the parse would reject them as
// unrecognized keys instead of building the requested member.
const STEP_DEFAULTS = {
  goto: { step: 'goto', path: '/api/guilds', node: null, expect: StepExpectationStub() },
  waitFor: {
    step: 'waitFor',
    target: '[data-testid="GUILD_ADD"]',
    within: null,
    state: LocatorStateStub(),
    timeoutMs: null,
    node: null,
    expect: StepExpectationStub(),
  },
  click: {
    step: 'click',
    target: '[data-testid="GUILD_ADD"]',
    within: null,
    ref: null,
    timeoutMs: null,
    node: null,
    expect: StepExpectationStub(),
  },
  type: {
    step: 'type',
    target: '[data-testid="GUILD_ADD"]',
    within: null,
    ref: null,
    value: 'Result text',
    timeoutMs: null,
    node: null,
    expect: StepExpectationStub(),
  },
  screenshot: {
    step: 'screenshot',
    // `.png` is required by the contract, and `FileNameStub`'s own default is `test-file.txt`.
    name: 'step1.png',
    node: null,
    expect: StepExpectationStub(),
  },
  eval: {
    step: 'eval',
    source: 'Result text',
    node: null,
    expect: StepExpectationStub(),
  },
  look: {
    step: 'look',
    within: null,
    node: null,
    expect: StepExpectationStub(),
  },
  box: {
    step: 'box',
    ref: 26,
    node: null,
    expect: StepExpectationStub(),
  },
  dom: {
    step: 'dom',
    target: '[data-testid="GUILD_ADD"]',
    fields: null,
    text: null,
    node: null,
    expect: StepExpectationStub(),
  },
  seed: {
    step: 'seed',
    recipe: 'guild-mid-execution',
    params: null,
    as: null,
    node: null,
    expect: StepExpectationStub(),
  },
  until: {
    step: 'until',
    visible: '[data-testid="GUILD_ADD"]',
    response: null,
    file: null,
    predicate: null,
    console: null,
    timeoutMs: null,
    node: null,
    expect: StepExpectationStub(),
  },
  key: {
    step: 'key',
    press: 'Enter',
    node: null,
    expect: StepExpectationStub(),
  },
  health: {
    step: 'health',
    node: null,
    expect: StepExpectationStub(),
  },
  resize: {
    step: 'resize',
    width: 1280,
    height: 720,
    node: null,
    expect: StepExpectationStub(),
  },
  request: {
    step: 'request',
    method: HttpMethodStub({ value: 'GET' }),
    path: '/api/test',
    node: null,
    expect: StepExpectationStub(),
  },
  before: {
    step: 'before',
    source: 'window.__injected = true;',
    node: null,
    expect: StepExpectationStub(),
  },
  file: {
    step: 'file',
    path: 'guilds/g1/quests/q1/quest.json',
    node: null,
    expect: StepExpectationStub(),
  },
  storage: {
    step: 'storage',
    prefix: '',
    node: null,
    expect: StepExpectationStub(),
  },
  paste: {
    step: 'paste',
    target: '[data-testid="GUILD_ADD"]',
    within: null,
    ref: null,
    filePath: null,
    value: 'Result text',
    timeoutMs: null,
    node: null,
    expect: StepExpectationStub(),
  },
  hold: {
    step: 'hold',
    frames: 4,
    everyMs: 1500,
    node: null,
    expect: StepExpectationStub(),
  },
  video: {
    step: 'video',
    action: VideoActionStub(),
    node: null,
    expect: StepExpectationStub(),
  },
  snapshot: {
    step: 'snapshot',
    as: 'clean',
    node: null,
    expect: StepExpectationStub(),
  },
  reset: {
    step: 'reset',
    level: ResetLevelStub({ value: 'state' }),
    to: 'clean',
    reseed: null,
    node: null,
    expect: StepExpectationStub(),
  },
  scroll: {
    step: 'scroll',
    target: null,
    within: null,
    ref: null,
    by: null,
    byX: null,
    to: 'bottom',
    node: null,
    expect: StepExpectationStub(),
  },
} as const satisfies Record<Step['step'], Record<string, unknown>>;

export const StepStub = ({ ...props }: StubArgument<Step> = {}): Step => {
  // `StubArgument` unbrands every literal, so `props.step` reads as plain `string` here — a
  // chained comparison (rather than an object index) is what resolves the right default without
  // an `any`-typed lookup.
  const stepVerb = props.step ?? 'click';
  const base =
    stepVerb === 'goto'
      ? STEP_DEFAULTS.goto
      : stepVerb === 'waitFor'
        ? STEP_DEFAULTS.waitFor
        : stepVerb === 'type'
          ? STEP_DEFAULTS.type
          : stepVerb === 'screenshot'
            ? STEP_DEFAULTS.screenshot
            : stepVerb === 'eval'
              ? STEP_DEFAULTS.eval
              : stepVerb === 'look'
                ? STEP_DEFAULTS.look
                : stepVerb === 'box'
                  ? STEP_DEFAULTS.box
                  : stepVerb === 'dom'
                    ? STEP_DEFAULTS.dom
                    : stepVerb === 'seed'
                      ? STEP_DEFAULTS.seed
                      : stepVerb === 'until'
                        ? STEP_DEFAULTS.until
                        : stepVerb === 'key'
                          ? STEP_DEFAULTS.key
                          : stepVerb === 'health'
                            ? STEP_DEFAULTS.health
                            : stepVerb === 'resize'
                              ? STEP_DEFAULTS.resize
                              : stepVerb === 'request'
                                ? STEP_DEFAULTS.request
                                : stepVerb === 'before'
                                  ? STEP_DEFAULTS.before
                                  : stepVerb === 'file'
                                    ? STEP_DEFAULTS.file
                                    : stepVerb === 'storage'
                                      ? STEP_DEFAULTS.storage
                                      : stepVerb === 'paste'
                                        ? STEP_DEFAULTS.paste
                                        : stepVerb === 'hold'
                                          ? STEP_DEFAULTS.hold
                                          : stepVerb === 'video'
                                            ? STEP_DEFAULTS.video
                                            : stepVerb === 'snapshot'
                                              ? STEP_DEFAULTS.snapshot
                                              : stepVerb === 'reset'
                                                ? STEP_DEFAULTS.reset
                                                : stepVerb === 'scroll'
                                                  ? STEP_DEFAULTS.scroll
                                                  : STEP_DEFAULTS.click;

  // A `ref` override without a `target` override would otherwise carry click's default target in
  // beside it, and the handle rule rejects a step holding both. The stub's job is to build a VALID
  // member from a partial description, so naming a ref means naming that handle and no other.
  const handleOverridden =
    (stepVerb === 'click' || stepVerb === 'type' || stepVerb === 'paste') &&
    'ref' in props &&
    props.ref !== null;
  const withoutTarget = handleOverridden ? { target: null } : {};

  // `until`'s default condition is `visible`. Overriding a DIFFERENT condition field without this
  // would leave both set — the default `visible` beside the caller's own choice — and the
  // exactly-one-condition rule rejects that, the same way a `ref` override needs `target` cleared.
  const conditionOverridden =
    stepVerb === 'until' &&
    ('response' in props || 'file' in props || 'predicate' in props || 'console' in props);
  const withoutVisible = conditionOverridden ? { visible: null } : {};

  const payloadOverridden =
    stepVerb === 'paste' && 'filePath' in props && props.filePath !== null && !('value' in props);
  const withoutValue = payloadOverridden ? { value: null } : {};

  // `scroll` defaults to the `to` mode; naming any other mode's field drops it so the one-mode rule
  // holds.
  const scrollModeOverridden =
    stepVerb === 'scroll' &&
    (('by' in props && props.by !== null) ||
      ('byX' in props && props.byX !== null) ||
      ('target' in props && props.target !== null) ||
      ('ref' in props && props.ref !== null));
  const withoutTo = scrollModeOverridden ? { to: null } : {};

  return stepContract.parse({
    ...base,
    ...withoutTo,
    ...withoutTarget,
    ...withoutVisible,
    ...withoutValue,
    ...props,
  });
};
