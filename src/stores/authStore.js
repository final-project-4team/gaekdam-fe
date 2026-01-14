import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { jwtDecode } from 'jwt-decode';
import { loginApi, refreshApi, logoutApi } from '@/api/authApi';
import { getUserMe } from '@/api/authApi';

import router from '@/router';

export const useAuthStore = defineStore('auth', () => {

    // state
    const accessToken = ref(null);
    const user = ref(null);
    const loading = ref(false);

    // getters
    const isLoggedIn = computed(() => !!accessToken.value && !!user.value);

    const isAdmin = computed(() => {
        const role = user.value?.role;
        return role === 'ADMIN' || role === 'ROLE_ADMIN';
    });

    const username = computed(() => user.value?.username || "");

    // state setters
    const setAccessToken = (token) => {
        accessToken.value = token;
        if (token) localStorage.setItem("accessToken", token);
        else localStorage.removeItem("accessToken");
    };

    const setUser = (data) => {
        user.value = data || null;
        if (data) localStorage.setItem("user", JSON.stringify(data));
        else localStorage.removeItem("user");
    };

    // decode JWT → user 세팅
    const setUserFromToken = (token) => {
        try {
            const payload = jwtDecode(token);

            setUser({
                username: payload.sub,  // 백엔드 JWT에서 sub=email
                role: payload.role
            });

        } catch (e) {
            console.error("JWT decode 실패", e);
            setUser(null);
        }
    };

    // 새로고침 시 저장값 복원
    const loadFromStorage = () => {
        const token = localStorage.getItem("accessToken");
        const userStr = localStorage.getItem("user");

        if (token) accessToken.value = token;

        if (userStr) {
            try { user.value = JSON.parse(userStr); }
            catch { user.value = null; }
        }
    };

    // 인증 상태 초기화
    const clearAuthState = () => {
        setAccessToken(null);
        setUser(null);
        loading.value = false;
        router.push("/login");
    };


   const fetchUserMe = async () => {
     try {
       const res = await getUserMe();
       const { success, data } = res.data;

       if (!success) return;

       user.value = {
         ...user.value,
         pName: data.pname,
         role: data.role,
       };

       localStorage.setItem("user", JSON.stringify(user.value));

     } catch (e) {
       console.error("유저 정보 불러오기 실패", e);
     }
   };


    //로그인
    const login = async ({ userEmail, password }) => {
        loading.value = true;

        try {
            const res = await loginApi(userEmail, password);
            const { success, data, message } = res.data;

            if (!success) {
                return {
                    success: false,
                    message: message || "로그인 실패"
                };
            }

            // accessToken 적용
            setAccessToken(data.accessToken);
            setUserFromToken(data.accessToken);



            await fetchUserMe();

            return { success: true };

        } catch (e) {
            return {
                success: false,
                message: e.response?.data?.message || "로그인 요청 중 오류 발생"
            };
        } finally {
            loading.value = false;
        }
    };


    // 토큰 재발급
    const refreshTokens = async () => {
        try {
            const res = await refreshApi();
            const { success, data, message } = res.data;

            if (!success) throw new Error(message || "토큰 재발급 실패");

            setAccessToken(data.accessToken);
            setUserFromToken(data.accessToken);

            await fetchUserMe();

        } catch (e) {
            setAccessToken(null);
            setUser(null);
            throw e;
        }
    };


    // 로그아웃
    const logout = async () => {
        try {
            await logoutApi();
        } catch (e) {
            // 서버 에러여도 클라이언트 상태는 정리
        } finally {
            clearAuthState();
        }
    };

    return {
        accessToken,
        user,
        loading,
        isLoggedIn,
        isAdmin,
        username,

        setAccessToken,
        setUser,
        setUserFromToken,
        loadFromStorage,
        clearAuthState,

        login,
        refreshTokens,
        logout,

        fetchUserMe
    };
});