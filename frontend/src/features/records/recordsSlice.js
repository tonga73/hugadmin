import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { fetchRecords } from "./recordsAPI";

const initialState = {
  status: "",
  records: [],
};

export const getRecords = createAsyncThunk(
  "records/fetchRecords",
  async (user, { rejectWithValue }) => {
    const response = await fetchRecords(user);

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
    decrement: (state) => {
      state.value -= 1;
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

export const selectRecords = (state) => state.records.records;

export const getRecord = (record) => (dispatch, getState) => {
  const records = selectRecords(getState());
  console.log(record);
};

export default recordsSlice.reducer;
