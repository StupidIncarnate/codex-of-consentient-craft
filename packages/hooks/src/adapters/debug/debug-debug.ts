import debug, { type Debugger } from 'debug';

export type { Debugger };

export const debugDebug = ({ namespace }: { namespace: string }): Debugger => debug(namespace);
