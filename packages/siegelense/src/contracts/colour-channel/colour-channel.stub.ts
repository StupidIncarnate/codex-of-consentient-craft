import { colourChannelContract } from './colour-channel-contract';
import type { ColourChannel } from './colour-channel-contract';

export const ColourChannelStub = ({ value }: { value: number } = { value: 13 }): ColourChannel =>
  colourChannelContract.parse(value);
