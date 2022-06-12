import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { useSelector } from "react-redux";

import { fetchAddTracing, fetchRemoveTracing } from "./tracingsAPI";

import { getRecord, updateTracings } from "../record/recordSlice";

const initialState = {
  status: "",
  tracings: [],
  message: "",
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

export const tracingsSlice = createSlice({
  name: "tracings",
  initialState,
  reducers: {
    setTracingStatus: (state, action) => {
      state.status = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getRecord.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getRecord.fulfilled, (state, action) => {
        state.status = "success";
        state.tracings = action.payload;
      })
      .addCase(getRecord.rejected, (state, action) => {
        state.status = "error";
        state.message = action.payload;
      });
  },
});

export const { setTracingStatus } = tracingsSlice.actions;

export const selectTracings = (state) => state.tracings.tracings;

export const selectTracingsStatus = (state) => state.tracings.status;

export default tracingsSlice.reducer;
