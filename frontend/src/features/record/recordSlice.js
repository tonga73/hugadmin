import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  fetchGetRecord,
  fetchNewRecord,
  fetchEditRecord,
  fetchRemoveRecord,
} from "./recordAPI";

import { getRecords } from "../records/recordsSlice";

const initialState = {
  status: "",
  message: "",
  record: {},
  tracings: [],
};

export const getRecord = createAsyncThunk(
  "record/fetchGetRecord",
  async (recordId, { rejectWithValue, dispatch }) => {
    const response = await fetchGetRecord(recordId);

    if (response.status === "error") {
      return rejectWithValue(response.msg);
    }

    dispatch(setRecord({ status: "", record: response.record }));
    return response.tracings;
  }
);

export const newRecord = createAsyncThunk(
  "record/fetchNewRecord",
  async (record, { rejectWithValue, dispatch }) => {
    const response = await fetchNewRecord(record);

    if (response.status === "error") {
      return rejectWithValue(response.msg);
    }
    dispatch(getRecords());
  }
);

export const editRecord = createAsyncThunk(
  "record/fetchEditRecord",
  async (record, { rejectWithValue }) => {
    const response = await fetchEditRecord(record);

    if (response.status === "error") {
      return rejectWithValue(response.msg);
    }
    console.log(response);
  }
);

export const removeRecord = createAsyncThunk(
  "record/fetchRemoveRecord",
  async (record, { rejectWithValue, dispatch }) => {
    const response = await fetchRemoveRecord(record);

    if (response.status === "error") {
      return rejectWithValue(response.msg);
    }

    dispatch(setRecord({ status: "removeSuccess" }));
  }
);

export const recordSlice = createSlice({
  name: "record",
  initialState,
  reducers: {
    setRecord: (state, action) => {
      state.status = action.payload.status || initialState.status;
      state.record = action.payload.record || initialState.record;
    },
    updateTracings: (state, action) => {
      state.tracings = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getRecords.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getRecords.fulfilled, (state, action) => {
        state.status = initialState.status;
        state.record = action.payload[0] || {};
      })
      .addCase(getRecords.rejected, (state, action) => {
        state.status = initialState.status;
        state.message = action.payload;
      });
  },
});

export const { updateTracings, setRecord } = recordSlice.actions;

export const selectRecordStatus = (state) => state.record.status;

export const selectRecord = (state) => state.record.record;

export const selectTracings = (state) => state.record.tracings;

export default recordSlice.reducer;
