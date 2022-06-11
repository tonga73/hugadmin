import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { fetchGetRecords } from "./adminAPI";

const initialState = {
  status: "",
  record: {},
  tracings: [],
};

export const getRecords = createAsyncThunk(
  "records/fetchGetRecords",
  async ({ rejectWithValue }) => {
    const response = await fetchGetRecords();

    if (response.status === "error") {
      return rejectWithValue(response.msg);
    }

    return response;
  }
);

export const recordsSlice = createSlice({
  name: "records",
  initialState,
  reducers: {
    setRecords: (state, action) => {
      state.status = action.payload.status;
      state.record = action.payload.record || state.record;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getRecords.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getRecords.fulfilled, (state, action) => {
        state.status = "success";
        state.record = action.payload.record;
        state.tracings = action.payload.tracings.reverse();
      })
      .addCase(getRecords.rejected, (state, action) => {
        state.status = "error";
        state.message = action.payload;
      });
  },
});

export const { updateTracings, setRecord } = recordsSlice.actions;

export const selectRecordsStatus = (state) => state.records.status;

export const selectRecords = (state) => state.records.record;

export default recordsSlice.reducer;
