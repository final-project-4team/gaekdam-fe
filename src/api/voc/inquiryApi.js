import api from "@/api/axios";

// 문의 목록
export const getInquiryListApi = (params) => {
    return api.get("/inquiries", { params });
};

// 문의 상세
export const getInquiryDetailApi = (inquiryCode) => {
    return api.get(`/inquiries/${inquiryCode}`);
};
