import axios from "axios";

import { store } from "./store";

export const axiosClient = axios.create({
  baseURL: "http://127.0.0.1:4000/api",
});

axiosClient.interceptors.request.use(function (config) {
  const token =
    JSON.parse(localStorage.getItem("state")).userBar.user.token ||
    store.getState().userBar.user.token;

  config.headers.Authorization = token ? `Bearer ${token}` : "";
  return config;
});
