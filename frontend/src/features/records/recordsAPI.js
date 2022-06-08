import axios from "axios";

export function fetchRecords(req) {
  const token = req;
  return axios
    .get("http://127.0.0.1:4000/api/records", {
      headers: { Authorization: `Bearer ${token}` },
    })
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
