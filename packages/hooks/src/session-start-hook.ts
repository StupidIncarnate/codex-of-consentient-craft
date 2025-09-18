#!/usr/bin/env node

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';
import debug from 'debug';

interface SessionStartHookData {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: 'SessionStart';
}

const log = debug('questmaestro:session-start-hook');

async function isNewSession(transcriptPath: string): Promise<boolean> {
  try {
    if (!existsSync(transcriptPath)) {
      return true; // No transcript = new session
    }

    const stats = await import('fs').then((fs) => fs.promises.stat(transcriptPath));
    const fileSize = stats.size;

    // If transcript is very small (< 1KB), likely a new session
    // You could also check content or timestamp
    return fileSize < 1024;
  } catch {
    return true; // Error reading = treat as new
  }
}

async function loadStandardsFiles(cwd: string): Promise<string> {
  const standardsFiles = ['coding-standards.md', 'testing-standards.md'];

  const standardsPath = resolve(cwd, 'node_modules/@questmaestro/standards');
  let content = '';

  for (const file of standardsFiles) {
    const filePath = resolve(standardsPath, file);

    if (existsSync(filePath)) {
      try {
        const fileContent = await readFile(filePath, 'utf8');
        content += `\n\n# ${file.replace('.md', '').replace('-', ' ').toUpperCase()}\n\n`;
        content += fileContent;
        log(`Loaded standards file: ${file}`);
      } catch (error) {
        log(`Failed to load ${file}:`, error);
      }
    } else {
      log(`Standards file not found: ${filePath}`);
    }
  }

  return content;
}

function main(): void {
  let inputData = '';

  process.stdin.on('data', (chunk) => {
    inputData += chunk.toString();
  });

  process.stdin.on('end', () => {
    void (async () => {
      try {
        const hookData = JSON.parse(inputData) as SessionStartHookData;
        log('Session start hook data:', JSON.stringify(hookData, null, 2));

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
            console.log(`<questmaestro-standards>
[${sessionType}] The following coding and testing standards should be followed throughout this session:

${standardsContent}

Please refer to these standards when writing, reviewing, or suggesting code changes.
</questmaestro-standards>`);

            log(`Standards loaded successfully into ${sessionType.toLowerCase()} context`);
          } else {
            log('No standards content found');
          }
        } else {
          log('Skipping standards load for resumed session');
        }
      } catch (error) {
        log('Error in session start hook:', error);
        process.exit(1);
      }
    })();
  });
}

if (require.main === module) {
  main();
}

export { main as sessionStartHook };
