import { axiosClient } from "../../app/axiosClient";

export function fetchRecords(req) {
  return axiosClient
    .get("/records")
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
