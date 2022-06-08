import axios from "axios";

export function fetchLogin(req) {
  return axios
    .post("http://127.0.0.1:4000/api/users/login", req)
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
