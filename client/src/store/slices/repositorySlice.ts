import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Repository } from "../../lib/supabase";
import { api } from "../../lib/api";

interface RepositoryState {
  repositories: Repository[];
  selectedRepository: Repository | null;
  loading: boolean;
  error: string | null;
}

const initialState: RepositoryState = {
  repositories: [],
  selectedRepository: null,
  loading: false,
  error: null,
};

export const fetchRepositories = createAsyncThunk(
  "repositories/fetchRepositories",
  async (userId: string) => {
    const response = await api.get(`/repositories/${userId}`);
    return response.data.repositories as Repository[];
  }
);

export const addRepository = createAsyncThunk(
  "repositories/addRepository",
  async ({
    userId,
    repoData,
  }: {
    userId: string;
    repoData: {
      name: string;
      full_name: string;
      description?: string;
      url: string;
    };
  }) => {
    const response = await api.post(
      `/repositories?user_id=${userId}`,
      repoData
    );

    if (response.data.success) {
      return response.data.repository as Repository;
    } else {
      throw new Error(response.data.message || "Failed to add repository");
    }
  }
);

export const deleteRepository = createAsyncThunk(
  "repositories/deleteRepository",
  async ({
    repositoryId,
    userId,
  }: {
    repositoryId: string;
    userId: string;
  }) => {
    const response = await api.delete(
      `/repositories/${repositoryId}?user_id=${userId}`
    );

    if (response.data.success) {
      return repositoryId;
    } else {
      throw new Error(response.data.message || "Failed to delete repository");
    }
  }
);

const repositorySlice = createSlice({
  name: "repositories",
  initialState,
  reducers: {
    setSelectedRepository: (
      state,
      action: PayloadAction<Repository | null>
    ) => {
      state.selectedRepository = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Repositories
      .addCase(fetchRepositories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRepositories.fulfilled, (state, action) => {
        state.loading = false;
        state.repositories = action.payload;
        state.error = null;
      })
      .addCase(fetchRepositories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch repositories";
      })
      // Add Repository
      .addCase(addRepository.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addRepository.fulfilled, (state, action) => {
        state.loading = false;
        state.repositories.unshift(action.payload);
        state.error = null;
      })
      .addCase(addRepository.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to add repository";
      })
      // Delete Repository
      .addCase(deleteRepository.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRepository.fulfilled, (state, action) => {
        state.loading = false;
        state.repositories = state.repositories.filter(
          (repo) => repo.id !== action.payload
        );
        if (state.selectedRepository?.id === action.payload) {
          state.selectedRepository = null;
        }
        state.error = null;
      })
      .addCase(deleteRepository.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to delete repository";
      });
  },
});

export const { setSelectedRepository, clearError } = repositorySlice.actions;
export default repositorySlice.reducer;
