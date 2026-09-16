import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ContentTextStub, FileNameStub } from '@dungeonmaster/shared/contracts';

import { LocatorStateStub } from '../locator-state/locator-state.stub';
import { RecipeNameStub } from '../recipe-name/recipe-name.stub';
import { SelectorStub } from '../selector/selector.stub';
import { StepExpectationStub } from '../step-expectation/step-expectation.stub';
import { UrlPathStub } from '../url-path/url-path.stub';
import { stepContract } from './step-contract';
import type { Step } from './step-contract';

// One complete, minimal-but-valid default PER MEMBER — every member is `.strict()`, so a single
// shared base (e.g. click's `target`/`within`/`timeoutMs`) spread under an override for a
// DIFFERENT verb would leave those fields on the object and the parse would reject them as
// unrecognized keys instead of building the requested member.
const STEP_DEFAULTS = {
  goto: { step: 'goto', path: UrlPathStub(), node: null, expect: StepExpectationStub() },
  waitFor: {
    step: 'waitFor',
    target: SelectorStub(),
    within: null,
    state: LocatorStateStub(),
    timeoutMs: null,
    node: null,
    expect: StepExpectationStub(),
  },
  click: {
    step: 'click',
    target: SelectorStub(),
    within: null,
    timeoutMs: null,
    node: null,
    expect: StepExpectationStub(),
  },
  type: {
    step: 'type',
    target: SelectorStub(),
    within: null,
    value: ContentTextStub(),
    timeoutMs: null,
    node: null,
    expect: StepExpectationStub(),
  },
  screenshot: {
    step: 'screenshot',
    // `.png` is required by the contract, and `FileNameStub`'s own default is `test-file.txt`.
    name: FileNameStub({ value: 'step1.png' }),
    node: null,
    expect: StepExpectationStub(),
  },
  eval: {
    step: 'eval',
    source: ContentTextStub(),
    node: null,
    expect: StepExpectationStub(),
  },
  seed: {
    step: 'seed',
    recipe: RecipeNameStub(),
    params: null,
    as: null,
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
              : stepVerb === 'seed'
                ? STEP_DEFAULTS.seed
                : STEP_DEFAULTS.click;

  return stepContract.parse({ ...base, ...props });
};
