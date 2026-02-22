/**
 * PURPOSE: Defines the input schema for the MCP get-folder-detail tool
 *
 * USAGE:
 * const input: FolderDetailInput = folderDetailInputContract.parse({ folderType: 'brokers' });
 * // Returns validated FolderDetailInput with folderType
 */
import { z } from 'zod';
import { folderTypeContract } from '@dungeonmaster/shared/contracts';

export const folderDetailInputContract = z.object({
  folderType: folderTypeContract.describe('Type of folder to get details for'),
});

export type FolderDetailInput = z.infer<typeof folderDetailInputContract>;
