import api from "../axios.js";

export const getEmployeeList = async ({
  page = 1,
  size = 10,
  filters = {},
  detail = {},
  sort = {},
} = {}) => {
  const res = await api.get("/employee", {
    params: {
      page,
      size,


      employeeStatus: filters.employeeStatus || undefined,


      // DTO: name, phone, email, departmentName, hotelPositionName, employeeStatus

      // keyword(전체검색) or employeeName -> name
      name: detail.employeeName || detail.keyword || undefined,

      // employeeNumber -> DTO에 없음(User request 기준), 일단 보냄 or 제외? 
      // User가 employeeNumber를 언급 안했으나 View엔 있음. DTO에 없으면 무시됨. 유지.
      employeeNumber: detail.employeeNumber || undefined,

      departmentName: detail.departmentName || undefined,
      hotelPositionName: detail.hotelPositionName || undefined,

      // phoneNumber -> phone
      phone: detail.phoneNumber || undefined,

      email: detail.email || undefined,


      sortBy: sort.sortBy || undefined,
      direction: sort.direction || undefined,
    },
  });
  return res.data.data;
};


export const getEmployeeDetail = async (employeeCode, reason) => {
  const res = await api.get("/employee/detail/" + employeeCode, {
    params: { reason }
  });
  return res.data.data;
};
export const getMyPage = async () => {
  const res = await api.get("/employee/detail");
  return res.data.data;
};

export const updateEmployeeStatus = async (employeeCode, status) => {
  const res = await api.put(`/employee/${employeeCode}/status`, null, {
    params: { status }
  });
  return res.data;
};

export const lockEmployee = async (employeeCode) => {
  const res = await api.patch(`/employee/lock/${employeeCode}`);
  return res.data;
};
export const unlockEmployee = async (employeeCode) => {
  const res = await api.patch(`/employee/unlock/${employeeCode}`);
  return res.data;
};

export const inactiveEmployee = async (employeeCode) => {
  const res = await api.patch(`/employee/inactive/${employeeCode}`);
  return res.data;
};
export const resetEmployeePassword = async (employeeCode) => {
  const res = await api.patch(`/employee/password-reset/${employeeCode}`);
  return res.data;
};

export const updateEmployee = async (employeeCode, data) => {
  const res = await api.put(`/employee/${employeeCode}`, data);
  return res.data;
};

export const createEmployee = async (data) => {
  const res = await api.post("/employee/add", data);
  return res.data;
};

export const getDepartmentList = async () => {
  const res = await api.get("/department");
  return res.data.data;
};

export const getHotelPositionList = async () => {
  const res = await api.get("/position");
  return res.data.data;
};