import axios from "axios";

import { store } from "./store";

export const axiosClient = axios.create({
  baseURL: process.env.REACT_APP_REST,
});

axiosClient.interceptors.request.use(function (config) {
  const token =
    JSON.parse(localStorage.getItem("state")).userBar.user.token ||
    store.getState().userBar.user.token;

  config.headers.Authorization = token ? `Bearer ${token}` : "";
  return config;
});
