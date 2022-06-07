import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "../features/counter/counterSlice";

import { loadState, saveState } from "./localStorage";

const reducer = {
  counter: counterReducer,
};

const persistedState = loadState();

export const store = configureStore({
  reducer,
  persistedState,
});

store.subscribe(() => {
  saveState(store.getState());
});
