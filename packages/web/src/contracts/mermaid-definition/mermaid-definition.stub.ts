import { mermaidDefinitionContract } from './mermaid-definition-contract';
import type { MermaidDefinition } from './mermaid-definition-contract';

export const MermaidDefinitionStub = ({ value }: { value?: string } = {}): MermaidDefinition =>
  mermaidDefinitionContract.parse(value ?? 'graph TD; A-->B');
