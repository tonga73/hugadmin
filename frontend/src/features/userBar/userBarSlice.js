import { createSlice } from "@reduxjs/toolkit";

import { login } from "../login/loginSlice";

const initialState = {
  status: "",
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
    setUser: (state, action) => {
      state.status = action.payload.status;
      state.user = action.payload.user || state.user;
    },
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

export const { setUser, userLogOut } = userBarSlice.actions;

export const selectUserStatus = (state, action) => state.userBar.status;

export const selectUser = (state) => state.userBar.user;

export const selectLogIn = (state) => state.userBar.isLoggedIn;

export const selectToken = (state) => state.userBar.user.token;

export default userBarSlice.reducer;
