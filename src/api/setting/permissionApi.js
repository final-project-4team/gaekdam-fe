import api from "@/api/axios.js";

export const getPermissionList = async () => {
  const res = await api.get("/permission");
  return res.data.data;
};


export const createPermission = async (permissionDetail) => {
  const res = await api.post("/permission", permissionDetail);
  return res.data.data;
};

export const updatePermission = async (permissionDetail,permissionTypeList) => {
  const res = await api.put("/permission/" +permissionDetail,  permissionTypeList);
  return res.data.data;
};

export const deletePermission = async (permissionCode) => {
  const res = await api.delete("/permission/" + permissionCode);
  return res.data.data;
};