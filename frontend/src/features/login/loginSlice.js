import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { fetchLogin } from "./loginAPI";

const initialState = {
  status: "",
};

export const login = createAsyncThunk("login/fetchLogin", async (user) => {
  const response = await fetchLogin(user);

  return user;
});

export const loginSlice = createSlice({
  name: "login",
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "error";
      });
  },
});

export default loginSlice.reducer;
