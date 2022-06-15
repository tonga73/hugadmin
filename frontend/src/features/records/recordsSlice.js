import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { fetchRecords } from "./recordsAPI";

const initialState = {
  status: "",
  message: "",
  records: [],
};

export const getRecords = createAsyncThunk(
  "records/fetchRecords",
  async (user, { rejectWithValue }) => {
    const response = await fetchRecords(user);

    if (response.status === "error") {
      return rejectWithValue(response.msg);
    }

    if (response.length <= 0) {
      return initialState.records;
    }

    return response.reverse();
  }
);

export const recordsSlice = createSlice({
  name: "records",
  initialState,
  reducers: {
    setRecords: (state, action) => {
      state.status = action.payload.status;
      state.records = action.payload.records || state.records;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getRecords.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getRecords.fulfilled, (state, action) => {
        state.status = "success";
        state.records = action.payload;
      })
      .addCase(getRecords.rejected, (state, action) => {
        state.status = "error";
        state.message = action.payload;
      });
  },
});

export const { setRecords } = recordsSlice.actions;

export const selectRecordsStatus = (state) => state.records.status;

export const selectRecords = (state) => state.records.records;

export default recordsSlice.reducer;
