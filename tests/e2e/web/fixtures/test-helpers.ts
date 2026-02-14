import { APIRequestContext } from '@playwright/test';

const API_URL = 'http://localhost:3737';

export const cleanGuilds = async (request: APIRequestContext): Promise<void> => {
  const response = await request.get(`${API_URL}/api/guilds`);
  const guilds = await response.json();
  for (const guild of guilds) {
    await request.delete(`${API_URL}/api/guilds/${guild.id}`);
  }
};

export const createGuild = async (
  request: APIRequestContext,
  { name, path }: { name: string; path: string }
): Promise<Record<string, unknown>> => {
  const response = await request.post(`${API_URL}/api/guilds`, {
    data: { name, path },
  });
  return response.json();
};

export const createQuest = async (
  request: APIRequestContext,
  { guildId, title, userRequest }: { guildId: string; title: string; userRequest: string }
): Promise<{ questId: string; success: boolean }> => {
  const response = await request.post(`${API_URL}/api/quests`, {
    data: { guildId, title, userRequest },
  });
  return response.json();
};
