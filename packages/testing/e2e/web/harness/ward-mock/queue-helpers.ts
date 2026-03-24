import * as fs from 'fs';
import * as path from 'path';

import type { WardResponse } from './types';

const COUNTER_START = 0;
const PAD_LENGTH = 4;

const getQueueDir = (): string => {
  const home = process.env.DUNGEONMASTER_HOME;
  if (!home) {
    throw new Error('DUNGEONMASTER_HOME env var is not set');
  }
  return path.join(home, 'ward-queue');
};

const getMetadataPath = (): string => path.join(getQueueDir(), 'metadata.json');

const getCounter = (): number => {
  const metaPath = getMetadataPath();
  if (fs.existsSync(metaPath)) {
    const raw = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as { counter: number };
    return raw.counter;
  }
  return COUNTER_START;
};

const setCounter = ({ counter }: { counter: number }): void => {
  fs.writeFileSync(getMetadataPath(), JSON.stringify({ counter }));
};

export const queueWardResponse = ({ response }: { response: WardResponse }): void => {
  const queueDir = getQueueDir();
  fs.mkdirSync(queueDir, { recursive: true });

  const counter = getCounter();
  const filePath = path.join(queueDir, `${String(counter).padStart(PAD_LENGTH, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(response));
  setCounter({ counter: counter + 1 });
};

export const clearWardQueue = (): void => {
  const queueDir = getQueueDir();
  if (!fs.existsSync(queueDir)) return;

  const files = fs.readdirSync(queueDir);
  for (const file of files) {
    fs.unlinkSync(path.join(queueDir, file));
  }
};
