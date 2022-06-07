import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: {},
  isLoggedIn: false,
};

export const userBarSlice = createSlice({
  name: "userBar",
  initialState,
});

export default userBarSlice.reducer;
