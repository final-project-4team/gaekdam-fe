import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { useLoadingStore } from "@/stores/loading"; // 전역 로딩 스토어

// ========== axios instance ==========
const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE}/api/v1`, // /api/v1
    withCredentials: true,
});

// ========== Request: 토큰 자동 포함 + 전역 로딩 시작 ==========
api.interceptors.request.use(
    (config) => {
        const authStore = useAuthStore();
        const loadingStore = useLoadingStore();

        // 전역 로딩 시작 (옵션으로 스킵 가능)
        if (!config.skipLoading) {
            loadingStore.start();
        }

        // login, signup, 인증 요청 → Authorization 제거
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
    (error) => {
        // 요청 단계 에러 시 로딩 종료
        const loadingStore = useLoadingStore();
        loadingStore.end();
        return Promise.reject(error);
    }
);

// ========== Response: 자동 재발급 + 전역 로딩 종료 ==========
let isRefreshing = false;

api.interceptors.response.use(
    (response) => {
        // 정상 응답 시 로딩 종료
        const loadingStore = useLoadingStore();
        loadingStore.end();

        // ApiResponse success=false → 에러 처리
        if (response.data?.success === false) {
            const err = new Error(response.data.message || "요청 실패");
            err.response = response;
            throw err;
        }

        return response;
    },

    async (error) => {
        const loadingStore = useLoadingStore();
        const authStore = useAuthStore();
        const toastStore = useToastStore();
        const originalRequest = error.config;

        // 에러 응답 시 로딩 종료
        loadingStore.end();

        if (!error.response) return Promise.reject(error);
        const status = error.response.status;

        // 401 이외는 그대로 에러 처리
        if (status !== 401) return Promise.reject(error);

        // auth 요청은 refresh 대상 제외
        if (originalRequest.url.includes("/api/v1/auth/")) {
            return Promise.reject(error);
        }

        // 토큰 없으면 실패
        if (!authStore.accessToken) return Promise.reject(error);

        // 중복 재시도 방지
        if (originalRequest._retry) return Promise.reject(error);
        if (isRefreshing) return Promise.reject(error);

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            // refresh 중에는 로딩 다시 안 띄우기
            originalRequest.skipLoading = true;

            // refreshToken으로 accessToken 재발급
            await authStore.refreshTokens();
            isRefreshing = false;

            // 재발급한 토큰으로 재요청
            originalRequest.headers.Authorization =
                `Bearer ${authStore.accessToken}`;

            return api(originalRequest);

        } catch (err) {
            isRefreshing = false;
            loadingStore.reset()
            authStore.clearAuthState();
            return Promise.reject(err);
        }
    }
);

export default api;
