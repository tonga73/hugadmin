import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { fetchAddTracing } from "./tracingAPI";

const initialState = {
  status: "",
  tracing: "",
};

export const addTracing = createAsyncThunk(
  "tracing/fetchAddTracing",
  async (tracing, { rejectWithValue }) => {
    const response = await fetchAddTracing(tracing);

    if (response.status === "error") {
      return rejectWithValue(response.msg);
    }

    return;
  }
);

export const tracingSlice = createSlice({
  name: "tracing",
  initialState,
});

export default tracingSlice.reducer;
