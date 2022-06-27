import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { fetchGetUsers, fetchNewUser } from "./adminAPI";

const initialState = {
  status: "",
  message: "",
  users: [],
};

export const getUsers = createAsyncThunk(
  "admin/fetchGetUsers",
  async ({ rejectWithValue }) => {
    const response = await fetchGetUsers();

    if (response.status === "error") {
      return rejectWithValue(response.msg);
    }

    return response;
  }
);

export const newUserAsync = createAsyncThunk(
  "admin/fetchNewUser",
  async (user, { rejectWithValue }) => {
    const response = await fetchNewUser(user);

    if (response.status === "error") {
      return rejectWithValue(response.msg);
    }
  }
);

export const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getUsers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getUsers.fulfilled, (state, action) => {
        state.status = "success";
        state.users = action.payload;
      })
      .addCase(getUsers.rejected, (state, action) => {
        state.status = "error";
        state.message = action.payload;
      });
  },
});

export const { setUsers } = adminSlice.actions;

export const selectUsersStatus = (state) => state.admin.status;

export const selectUsers = (state) => state.admin.users;

export default adminSlice.reducer;
