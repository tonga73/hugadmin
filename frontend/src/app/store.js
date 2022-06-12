import { configureStore } from "@reduxjs/toolkit";

import admin from "../features/admin/adminSlice";

import userBarReducer from "../features/userBar/userBarSlice";
import loginReducer from "../features/login/loginSlice";
import recordsReducer from "../features/records/recordsSlice";
import recordReducer from "../features/record/recordSlice";
import tracingsReducer from "../features/tracings/tracingsSlice";
import locationsManagerReducer from "../features/locationsManager/locationsManagerSlice";

import { loadState } from "./localStorage";

const reducer = {
  admin: admin,
  login: loginReducer,
  userBar: userBarReducer,
  records: recordsReducer,
  record: recordReducer,
  tracings: tracingsReducer,
  locationsManager: locationsManagerReducer,
};

const persistedState = loadState();

export const store = configureStore({
  reducer,
  preloadedState: persistedState,
});
