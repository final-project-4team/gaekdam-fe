import api from "@/api/axios";

// 비밀번호 변경
export const changePassword = (data) => {
    return api.post("/auth/password", data);
};
