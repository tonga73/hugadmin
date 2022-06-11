import { axiosClient } from "../../app/axiosClient";

export function fetchGetLocations() {
  return axiosClient
    .get("/locations")
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
