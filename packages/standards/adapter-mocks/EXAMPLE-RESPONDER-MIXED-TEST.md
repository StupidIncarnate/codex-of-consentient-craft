# Example: Responder Test with Mixed Adapter + Broker

**Files analyzed:**

- `packages/hooks/src/responders/hook/session-start/hook-session-start-responder.ts`
- `packages/hooks/src/responders/hook/session-start/hook-session-start-responder.test.ts`

This example shows:

1. How to test a responder that uses BOTH an adapter AND a broker
2. Mixed pattern: Adapter via proxy, broker via manual mock
3. How proxy helpers work alongside traditional mocking
4. When to use proxy vs when to mock directly

**Key Point:** Responders often use adapters (logging, HTTP) AND brokers (business logic). Use proxies for adapters,
mocks for brokers.

---

## The Responder Implementation

```typescript
// responders/hook/session-start/hook-session-start-responder.ts
import {debugDebug} from '../../../adapters/debug/debug-debug';
import {isNewSession} from '../../../contracts/is-new-session/is-new-session';
import {standardsLoadFilesBroker} from '../../../brokers/standards/load-files/standards-load-files-broker';
import type {SessionStartHookData} from '../../../contracts/session-start-hook-data/session-start-hook-data';

const log = debugDebug({namespace: 'questmaestro:session-start-hook'});

export interface HookSessionStartResponderResult {
    shouldOutput: boolean;
    content?: string;
}

export const HookSessionStartResponder = async ({
                                                    input,
                                                }: {
    input: SessionStartHookData;
}): Promise<HookSessionStartResponderResult> => {
    log('Session start hook data:', JSON.stringify(input, undefined, 2));

    // Guard function (pure, no mocking needed)
    const isNew = await isNewSession({transcriptPath: input.transcript_path});
    log('Is new session:', isNew);

    const shouldLoadStandards = isNew || process.env.QUESTMAESTRO_ALWAYS_LOAD_STANDARDS === 'true';

    if (shouldLoadStandards) {
        // Broker call (will be mocked)
        const standardsContent = await standardsLoadFilesBroker({cwd: input.cwd});

        if (standardsContent.trim()) {
            const sessionType = isNew ? 'NEW SESSION' : 'RESUMED SESSION';
            const content = `<questmaestro-standards>
[${sessionType}] The following coding and testing standards should be followed throughout this session:

${standardsContent}

Please refer to these standards when writing, reviewing, or suggesting code changes.
</questmaestro-standards>\n`;

            log(`Standards loaded successfully into ${sessionType.toLowerCase()} context`);

            return {
                shouldOutput: true,
                content,
            };
        }
        log('No standards content found');
    }

    log('Skipping standards load for resumed session');

    return {
        shouldOutput: false,
    };
};
```

**Dependencies:**

- `debugDebug` adapter - Infrastructure (logging)
- `standardsLoadFilesBroker` broker - Business logic
- `isNewSession` guard - Pure function

---

## Current Test (No Adapter Testing)

```typescript
// responders/hook/session-start/hook-session-start-responder.test.ts
import {HookSessionStartResponder} from './hook-session-start-responder';
import {isNewSession} from '../../../contracts/is-new-session/is-new-session';
import {standardsLoadFilesBroker} from '../../../brokers/standards/load-files/standards-load-files-broker';
import {SessionStartHookStub} from '../../../contracts/session-start-hook-data/session-start-hook-data.stub';

// Mock broker and guard
jest.mock('../../../contracts/is-new-session/is-new-session');
jest.mock('../../../brokers/standards/load-files/standards-load-files-broker');

describe('HookSessionStartResponder', () => {
    const mockIsNewSession = jest.mocked(isNewSession);
    const mockStandardsLoadFilesBroker = jest.mocked(standardsLoadFilesBroker);

    it('VALID: {isNew: true, standardsContent: "content"} => returns formatted output', async () => {
        const hookData = SessionStartHookStub({cwd: '/test/project'});
        const standardsContent = StandardsContentStub('# Project Standards\n\nFollow these guidelines...');

        mockIsNewSession.mockResolvedValue(true);
        // ❌ Would fail: mockStandardsLoadFilesBroker.mockResolvedValue('raw string');
        // ✅ TypeScript requires stub (branded type)
        mockStandardsLoadFilesBroker.mockResolvedValue(standardsContent);

        const result = await HookSessionStartResponder({input: hookData});

        expect(result.shouldOutput).toBe(true);
        expect(result.content).toMatch(/\[NEW SESSION\]/);
        expect(mockStandardsLoadFilesBroker).toHaveBeenCalledTimes(1);
    });
});
```

**Problems:**

1. Doesn't test adapter interaction (logging). Can't verify debug messages were logged correctly.
2. Uses raw string `'# Project Standards...'` instead of stub - if `standardsContent` is a branded type, TypeScript
   would error!

---

## With Proxy Pattern (Tests Adapter + Broker)

### 1. Create Debug Adapter Proxy

```typescript
// adapters/debug/debug-debug-adapter.proxy.ts
import {debug} from 'debug';
import {createAdapterProxy} from '@questmaestro/testing';
import {debugDebug} from './debug-debug-adapter';
import type {DebugNamespace} from '../../contracts/debug-namespace/debug-namespace-contract';

export const createDebugDebugProxy = () => {
    return createAdapterProxy(debug, {useMock: true})((debugModule) => {
        const mockDebug = jest.mocked(debugModule);
        const mockDebugDebugAdapter = jest.mocked(debugDebug);

        // ✅ NO setup needed - adapter works automatically when imported
        // Transformer handles jest.mock(), adapter is ready to use

        return {
            // ===== FOR TESTS USING THE ADAPTER =====
            // Getter helpers - return data for test assertions (NO expect() in proxy!)
            getLoggedMessages(namespace: DebugNamespace): string[] {
                const calls = mockDebugDebugAdapter.mock.calls;
                const namespaceCall = calls.find(
                    ([call]) => call.namespace === namespace
                );

                if (!namespaceCall) {
                    return [];
                }

                const logger = namespaceCall[0];
                return (logger as jest.Mock).mock.calls.map((call) => call[0]);
            },

            getLoggerCallCount(namespace: DebugNamespace): number {
                const calls = mockDebugDebugAdapter.mock.calls;
                const namespaceCalls = calls.filter(
                    ([call]) => call.namespace === namespace
                );

                return namespaceCalls.length;
            },

            wasLoggerCreated(namespace: DebugNamespace): boolean {
                const calls = mockDebugDebugAdapter.mock.calls;
                return calls.some(([call]) => call.namespace === namespace);
            }
        };
    });
};
```

**Key Points:**

- Uses `useMock: true` (debug is infrastructure, mock it)
- Provides **getter** helpers (return data, NO `expect()` in proxy!)
- Tests do assertions using the returned data
- NO "mock" in helper names

### 2. Updated Responder Test (With Proxy)

```typescript
// responders/hook/session-start/hook-session-start-responder.test.ts
import { HookSessionStartResponder } from './hook-session-start-responder';
import { isNewSession } from '../../../contracts/is-new-session/is-new-session';
import { standardsLoadFilesBroker } from '../../../brokers/standards/load-files/standards-load-files-broker';
import { createDebugDebugProxy } from '../../../adapters/debug/debug-debug-adapter.proxy';
import { SessionStartHookStub } from '../../../contracts/session-start-hook-data/session-start-hook-data.stub';
import { DebugNamespaceStub } from '../../../contracts/debug-namespace/debug-namespace.stub';
import { StandardsContentStub } from '../../../contracts/standards-content/standards-content.stub';

// ✅ NO jest.mock() for adapter - transformer handles it
// ✅ Still manually mock broker (traditional pattern)
jest.mock('../../../contracts/is-new-session/is-new-session');
jest.mock('../../../brokers/standards/load-files/standards-load-files-broker');

describe('HookSessionStartResponder', () => {
  const debugProxy = createDebugDebugProxy();
  const mockIsNewSession = jest.mocked(isNewSession);
  const mockStandardsLoadFilesBroker = jest.mocked(standardsLoadFilesBroker);

  // ✅ NO setup needed - adapter works automatically!
  // Just import proxy and use assertion helpers

  beforeEach(() => {
    delete process.env.QUESTMAESTRO_ALWAYS_LOAD_STANDARDS;
  });

  describe('New Session', () => {
    it('VALID: {isNew: true, standardsContent: "content"} => returns formatted output AND logs debug messages', async () => {
      const hookData = SessionStartHookStub({ cwd: '/test/project' });
      const standardsContent = StandardsContentStub('# Project Standards\n\nFollow these guidelines...');
      const namespace = DebugNamespaceStub('questmaestro:session-start-hook');

      // ✅ Mock broker (traditional)
      // ✅ Use stub - TypeScript enforces branded type!
      mockIsNewSession.mockResolvedValue(true);
      mockStandardsLoadFilesBroker.mockResolvedValue(standardsContent);

      const result = await HookSessionStartResponder({ input: hookData });

      // ✅ Assert business logic (same as before)
      expect(result.shouldOutput).toBe(true);
      expect(result.content).toMatch(/\[NEW SESSION\]/);
      expect(result.content).toMatch(/<questmaestro-standards>/);
      expect(result.content).toContain(standardsContent);

      // ✅ Assert broker was called (traditional)
      expect(mockStandardsLoadFilesBroker).toHaveBeenCalledTimes(1);
      expect(mockStandardsLoadFilesBroker).toHaveBeenCalledWith({
        cwd: hookData.cwd,
      });

      // ✅ Assert adapter logged correctly (via proxy getters!)
      const logs = debugProxy.getLoggedMessages(namespace);
      expect(logs).toHaveLength(3);
      expect(logs[0]).toContain('Session start hook data:');
      expect(logs[1]).toContain('Is new session: true');
      expect(logs[2]).toContain('Standards loaded successfully into new session context');
    });

    it('EMPTY: {isNew: true, standardsContent: ""} => returns no output AND logs "No standards content found"', async () => {
      const hookData = SessionStartHookStub();
      const namespace = DebugNamespaceStub('questmaestro:session-start-hook');

      mockIsNewSession.mockResolvedValue(true);
      mockStandardsLoadFilesBroker.mockResolvedValue(StandardsContentStub(''));

      const result = await HookSessionStartResponder({ input: hookData });

      // Business logic assertions
      expect(result).toStrictEqual({
        shouldOutput: false,
      });

      // Broker assertions
      expect(mockStandardsLoadFilesBroker).toHaveBeenCalledTimes(1);

      // ✅ Adapter assertions via proxy getter
      const logs = debugProxy.getLoggedMessages(namespace);
      expect(logs.some(log => log.includes('No standards content found'))).toBe(true);
    });
  });

  describe('Resumed Session', () => {
    it('VALID: {isNew: false, ALWAYS_LOAD: undefined} => returns no output AND logs "Skipping standards load"', async () => {
      const hookData = SessionStartHookStub();
      const namespace = DebugNamespaceStub('questmaestro:session-start-hook');

      mockIsNewSession.mockResolvedValue(false);

      const result = await HookSessionStartResponder({ input: hookData });

      // Business logic
      expect(result).toStrictEqual({
        shouldOutput: false,
      });

      // Broker NOT called
      expect(mockStandardsLoadFilesBroker).not.toHaveBeenCalled();

      // ✅ Adapter logged the skip message
      const logs = debugProxy.getLoggedMessages(namespace);
      expect(logs.some(log => log.includes('Skipping standards load for resumed session'))).toBe(true);
    });

    it('VALID: {isNew: false, ALWAYS_LOAD: "true"} => loads standards AND logs RESUMED SESSION', async () => {
      const hookData = SessionStartHookStub({ cwd: '/test/project' });
      const namespace = DebugNamespaceStub('questmaestro:session-start-hook');
      process.env.QUESTMAESTRO_ALWAYS_LOAD_STANDARDS = 'true';
      const standardsContent = StandardsContentStub('# Standards content');

      mockIsNewSession.mockResolvedValue(false);
      mockStandardsLoadFilesBroker.mockResolvedValue(standardsContent);

      const result = await HookSessionStartResponder({ input: hookData });

      // Business logic
      expect(result.shouldOutput).toBe(true);
      expect(result.content).toMatch(/\[RESUMED SESSION\]/);

      // Broker called
      expect(mockStandardsLoadFilesBroker).toHaveBeenCalledTimes(1);

      // ✅ Adapter logged the resume message
      const logs = debugProxy.getLoggedMessages(namespace);
      expect(logs.some(log => log.includes('Is new session: false'))).toBe(true);
      expect(logs.some(log => log.includes('Standards loaded successfully into resumed session context'))).toBe(true);
    });
  });

  describe('Debug Logging Edge Cases', () => {
    it('VALID: logs contain actual input data', async () => {
      const hookData = SessionStartHookStub({
        cwd: '/specific/path',
        transcript_path: '/path/to/transcript',
      });
      const namespace = DebugNamespaceStub('questmaestro:session-start-hook');

      mockIsNewSession.mockResolvedValue(true);
      mockStandardsLoadFilesBroker.mockResolvedValue(StandardsContentStub(''));

      await HookSessionStartResponder({ input: hookData });

      // ✅ Verify logs contain actual data (not just that they were called)
      const logs = debugProxy.getLoggedMessages(namespace);
      const firstLog = logs[0];
      expect(firstLog).toContain('/specific/path');
      expect(firstLog).toContain('/path/to/transcript');
    });
  });
});
```

---

## Key Observations

### TypeScript Type Safety in Mocks

**The branded type system catches errors even in mocks:**

```typescript
// ❌ TypeScript ERROR - Can't pass raw string to mock
const standardsContent = '# Project Standards...';
mockStandardsLoadFilesBroker.mockResolvedValue(standardsContent);
// Error: Type 'string' is not assignable to type 'StandardsContent'

// ✅ CORRECT - Use stub to create branded type
const standardsContent = StandardsContentStub('# Project Standards...');
mockStandardsLoadFilesBroker.mockResolvedValue(standardsContent);
```

**Why this matters:**

- `mockResolvedValue()` expects the return type of the broker
- If broker returns `StandardsContent` (branded), TypeScript enforces it
- You MUST use stub - raw strings won't compile
- Type safety extends to mocks, not just real code!

### Mixed Pattern: Adapter Proxy + Broker Mock

**Adapter (via proxy - getter helpers):**

```typescript
const debugProxy = createDebugDebugProxy();
// Proxy provides GETTERS, test does assertions
const logs = debugProxy.getLoggedMessages(namespace);
expect(logs[0]).toContain('Session start hook data:');
```

**Broker (manual mock):**

```typescript
jest.mock('../../../brokers/standards/load-files/standards-load-files-broker');
const mockBroker = jest.mocked(standardsLoadFilesBroker);
mockBroker.mockResolvedValue(content);
expect(mockBroker).toHaveBeenCalledTimes(1);
```

**Key principle:** Proxies return data, tests do assertions. NO `expect()` in proxy!

### Why Different Approaches?

| Dependency                        | Pattern     | Reason                                                       |
|-----------------------------------|-------------|--------------------------------------------------------------|
| `debugDebug` adapter              | Proxy       | Infrastructure concern, test that logging happened correctly |
| `standardsLoadFilesBroker` broker | Manual mock | Business logic, mock stable broker API                       |
| `isNewSession` guard              | Manual mock | Pure function with logic, mock return value                  |

### Benefits of Proxy for Debug Adapter

**Without proxy:**

```typescript
// ❌ Complex manual setup EVERY test
jest.mock('debug');
const mockDebug = jest.mocked(debug);
const mockLogger = jest.fn();

beforeEach(() => {
  mockDebug.mockReturnValue(mockLogger);
  // Setup debug configuration...
});

it('test', () => {
  // Then need to verify mockLogger calls...
  expect(mockLogger).toHaveBeenCalledWith(expect.stringContaining('message'));
});
```

**With proxy:**

```typescript
// ✅ NO setup - just use getter helpers
const debugProxy = createDebugDebugProxy();

it('test', () => {
    // Adapter works automatically, proxy returns data
    const logs = debugProxy.getLoggedMessages(namespace);
    expect(logs[0]).toContain('message');  // Test does assertions
});
```

### When to Mock Broker vs Use Proxy

**Mock broker directly when:**

- Testing responder/higher-level code
- Broker is a business logic dependency
- You want to control broker's return value
- You don't care HOW broker works, just WHAT it returns

**Use proxy when:**

- Testing adapter itself
- Need to verify infrastructure behavior (logging, HTTP, etc.)
- Want cleaner test API
- Adapter has complex setup

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────┐
│ HookSessionStartResponder (Responder)                   │
│ - Orchestrates business logic                           │
│ - Uses guard, broker, and adapter                       │
└─────────────────────────────────────────────────────────┘
           ↓                    ↓                    ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ isNewSession     │  │ standards        │  │ debugDebug       │
│ (Guard)          │  │ LoadFilesBroker  │  │ (Adapter)        │
│                  │  │ (Broker)         │  │                  │
│ Manual mock      │  │ Manual mock      │  │ Use proxy        │
│ Simple value     │  │ Business logic   │  │ Infrastructure   │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

### Testing Strategy

1. **Guards/Pure functions** → Manual mock (simple return values)
2. **Brokers** → Manual mock (control business logic returns)
3. **Adapters** → Use proxy (verify infrastructure behavior)

This mixed approach:

- ✅ Keeps broker tests simple (just mock return value)
- ✅ Verifies adapter behavior (logging, HTTP, etc.) via proxy
- ✅ Tests business logic AND infrastructure
- ✅ No Jest boilerplate for adapters
- ✅ Traditional mocking where it makes sense
