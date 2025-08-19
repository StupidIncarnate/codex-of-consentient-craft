## Overview
Keeping track of what project guardrails are in place to force claude to do things properly and not skip steps.

## jest.setup.js
Claude was filling in empty tests, doing feature work, filled in a few, and then ran test and saw everything passed, even the empty tests and moved on.

This ensures it sees failures for empty tests: 

```tsx

afterEach(() => {
    // Restore real timers after each test
    jest.useRealTimers();

    // Check for empty tests (tests without assertions)
    const currentTest = expect.getState().currentTestName;
    const assertionsMade = expect.getState().assertionCalls;

    if (assertionsMade === 0) {
        throw new Error(`Test "${currentTest}" has no assertions. Add expect() calls or remove the test.`);
    }
});

```