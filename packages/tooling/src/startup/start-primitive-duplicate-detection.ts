#!/usr/bin/env node

/**
 * PURPOSE: CLI entry point that scans TypeScript files for duplicate string and regex literals.
 *
 * USAGE:
 * await StartPrimitiveDuplicateDetection();
 * // Or with CLI args: node script.js --pattern="**\/*.ts" --threshold=3 --min-length=3
 * // Returns: void (outputs duplicate literal report to stdout)
 */
import { duplicateDetectionDetectBroker } from '../brokers/duplicate-detection/detect/duplicate-detection-detect-broker';
import { globPatternContract } from '../contracts/glob-pattern/glob-pattern-contract';
import { absoluteFilePathContract } from '../contracts/absolute-file-path/absolute-file-path-contract';
import { occurrenceThresholdContract } from '../contracts/occurrence-threshold/occurrence-threshold-contract';
import { duplicateDetectionStatics } from '../statics/duplicate-detection/duplicate-detection-statics';

const COMMAND_LINE_ARG_START_INDEX = 2;
const DECIMAL_BASE = 10;

export const StartPrimitiveDuplicateDetection = async (): Promise<void> => {
  const args = process.argv.slice(COMMAND_LINE_ARG_START_INDEX);

  // Parse command line arguments
  const patternArg = args.find((arg) => arg.startsWith('--pattern='));
  const cwdArg = args.find((arg) => arg.startsWith('--cwd='));
  const thresholdArg = args.find((arg) => arg.startsWith('--threshold='));
  const minLengthArg = args.find((arg) => arg.startsWith('--min-length='));

  const pattern = globPatternContract.parse(patternArg ? patternArg.split('=')[1] : '**/*.ts');

  const cwd = cwdArg
    ? absoluteFilePathContract.parse(cwdArg.split('=')[1] ?? '')
    : absoluteFilePathContract.parse(process.cwd());

  const threshold = occurrenceThresholdContract.parse(
    thresholdArg
      ? parseInt(
          thresholdArg.split('=')[1] ?? String(duplicateDetectionStatics.defaults.threshold),
          DECIMAL_BASE,
        )
      : duplicateDetectionStatics.defaults.threshold,
  );

  const minLength = minLengthArg
    ? parseInt(
        minLengthArg.split('=')[1] ?? String(duplicateDetectionStatics.defaults.minLength),
        DECIMAL_BASE,
      )
    : duplicateDetectionStatics.defaults.minLength;

  // Run detection
  process.stdout.write(`Scanning for duplicate primitives...\n`);
  process.stdout.write(`  Pattern: ${pattern}\n`);
  process.stdout.write(`  Directory: ${cwd}\n`);
  process.stdout.write(`  Threshold: ${threshold}+ occurrences\n`);
  process.stdout.write(`  Min length: ${minLength} characters\n`);
  process.stdout.write(`\n`);

  const duplicates = await duplicateDetectionDetectBroker({
    pattern,
    cwd,
    threshold,
    minLength,
  });

  if (duplicates.length === 0) {
    process.stdout.write('✅ No duplicate primitives found!\n');
    return;
  }

  process.stdout.write(`Found ${duplicates.length} duplicate primitive(s):\n\n`);

  for (const duplicate of duplicates) {
    process.stdout.write(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    process.stdout.write(`${duplicate.type.toUpperCase()}: "${duplicate.value}"\n`);
    process.stdout.write(`Occurrences: ${duplicate.count}\n`);
    process.stdout.write(`\n`);

    for (const occurrence of duplicate.occurrences) {
      process.stdout.write(`  ${occurrence.filePath}:${occurrence.line}:${occurrence.column}\n`);
    }

    process.stdout.write(`\n`);
  }

  process.stdout.write(`\nSuggestion: Extract these literals to statics files:\n`);
  process.stdout.write(`  packages/*/src/statics/[domain]/[domain]-statics.ts\n`);
};

// Execute when run directly as a script or via bin
if (require.main === module) {
  StartPrimitiveDuplicateDetection().catch((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error: ${errorMessage}\n`);
    process.exit(1);
  });
}
