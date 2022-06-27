import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { fetchLogin } from "./loginAPI";

const initialState = {
  status: "",
  message: "",
};

export const login = createAsyncThunk(
  "login/fetchLogin",
  async (user, { rejectWithValue }) => {
    const response = await fetchLogin(user);

    if (response.status === "error") {
      return rejectWithValue(response.msg);
    }

    if (response === "") {
      return;
    }

    return response;
  }
);

export const loginSlice = createSlice({
  name: "login",
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "success";
        state.message = "";
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "error";
        state.message = action.payload;
      });
  },
});

export const selectLoginStatus = (state) => state.login.status;

export const selectLoginMessage = (state) => state.login.message;

export default loginSlice.reducer;
