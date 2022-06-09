import { axiosClient } from "../../app/axiosClient";

export function fetchAddTracing(req) {
  const { comment, record } = req;

  const tracing = {
    comment: comment.comment,
    record: record._id,
  };

  return axiosClient
    .post(`/tracings`, tracing)
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
