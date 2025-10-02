#!/usr/bin/env node

import { fsReadFile } from './adapters/fs/fs-read-file';
import { fsExistsSync } from './adapters/fs/fs-exists-sync';
import { fsStat } from './adapters/fs/fs-stat';
import { pathResolve } from './adapters/path/path-resolve';
import { debugDebug } from './adapters/debug/debug-debug';
import { filePathContract } from './contracts/file-path/file-path-contract';

interface SessionStartHookData {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: 'SessionStart';
}

const isSessionStartHookData = (data: unknown): data is SessionStartHookData => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  if (!('session_id' in data)) {
    return false;
  }
  const record = data as Record<string, unknown>;
  return (
    typeof record.session_id === 'string' &&
    typeof record.transcript_path === 'string' &&
    typeof record.cwd === 'string' &&
    record.hook_event_name === 'SessionStart'
  );
};

const log = debugDebug({ namespace: 'questmaestro:session-start-hook' });

const KB_SIZE = 1024;
const DEFAULT_EXIT_CODE = 1;

const isNewSession = async (transcriptPath: string): Promise<boolean> => {
  try {
    const parsedPath = filePathContract.parse(transcriptPath);
    if (!fsExistsSync({ filePath: parsedPath })) {
      return true; // No transcript = new session
    }

    const stats = await fsStat({ filePath: parsedPath });
    const fileSize = stats.size;

    // If transcript is very small (< 1KB), likely a new session
    // You could also check content or timestamp
    return fileSize < KB_SIZE;
  } catch {
    return true; // Error reading = treat as new
  }
};

const loadStandardsFiles = async (cwd: string): Promise<string> => {
  const standardsFiles = ['coding-standards.md', 'testing-standards.md'];

  const standardsPath = pathResolve({ paths: [cwd, 'node_modules/@questmaestro/standards'] });

  const filePromises = standardsFiles.map(async (file) => {
    const filePath = pathResolve({ paths: [standardsPath, file] });

    if (fsExistsSync({ filePath })) {
      try {
        const fileContent = await fsReadFile({ filePath });
        log(`Loaded standards file: ${file}`);
        return `\n\n# ${file.replace('.md', '').replace('-', ' ').toUpperCase()}\n\n${fileContent}`;
      } catch (error) {
        log(`Failed to load ${file}:`, error);
        return '';
      }
    }
    log(`Standards file not found: ${filePath}`);
    return '';
  });

  const fileContents = await Promise.all(filePromises);
  return fileContents.join('');
};

const main = (): void => {
  let inputData = '';

  process.stdin.on('data', (chunk) => {
    inputData += chunk.toString();
  });

  process.stdin.on('end', () => {
    const runAsync = async (): Promise<void> => {
      try {
        const parsedData: unknown = JSON.parse(inputData);
        if (!isSessionStartHookData(parsedData)) {
          log('Invalid hook data format');
          process.exit(DEFAULT_EXIT_CODE);
        }
        const hookData = parsedData;
        log('Session start hook data:', JSON.stringify(hookData, undefined, DEFAULT_EXIT_CODE + 1));

        const isNew = await isNewSession(hookData.transcript_path);
        log('Is new session:', isNew);

        // Only load standards for new sessions (or always, based on preference)
        const shouldLoadStandards =
          isNew || process.env.QUESTMAESTRO_ALWAYS_LOAD_STANDARDS === 'true';

        if (shouldLoadStandards) {
          const standardsContent = await loadStandardsFiles(hookData.cwd);

          if (standardsContent.trim()) {
            const sessionType = isNew ? 'NEW SESSION' : 'RESUMED SESSION';
            // Output the standards content that Claude will see
            process.stdout.write(`<questmaestro-standards>
[${sessionType}] The following coding and testing standards should be followed throughout this session:

${standardsContent}

Please refer to these standards when writing, reviewing, or suggesting code changes.
</questmaestro-standards>\n`);

            log(`Standards loaded successfully into ${sessionType.toLowerCase()} context`);
          } else {
            log('No standards content found');
          }
        } else {
          log('Skipping standards load for resumed session');
        }
      } catch (error) {
        log('Error in session start hook:', error);
        process.exit(DEFAULT_EXIT_CODE);
      }
    };
    runAsync().catch(() => undefined);
  });
};

if (require.main === module) {
  main();
}

export { main as sessionStartHook };
