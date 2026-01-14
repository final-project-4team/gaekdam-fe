import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

// ========== axios instance ==========
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE, // /api/v1
    withCredentials: true,
});

// ========== Request: 토큰 자동 포함 ==========
api.interceptors.request.use(
    (config) => {
        const authStore = useAuthStore();

        // login, signup, email 인증 → Authorization 제거
        if (
            config.url.includes("/auth/login") ||
            config.url.includes("/auth/signup") ||
            config.url.includes("/auth/sms") ||
            config.url.includes("/auth/business")
        ) {
            config.headers.Authorization = null;
            return config;
        }

        // refresh 요청은 토큰 제거
        if (config.url.includes("/auth/refresh")) {
            config.headers.Authorization = null;
            return config;
        }

        // 인증 생략 옵션
        if (config.skipAuth) return config;

        // 일반 요청은 access token 자동 포함
        if (authStore.accessToken && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${authStore.accessToken}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// ========== Response 처리를 통한 자동 재발급 ==========
let isRefreshing = false;

api.interceptors.response.use(
    (response) => {
        // ApiResponse success=false → 에러 처리
        if (response.data?.success === false) {
            const err = new Error(response.data.message || "요청 실패");
            err.response = response;
            throw err;
        }
        return response;
    },

    async (error) => {
        const authStore = useAuthStore();
        const originalRequest = error.config;

        if (!error.response) return Promise.reject(error);
        const status = error.response.status;

        // 401 이외는 그냥 에러 그대로 던짐
        if (status !== 401) return Promise.reject(error);

        // auth 요청(로그인/회원가입/인증)은 refresh 대상에서 제외
        if (originalRequest.url.includes("/api/v1/auth/")) {
            return Promise.reject(error);
        }

        // 토큰 없으면 그냥 실패 처리
        if (!authStore.accessToken) return Promise.reject(error);

        // 이미 재시도 중이면 중복 방지
        if (originalRequest._retry) return Promise.reject(error);
        if (isRefreshing) return Promise.reject(error);

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            // refreshToken 으로 accessToken 재발급
            await authStore.refreshTokens();
            isRefreshing = false;

            // 재발급한 토큰 넣고 요청 재시도
            originalRequest.headers.Authorization = `Bearer ${authStore.accessToken}`;
            return api(originalRequest);

        } catch (err) {
            isRefreshing = false;
            authStore.clearAuthState();
            return Promise.reject(err);
        }
    }
);

export default api;