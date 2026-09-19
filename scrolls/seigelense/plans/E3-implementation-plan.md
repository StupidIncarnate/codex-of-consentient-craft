# Implementation Plan for E3: Reference Substitution

## 1. Where reference substitution should occur
Reference substitution should occur in `runExecuteStepLayerBroker` (`packages/siegelense/src/brokers/run/execute/run-execute-step-layer-broker.ts`), immediately inside the `try` block, before calling `stepDispatchBroker`. This placement ensures that any resolution failures (e.g., throwing a `StepRefUnresolvedError`) are caught by the `catch` block and converted into an `ok: false` reading, properly stopping the batch and recording the failure in the transcript without crashing the runner.

Remove the existing `stepInterpolateTransformer` logic and replace it with explicit substitution for `goto` and `seed` steps using `stepRefResolveTransformer`.

## 2. Storing earlier seed step outputs in `runExecuteBroker`
In `runExecuteBroker` (`packages/siegelense/src/brokers/run/execute/run-execute-broker.ts`), replace the `bindingsState` holder with `outputsState`:
```typescript
const outputsState: { values: Record<string, Record<string, unknown>> } = { values: {} };
```
Pass these to `runExecuteStepLayerBroker` as:
```typescript
outputs: () => outputsState.values,
recordOutput: ({ name, result }) => {
  outputsState.values = { ...outputsState.values, [name]: result };
}
```
Inside `runExecuteStepLayerBroker`, after `stepDispatchBroker` returns successfully, if the step was a `seed` step and `step.as !== null`, we store its output:
```typescript
if (step.step === 'seed' && step.as !== null) {
  recordOutput({ name: step.as, result: JSON.parse(reading.reading) });
}
```
*(Alternatively, update `runVerbLayerBroker` to use `recordOutput` instead of `recordBinding` and pass the callbacks through `stepDispatchBroker`.)*
Crucially, `outputsState` remains a holder object whose `.values` field mutates, satisfying ESLint's `require-atomic-updates` rule.

## 3. Detecting, resolving, and re-parsing references
Inside `runExecuteStepLayerBroker`, before dispatching:
```typescript
let resolvedStep = step;

if (step.step === 'goto') {
  let resolvedPath: string;
  if (typeof step.path === 'object' && step.path !== null) {
    // It's a pure StepRef object from stepRefContract (e.g. "{g.guild.urlSlug}")
    const refString = `{${step.path.step}.${step.path.row}.${step.path.field}}`;
    resolvedPath = stepRefResolveTransformer({ ref: refString, outputs: outputs() });
  } else {
    // It's a string, e.g. "/{g.guild.urlSlug}"
    resolvedPath = step.path.replace(/\{[^}]+\}/gu, (match) => 
      stepRefResolveTransformer({ ref: match, outputs: outputs() })
    );
  }
  // Re-parse through urlPathContract
  resolvedStep = { ...step, path: urlPathContract.parse(resolvedPath) };
} else if (step.step === 'seed' && step.params !== null) {
  // Substitute in seed.params
  const resolvedParamsJson = JSON.stringify(step.params).replace(/\{[^}]+\}/gu, (match) => {
    const resolved = stepRefResolveTransformer({ ref: match, outputs: outputs() });
    // Escape safely for JSON injection
    return JSON.stringify(resolved).slice(1, -1);
  });
  // Re-parse through the params contract
  const parsedParams = z.record(recipeInputKeyContract, z.unknown()).parse(JSON.parse(resolvedParamsJson));
  resolvedStep = { ...step, params: parsedParams };
}
```

## 4. Handling step 1 reference refusal
When a reference is found but `Object.keys(outputs()).length === 0` (meaning it's the first step or no step has used `as:` yet), the code should refuse it cleanly. If `stepRefResolveTransformer`'s `StepRefUnresolvedError` doesn't natively return "nothing has been named yet" when `available` is empty, we must catch the error during substitution and throw a specific error with that message, so it becomes the `ok: false` reading's error text.
```typescript
if (Object.keys(outputs()).length === 0) {
  throw new Error(`cannot resolve reference ${match} — nothing has been named yet`);
}
```

## 5. Required Test Cases in `run-execute-broker.test.ts`
Implement these exactly as required by § E3:
1. `VALID: {seed as 'g', then goto '/{g.guild.urlSlug}'} => the goto step navigates to the slug the seed actually minted` (Assert on the path the goto broker received).
2. `VALID: {seed as 'g', then seed with params {guildPath:'{g.guild.path}'}} => the second seed entry receives the first seed's real path` (The composition case).
3. `VALID: {two seeds, both with as:} => the second reference resolves against the second step's own output, not the first's`
4. `INVALID: {a reference in step 1} => the batch stops at step 1 with a message naming that nothing has been named yet`
5. `VALID: {a step whose fields carry no reference} => the step is dispatched with its fields unchanged` (Asserted via `toStrictEqual` on the parsed vs dispatched step).

## 6. The narrowing guard in `run-verb-layer-broker.ts`
The narrowing guard currently around line 168 (referenced as `202-208` in the plan docs) must remain entirely untouched:
```typescript
  if (step.step === 'goto') {
    if (typeof step.path !== 'string') {
      throw new Error(
        `run-verb-layer-broker: a 'goto' step (step ${String(index)}) reached with an unresolved {step.row.field} reference — run-execute-broker must resolve every reference before a step dispatches`,
      );
    }
    return stepGotoBroker({ session, path: step.path });
  }
```
This serves as the runtime assertion that substitution successfully happened in `runExecuteStepLayerBroker` and turned any pure `StepRef` object back into a resolved string.
