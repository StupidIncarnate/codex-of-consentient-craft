import { APIRequestContext } from '@playwright/test';

const API_URL = 'http://localhost:3737';

export const cleanProjects = async (request: APIRequestContext): Promise<void> => {
  const response = await request.get(`${API_URL}/api/projects`);
  const projects = await response.json();
  for (const project of projects) {
    await request.delete(`${API_URL}/api/projects/${project.id}`);
  }
};

export const createProject = async (
  request: APIRequestContext,
  { name, path }: { name: string; path: string }
): Promise<Record<string, unknown>> => {
  const response = await request.post(`${API_URL}/api/projects`, {
    data: { name, path },
  });
  return response.json();
};

export const createQuest = async (
  request: APIRequestContext,
  { projectId, title, userRequest }: { projectId: string; title: string; userRequest: string }
): Promise<Record<string, unknown>> => {
  const response = await request.post(`${API_URL}/api/quests`, {
    data: { projectId, title, userRequest },
  });
  return response.json();
};
