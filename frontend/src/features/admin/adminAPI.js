import { axiosClient } from "../../app/axiosClient";

export function fetchGetUsers(req) {
  return axiosClient
    .get(`/users`)
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

export function fetchNewUser(req) {
  const { name, password, email, role } = req;
  return axiosClient
    .post(`/users`, [name, password, email, role])
    .then(({ data }) => {
      console.log(data);
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
