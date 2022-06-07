import { configureStore } from "@reduxjs/toolkit";
import userBarReducer from "../features/userBar/userBarSlice";

import { loadState, saveState } from "./localStorage";

const reducer = {
  userBar: userBarReducer,
};

const persistedState = loadState();

export const store = configureStore({
  reducer,
  persistedState,
});

store.subscribe(() => {
  saveState(store.getState());
});
