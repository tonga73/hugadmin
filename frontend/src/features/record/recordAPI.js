import { axiosClient } from "../../app/axiosClient";

export function fetchRecord(req) {
  const id = req;
  return axiosClient
    .get(`/records/${id}`)
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
