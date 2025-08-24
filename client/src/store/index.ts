import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./slices/authSlice";
import repositorySlice from "./slices/repositorySlice";
import issuesSlice from "./slices/issuesSlice";

export const store = configureStore({
  reducer: {
    auth: authSlice,
    repositories: repositorySlice,
    issues: issuesSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
