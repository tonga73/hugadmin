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

export function fetchRemoveTracing(req) {
  return axiosClient
    .delete(`/tracings/${req}`)
    .then(({ data }) => {
      const res = {
        tracing: {},
        msg: data,
      };
      return res;
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
