import { configureStore } from "@reduxjs/toolkit";
import userBarReducer from "../features/userBar/userBarSlice";
import loginReducer from "../features/login/loginSlice";
import recordsReducer from "../features/records/recordsSlice";
import recordReducer from "../features/record/recordSlice";
import tracingReducer from "../features/tracing/tracingSlice";
import locationsManagerReducer from "../features/locationsManager/locationsManagerSlice";

import { loadState } from "./localStorage";

const reducer = {
  login: loginReducer,
  userBar: userBarReducer,
  records: recordsReducer,
  record: recordReducer,
  tracing: tracingReducer,
  locationsManager: locationsManagerReducer,
};

const persistedState = loadState();

export const store = configureStore({
  reducer,
  preloadedState: persistedState,
});
