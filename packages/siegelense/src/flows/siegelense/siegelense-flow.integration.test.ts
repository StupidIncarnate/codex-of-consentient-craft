import { ContentTextStub } from '@dungeonmaster/shared/contracts';
import { SiegelenseFlow } from './siegelense-flow';

describe('SiegelenseFlow', () => {
  it('VALID: {input: "example"} => writes "siegelense run: example" to stdout', async () => {
    const output: ReturnType<typeof ContentTextStub>[] = [];
    const originalWrite = process.stdout.write.bind(process.stdout);

    process.stdout.write = ((chunk: string): boolean => {
      output.push(ContentTextStub({ value: chunk }));
      return true;
    }) as unknown as typeof process.stdout.write;

    await SiegelenseFlow({ input: 'example' });

    process.stdout.write = originalWrite;

    expect(output).toStrictEqual(['siegelense run: example\n']);
  });
});
