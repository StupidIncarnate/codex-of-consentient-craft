#!/usr/bin/env node

import { StartPrimitiveDuplicateDetection } from './startup/start-primitive-duplicate-detection';

StartPrimitiveDuplicateDetection().catch((error: unknown) => {
  console.error('Error:', error);
  process.exit(1);
});
