import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { fetchGetRecord, fetchAddRecord, fetchEditRecord } from "./recordAPI";

import { store } from "../../app/store";

const initialState = {
  status: "",
  record: {},
  tracings: [],
};

export const getRecord = createAsyncThunk(
  "record/fetchGetRecord",
  async (recordId, { rejectWithValue, useSelector }) => {
    const response = await fetchGetRecord(
      recordId || store.getState().records.records[0]._id
    );

    if (response.status === "error") {
      return rejectWithValue(response.msg);
    }

    return response;
  }
);

export const addRecord = createAsyncThunk(
  "record/fetchEditRecord",
  async (record, { rejectWithValue }) => {
    const response = await fetchAddRecord(record);

    if (response.status === "error") {
      return rejectWithValue(response.msg);
    }
    console.log(response);
  }
);

export const editRecord = createAsyncThunk(
  "record/fetchAddRecord",
  async (record, { rejectWithValue }) => {
    const response = await fetchAddRecord(record);

    if (response.status === "error") {
      return rejectWithValue(response.msg);
    }
    console.log(response);
  }
);

export const recordSlice = createSlice({
  name: "record",
  initialState,
  reducers: {
    setRecord: (state, action) => {
      state.status = action.payload.status;
      state.record = action.payload.record || state.record;
    },
    updateTracings: (state, action) => {
      state.tracings = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getRecord.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getRecord.fulfilled, (state, action) => {
        state.status = "success";
        state.record = action.payload.record;
        state.tracings = action.payload.tracings.reverse();
      })
      .addCase(getRecord.rejected, (state, action) => {
        state.status = "error";
        state.message = action.payload;
      });
  },
});

export const { updateTracings, setRecord } = recordSlice.actions;

export const selectRecordStatus = (state) => state.record.status;

export const selectRecord = (state) => state.record.record;

export const selectTracings = (state) => state.record.tracings;

export default recordSlice.reducer;
