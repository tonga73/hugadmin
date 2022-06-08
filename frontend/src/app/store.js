import { configureStore } from "@reduxjs/toolkit";
import userBarReducer from "../features/userBar/userBarSlice";
import loginReducer from "../features/login/loginSlice";

import { loadState } from "./localStorage";

const reducer = {
  login: loginReducer,
  userBar: userBarReducer,
};

const persistedState = loadState();

export const store = configureStore({
  reducer,
  preloadedState: persistedState,
});
