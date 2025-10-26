#!/usr/bin/env node

import { StartPrimitiveDuplicateDetection } from './startup/start-primitive-duplicate-detection';

StartPrimitiveDuplicateDetection().catch((error: unknown) => {
  process.stderr.write(`Error: ${String(error)}\n`);
  process.exit(1);
});
