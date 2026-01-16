import api from "@/api/axios";

// 회원가입
export const signupApi = (data) => {
    return api.post("/auth/signup", data);
};

// 로그인
export const loginApi = (loginId, password) => {
    return api.post("/auth/login", { loginId, password });
};

// 토큰 재발급
export const refreshApi = () => api.post("/auth/refresh");

// 로그아웃
export const logoutApi = () => api.delete("/auth/logout");
