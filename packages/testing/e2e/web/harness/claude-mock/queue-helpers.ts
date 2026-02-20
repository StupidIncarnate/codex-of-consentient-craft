import * as fs from 'fs';
import * as path from 'path';

import type { ClaudeResponse } from './types';

const getQueueDir = (): string => {
  const home = process.env.DUNGEONMASTER_HOME;
  if (!home) {
    throw new Error('DUNGEONMASTER_HOME env var is not set');
  }
  return path.join(home, 'claude-queue');
};

const getMetadataPath = (): string => path.join(getQueueDir(), 'metadata.json');

const getCounter = (): number => {
  const metaPath = getMetadataPath();
  if (fs.existsSync(metaPath)) {
    const raw = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as { counter: number };
    return raw.counter;
  }
  return 0;
};

const setCounter = (counter: number): void => {
  fs.writeFileSync(getMetadataPath(), JSON.stringify({ counter }));
};

export const queueClaudeResponse = (response: ClaudeResponse): void => {
  const queueDir = getQueueDir();
  fs.mkdirSync(queueDir, { recursive: true });

  const counter = getCounter();
  const filePath = path.join(queueDir, `${String(counter).padStart(4, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(response));
  setCounter(counter + 1);
};

export const clearClaudeQueue = (): void => {
  const queueDir = getQueueDir();
  if (!fs.existsSync(queueDir)) return;

  const files = fs.readdirSync(queueDir);
  for (const file of files) {
    fs.unlinkSync(path.join(queueDir, file));
  }
};
