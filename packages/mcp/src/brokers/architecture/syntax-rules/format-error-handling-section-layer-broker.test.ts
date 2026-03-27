import { formatErrorHandlingSectionLayerBroker } from './format-error-handling-section-layer-broker';
import { formatErrorHandlingSectionLayerBrokerProxy } from './format-error-handling-section-layer-broker.proxy';
import { MarkdownSectionLinesStub } from '../../../contracts/markdown-section-lines/markdown-section-lines.stub';

describe('formatErrorHandlingSectionLayerBroker', () => {
  it('VALID: {} => returns complete markdown section for error handling rules', () => {
    formatErrorHandlingSectionLayerBrokerProxy();

    const result = formatErrorHandlingSectionLayerBroker();

    const expected = MarkdownSectionLinesStub({
      value: [
        '## Error Handling',
        '',
        '**Handle errors explicitly for every operation that can fail**',
        '',
        '- Never silently swallow errors - Always log, throw, or handle appropriately. Enforced by @dungeonmaster/ban-silent-catch',
        '- Provide context in error messages with relevant data',
        '',
        '**Examples:**',
        '```typescript',
        'export const loadConfig = async ({path}: {path: AbsoluteFilePath}): Promise<Config> => { try { const content = await readFile(path, "utf8"); return configContract.parse(JSON.parse(content)); } catch (error) { throw new Error("Failed to load config from " + path + ": " + error); } };',
        '',
        'export const processUser = async ({userId}: {userId: UserId}): Promise<User> => { const user = await userFetchBroker({userId}); // Let broker throw, catch at responder level return user; };',
        '',
        'promise.catch((error: unknown) => { process.stderr.write("[context] operation failed: " + String(error) + "\\n"); }); // Fire-and-forget: log but do not block',
        '',
        '```',
        '',
        '**Violations:**',
        '```typescript',
        'const loadConfig = async ({path}: {path: string}) => { try { return JSON.parse(await readFile(path, "utf8")); } catch (error) { return {}; // Silent failure loses critical information! } };',
        '',
        'throw new Error("Config load failed"); // What path? What error?',
        '',
        'promise.catch(() => undefined); // Silent swallow — lint error',
        '',
        'promise.catch(() => {}); // Empty catch — lint error',
        '',
        'promise.catch((_err) => { /* comment only */ }); // Comments are not handling — lint error',
        '',
        '```',
        '',
      ],
    });

    expect(result).toStrictEqual(expected);
  });
});
