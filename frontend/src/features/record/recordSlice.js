import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { fetchRecord } from "./recordAPI";

const initialState = {
  status: "",
  record: {},
  tracings: [],
};

export const getRecord = createAsyncThunk(
  "record/fetchRecord",
  async (recordId, { rejectWithValue }) => {
    const response = await fetchRecord(recordId);

    if (response.status === "error") {
      return rejectWithValue(response.msg);
    }

    return response;
  }
);

export const recordSlice = createSlice({
  name: "record",
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(getRecord.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getRecord.fulfilled, (state, action) => {
        state.status = "success";
        state.record = action.payload.record;
        state.tracings = action.payload.tracings;
      })
      .addCase(getRecord.rejected, (state, action) => {
        state.status = "error";
        state.message = action.payload;
      });
  },
});

export const selectRecord = (state) => state.record.record;

export default recordSlice.reducer;
