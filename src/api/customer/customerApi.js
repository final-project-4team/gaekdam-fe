import api from "@/api/axios";

// 고객 목록 조회
export const getCustomerListApi = (params) => {
    return api.get("/customers", { params });
};




