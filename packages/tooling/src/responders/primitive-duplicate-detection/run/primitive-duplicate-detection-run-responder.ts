/**
 * PURPOSE: Parses CLI args and runs duplicate primitive detection, outputting a formatted report to stdout.
 *
 * USAGE:
 * await PrimitiveDuplicateDetectionRunResponder({ args: process.argv.slice(2) });
 * // Outputs a formatted duplicate literals report or a success message to stdout
 */
import { cwd as processCwd, stdout } from '#gateway/node/process';
import { duplicateDetectionDetectBroker } from '../../../brokers/duplicate-detection/detect/duplicate-detection-detect-broker';
import { globPatternContract } from '../../../contracts/glob-pattern/glob-pattern-contract';
import { occurrenceThresholdContract } from '../../../contracts/occurrence-threshold/occurrence-threshold-contract';
import { duplicateDetectionStatics } from '../../../statics/duplicate-detection/duplicate-detection-statics';

const DECIMAL_BASE = 10;

export const PrimitiveDuplicateDetectionRunResponder = async ({
  args,
}: {
  args: readonly string[];
}): Promise<void> => {
  const patternArg = args.find((arg) => arg.startsWith('--pattern='));
  const cwdArg = args.find((arg) => arg.startsWith('--cwd='));
  const thresholdArg = args.find((arg) => arg.startsWith('--threshold='));
  const minLengthArg = args.find((arg) => arg.startsWith('--min-length='));

  const pattern = globPatternContract.parse(patternArg ? patternArg.split('=')[1] : '**/*.ts');
  const cwd = cwdArg
    ? (cwdArg.split('=')[1] ?? '')
    : processCwd();
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

  stdout.write(`Scanning for duplicate primitives...\n`);
  stdout.write(`  Pattern: ${pattern}\n`);
  stdout.write(`  Directory: ${cwd}\n`);
  stdout.write(`  Threshold: ${threshold}+ occurrences\n`);
  stdout.write(`  Min length: ${minLength} characters\n`);
  stdout.write(`\n`);

  const duplicates = await duplicateDetectionDetectBroker({ pattern, cwd, threshold, minLength });

  if (duplicates.length === 0) {
    stdout.write('✅ No duplicate primitives found!\n');
    return;
  }

  stdout.write(`Found ${duplicates.length} duplicate primitive(s):\n\n`);

  for (const duplicate of duplicates) {
    stdout.write(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    stdout.write(`${duplicate.type.toUpperCase()}: "${duplicate.value}"\n`);
    stdout.write(`Occurrences: ${duplicate.count}\n`);
    stdout.write(`\n`);

    for (const occurrence of duplicate.occurrences) {
      stdout.write(`  ${occurrence.filePath}:${occurrence.line}:${occurrence.column}\n`);
    }

    stdout.write(`\n`);
  }

  stdout.write(`\nSuggestion: Extract these literals to statics files:\n`);
  stdout.write(`  packages/*/src/statics/[domain]/[domain]-statics.ts\n`);
};
