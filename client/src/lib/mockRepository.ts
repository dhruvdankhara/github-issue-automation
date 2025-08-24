import type { Repository } from "./supabase";

// Mock in-memory storage for demo purposes
const mockRepositories: Repository[] = [];
let nextId = 1;

export const mockRepositoryService = {
  async fetchRepositories(userId: string): Promise<Repository[]> {
    return mockRepositories.filter((repo) => repo.user_id === userId);
  },

  async addRepository(
    userId: string,
    repoData: {
      name: string;
      full_name: string;
      description?: string;
      url: string;
    }
  ): Promise<Repository> {
    const newRepo: Repository = {
      id: (nextId++).toString(),
      user_id: userId,
      name: repoData.name,
      full_name: repoData.full_name,
      description: repoData.description || null,
      url: repoData.url,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockRepositories.push(newRepo);
    return newRepo;
  },

  async deleteRepository(repositoryId: string): Promise<void> {
    const index = mockRepositories.findIndex(
      (repo) => repo.id === repositoryId
    );
    if (index !== -1) {
      mockRepositories.splice(index, 1);
    }
  },
};
