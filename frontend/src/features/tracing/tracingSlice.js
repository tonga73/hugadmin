import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { fetchAddTracing, fetchRemoveTracing } from "./tracingAPI";

import { updateTracings } from "../record/recordSlice";

const initialState = {
  status: "",
  tracing: {},
};

export const addTracing = createAsyncThunk(
  "tracing/fetchAddTracing",
  async (tracing, { rejectWithValue, dispatch }) => {
    const response = await fetchAddTracing(tracing);

    if (response.status === "error") {
      return rejectWithValue(response.msg);
    }

    dispatch(updateTracings([]));
    dispatch(setTracingStatus("success"));
  }
);

export const removeTracing = createAsyncThunk(
  "tracing/fetchRemoveTracing",
  async (tracing, { rejectWithValue, dispatch }) => {
    const response = await fetchRemoveTracing(tracing);

    if (response.status === "error") {
      return rejectWithValue(response.msg);
    }

    dispatch(updateTracings([]));
    return response;
  }
);

export const tracingSlice = createSlice({
  name: "tracing",
  initialState,
  reducers: {
    setTracingStatus: (state, action) => {
      state.status = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(removeTracing.pending, (state) => {
        state.status = "loading";
      })
      .addCase(removeTracing.fulfilled, (state, action) => {
        state.status = "success";
        state.tracing = action.payload.tracing;
      })
      .addCase(removeTracing.rejected, (state, action) => {
        state.status = "error";
        state.message = action.payload;
      });
  },
});

export const { setTracingStatus } = tracingSlice.actions;

export const selectTracingStatus = (state) => state.tracing.status;

export default tracingSlice.reducer;
