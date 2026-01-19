import api from "@/api/axios";

// 고객 목록 조회
export const getCustomerListApi = (params) => {
    return api.get("/customers", { params });
};

// 고객 상세
export const getCustomerDetailApi = ({ customerCode, hotelGroupCode }) => {
    return api.get(`/customers/${customerCode}`, { params: { hotelGroupCode } });
};

// 고객 스냅샷
export const getCustomerSnapshotApi = ({ customerCode, hotelGroupCode }) => {
    return api.get(`/customers/${customerCode}/snapshot`, {
        params: { hotelGroupCode },
    });
};

// 고객 타임라인
export const getCustomerTimelineApi = ({ customerCode, hotelGroupCode, limit = 50 }) => {
    return api.get(`/customers/${customerCode}/timeline`, {
        params: { hotelGroupCode, limit },
    });
};


