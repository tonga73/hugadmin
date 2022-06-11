import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { fetchGetLocations } from "./locationsManagerAPI";

const initialState = {
  status: "",
  locations: [],
};

export const getLocations = createAsyncThunk(
  "locationsManager/fetchGetLocations",
  async ({ rejectWithValue }) => {
    const response = await fetchGetLocations();

    if (response.status === "error") {
      return rejectWithValue(response.msg);
    }

    return response;
  }
);

export const locationsManager = createSlice({
  name: "locationsManager",
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(getLocations.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getLocations.fulfilled, (state, action) => {
        state.status = "success";
        state.locations = action.payload;
      })
      .addCase(getLocations.rejected, (state, action) => {
        state.status = "error";
      });
  },
});

export const {} = locationsManager.actions;

export const selectLocationsManagerStatus = (state) =>
  state.locationsManager.status;

export const selectLocationsManager = (state) =>
  state.locationsManager.locations;

export default locationsManager.reducer;
