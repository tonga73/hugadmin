import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { login } from "../login/loginSlice";

const initialState = {
  user: {},
  isLoggedIn: false,
};

export const logout = (dispatch, getState) => {
  dispatch(userLogOut());
  localStorage.clear();
};

export const userBarSlice = createSlice({
  name: "userBar",
  initialState,
  reducers: {
    userLogOut: (state) => {
      state.status = "";
      state.user = {};
      state.isLoggedIn = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(login.fulfilled, (state, action) => {
      state.status = "success";
      state.user = action.payload;
      state.isLoggedIn = true;
    });
  },
});

export const { userLogOut } = userBarSlice.actions;

export const loginStatus = (state) => state.userBar.isLoggedIn;

export const currentUser = (state) => state.userBar.user;

export default userBarSlice.reducer;
