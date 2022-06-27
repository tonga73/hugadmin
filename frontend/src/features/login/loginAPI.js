import { axiosClient } from "../../app/axiosClient";

export function fetchLogin(req) {
  return axiosClient
    .post("/users/login", req)
    .then(({ data }) => {
      return data;
    })
    .catch((err) => {
      const { msg } = err.response.data;
      const res = {
        status: "error",
        msg,
      };
      return res;
    });
}
