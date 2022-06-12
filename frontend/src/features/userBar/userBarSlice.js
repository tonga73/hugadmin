import { createSlice } from "@reduxjs/toolkit";

import { login } from "../login/loginSlice";

const initialState = {
  status: "",
  user: {},
  isLoggedIn: false,
  token: "",
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
      state.token = action.payload.token;
    });
  },
});

export const { userLogOut } = userBarSlice.actions;

export const selectUserStatus = (state, action) => state.userBar.status;

export const selectUser = (state) => state.userBar.user;

export const selectLogIn = (state) => state.userBar.isLoggedIn;

export const selectToken = (state) => state.userBar.token;

export default userBarSlice.reducer;
