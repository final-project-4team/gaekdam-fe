import api from "../axios.js";

export const getEmployeeList = async () => {
  const res = await api.get("/employee");
  return res.data.data.content;
};


export const getEmployeeDetail = async (employeeCode) => {
  const res = await api.get("/employee/detail/"+employeeCode);
  return res.data.data;
};