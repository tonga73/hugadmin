import axios from "axios";

export const axiosClient = axios.create({
  baseURL: "http://127.0.0.1:4000/api",
});

axiosClient.interceptors.request.use(function (config) {
  const token = JSON.parse(localStorage.getItem("state")).userBar.user.token;

  config.headers.Authorization = token ? `Bearer ${token}` : "";
  return config;
});
