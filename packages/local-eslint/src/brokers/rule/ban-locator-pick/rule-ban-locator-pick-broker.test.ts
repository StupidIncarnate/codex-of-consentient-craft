import { ruleBanLocatorPickBroker } from './rule-ban-locator-pick-broker';
import { eslintRuleTesterAdapter } from '@dungeonmaster/eslint-plugin';

const ruleTester = eslintRuleTesterAdapter();

// Virtual fixture paths — RuleTester does NOT read these off disk; it only uses them as the
// "filename" key on each test case so the scope guard's path-substring check works.
const stepClickBrokerFixture =
  '/repo/packages/siegelense/src/brokers/step/click/step-click-broker.ts';
const stepNthBrokerFixture = '/repo/packages/siegelense/src/brokers/step/nth/step-nth-broker.ts';
const outsideScopeFixture = '/repo/packages/web/test/siege-driver/siege-command.ts';

const scope = 'packages/siegelense/src/brokers/step/';

ruleTester.run('ban-locator-pick', ruleBanLocatorPickBroker(), {
  valid: [
    // === IN SCOPE: `.nth()` with a parameter argument is caller input, not a pick ===
    {
      code: [
        'export const clickNthParam = ({',
        '  locator,',
        '  index,',
        '}: {',
        '  locator: { nth: (i: number) => { click: () => void } };',
        '  index: number;',
        '}): void => {',
        '  locator.nth(index).click();',
        '};',
      ].join('\n'),
      filename: stepNthBrokerFixture,
    },
    // === IN SCOPE: `.nth()` with a variable argument is caller input, not a pick ===
    {
      code: [
        'export const clickNthVariable = ({',
        '  locator,',
        '}: {',
        '  locator: { nth: (i: number) => { click: () => void } };',
        '}): void => {',
        '  const targetIndex = 3;',
        '  locator.nth(targetIndex).click();',
        '};',
      ].join('\n'),
      filename: stepNthBrokerFixture,
    },
    // === OUTSIDE SCOPE: the identical `.first()` call decides nothing outside the step-command
    // broker implementations ===
    {
      code: [
        'export const clickFirstOutsideScope = ({',
        '  locator,',
        '}: {',
        '  locator: { first: () => { click: () => void } };',
        '}): void => {',
        '  locator.first().click();',
        '};',
      ].join('\n'),
      filename: outsideScopeFixture,
    },
  ],

  invalid: [
    // === IN SCOPE: `.first()` always silently picks a match ===
    {
      code: [
        'export const clickFirst = ({',
        '  locator,',
        '}: {',
        '  locator: { first: () => { click: () => void } };',
        '}): void => {',
        '  locator.first().click();',
        '};',
      ].join('\n'),
      filename: stepClickBrokerFixture,
      errors: [{ messageId: 'locatorPick', data: { method: 'first', scope } }],
    },
    // === IN SCOPE: `.last()` always silently picks a match ===
    {
      code: [
        'export const clickLast = ({',
        '  locator,',
        '}: {',
        '  locator: { last: () => { click: () => void } };',
        '}): void => {',
        '  locator.last().click();',
        '};',
      ].join('\n'),
      filename: stepClickBrokerFixture,
      errors: [{ messageId: 'locatorPick', data: { method: 'last', scope } }],
    },
    // === IN SCOPE: `.nth(0)` written as a literal is `.first()` with extra steps ===
    {
      code: [
        'export const clickNthZero = ({',
        '  locator,',
        '}: {',
        '  locator: { nth: (i: number) => { click: () => void } };',
        '}): void => {',
        '  locator.nth(0).click();',
        '};',
      ].join('\n'),
      filename: stepNthBrokerFixture,
      errors: [{ messageId: 'literalNth', data: { argument: '0', scope } }],
    },
    // === IN SCOPE: any literal `.nth()` argument, not just zero, is still a pick ===
    {
      code: [
        'export const clickNthTwo = ({',
        '  locator,',
        '}: {',
        '  locator: { nth: (i: number) => { click: () => void } };',
        '}): void => {',
        '  locator.nth(2).click();',
        '};',
      ].join('\n'),
      filename: stepNthBrokerFixture,
      errors: [{ messageId: 'literalNth', data: { argument: '2', scope } }],
    },
  ],
});
