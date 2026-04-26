import { formatPerformanceSectionLayerBroker } from './format-performance-section-layer-broker';
import { formatPerformanceSectionLayerBrokerProxy } from './format-performance-section-layer-broker.proxy';
import { MarkdownSectionLinesStub } from '../../../contracts/markdown-section-lines/markdown-section-lines.stub';

describe('formatPerformanceSectionLayerBroker', () => {
  it('VALID: {} => returns complete markdown section for performance rules', () => {
    formatPerformanceSectionLayerBrokerProxy();

    const result = formatPerformanceSectionLayerBroker();

    const expected = MarkdownSectionLinesStub({
      value: [
        '## Performance',
        '',
        '### Default to Efficient Algorithms',
        '',
        '**Default to efficient algorithms - Dataset sizes are unknown, use Map/Set for lookups over nested array searches**',
        '',
        '**Example:**',
        '```typescript',
        'const userMap = new Map(users.map(user => [user.id, user])); const targetUser = userMap.get(targetId); // O(n)',
        '```',
        '',
        '**Violations:**',
        '```typescript',
        'const activeUsers = users.filter(user => { return otherUsers.find(other => other.id === user.id)?.isActive; }); // O(n²) nested loops',
        '```',
        '',
        '### Remove Dead Code',
        '',
        '**Delete unused variables/parameters, unreachable code, orphaned files, commented-out code, console.log statements**',
        '',
        '### Use Reflect Methods',
        '',
        '**Reflect.deleteProperty():**',
        '',
        'Use Reflect.deleteProperty() - Never use delete obj[key] with computed keys',
        '',
        '```typescript',
        'Reflect.deleteProperty(require.cache, resolvedPath);',
        '```',
        '',
        '**Violations:**',
        '```typescript',
        'delete require.cache[resolvedPath]; // Lint error',
        '```',
        '',
        '**Reflect.get():**',
        '',
        'Validate untyped data through a Zod contract, then access typed fields directly. Reflect.get/Reflect.set are restricted to *-guard.ts and *-contract.ts files; do not use them in source files (enforced by @dungeonmaster/ban-reflect-outside-guards).',
        '',
        '*Rationale:* Reflect.get returns unknown and bypasses validation, which previously became a universal escape hatch in transformers/brokers. Parsing through a Zod contract upfront yields branded fields you can access with normal property syntax.',
        '',
        '**Example:**',
        '```typescript',
        'const parsed = userPayloadContract.parse(rawJson); const name = parsed.name; // Typed, branded, validated - no Reflect needed',
        'export const hasStringProperty = (params: {obj: unknown; property: string;}): params is {obj: Record<PropertyKey, string>; property: string} => { const {obj, property} = params; if (typeof obj !== "object" || obj === null) { return false; } return property in obj && typeof Reflect.get(obj, property) === "string"; }; // Allowed: this lives in a *-guard.ts file',
        '```',
        '',
        '**Violations:**',
        '```typescript',
        'const record = obj as Record<string, unknown>; return typeof record[property] === "string"; // Lint error: unsafe type assertion - parse through a contract',
        'const name = Reflect.get(payload, "name"); // Lint error in source files: parse payload through a Zod contract and read parsed.name directly',
        'someAdapter.config = Reflect.set(target, "field", value); // Lint error: Reflect.set is also restricted to *-guard.ts and *-contract.ts',
        '```',
        '',
      ],
    });

    expect(result).toStrictEqual(expected);
  });
});
