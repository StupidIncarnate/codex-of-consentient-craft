import { duplicateDetectionDetectBroker } from '../brokers/duplicate-detection/detect/duplicate-detection-detect-broker';
import { globPatternContract } from '../contracts/glob-pattern/glob-pattern-contract';
import { absoluteFilePathContract } from '../contracts/absolute-file-path/absolute-file-path-contract';
import { occurrenceThresholdContract } from '../contracts/occurrence-threshold/occurrence-threshold-contract';

export const StartPrimitiveDuplicateDetection = async (): Promise<void> => {
  const args = process.argv.slice(2);

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
    thresholdArg ? parseInt(thresholdArg.split('=')[1] ?? '3', 10) : 3,
  );

  const minLength = minLengthArg ? parseInt(minLengthArg.split('=')[1] ?? '3', 10) : 3;

  // Run detection
  console.log(`Scanning for duplicate primitives...`);
  console.log(`  Pattern: ${pattern}`);
  console.log(`  Directory: ${cwd}`);
  console.log(`  Threshold: ${threshold}+ occurrences`);
  console.log(`  Min length: ${minLength} characters`);
  console.log();

  const duplicates = await duplicateDetectionDetectBroker({
    pattern,
    cwd,
    threshold,
    minLength,
  });

  if (duplicates.length === 0) {
    console.log('✅ No duplicate primitives found!');
    return;
  }

  console.log(`Found ${duplicates.length} duplicate primitive(s):\n`);

  for (const duplicate of duplicates) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`${duplicate.type.toUpperCase()}: "${duplicate.value}"`);
    console.log(`Occurrences: ${duplicate.count}`);
    console.log();

    for (const occurrence of duplicate.occurrences) {
      console.log(`  ${occurrence.filePath}:${occurrence.line}:${occurrence.column}`);
    }

    console.log();
  }

  console.log(`\nSuggestion: Extract these literals to statics files:`);
  console.log(`  packages/*/src/statics/[domain]/[domain]-statics.ts`);
};
