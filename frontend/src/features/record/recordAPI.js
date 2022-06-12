import { axiosClient } from "../../app/axiosClient";

import { delay } from "../../app/helpers/delay";

export async function fetchGetRecord(req) {
  const id = await req;
  if (req === undefined) {
    return;
  }

  return axiosClient
    .get(`/records/${id}`)
    .then(({ data }) => {
      console.log(data);
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

export function fetchAddRecord(req) {
  console.log(req);
  // return axiosClient
  //   .post(`/records`, req)
  //   .then(({ data }) => {
  //     return data;
  //   })
  //   .catch((err) => {
  //     const { msg } = err.response.data;
  //     const res = {
  //       status: "error",
  //       msg,
  //     };
  //     return res;
  //   });
}

export function fetchEditRecord(req) {
  let id;
  console.log(req);
  // return axiosClient
  //   .put(`/records/${id}`, req)
  //   .then(({ data }) => {
  //     return data;
  //   })
  //   .catch((err) => {
  //     const { msg } = err.response.data;
  //     const res = {
  //       status: "error",
  //       msg,
  //     };
  //     return res;
  //   });
}
