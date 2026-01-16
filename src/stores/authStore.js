import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { jwtDecode } from "jwt-decode";
import { loginApi, refreshApi, logoutApi } from "@/api/auth/authApi";
import router from "@/router";
import {getMyPropertyApi} from "@/api/property/propertyApi.js";

export const useAuthStore = defineStore("auth", () => {

    /* ===================== */
    /* state */
    /* ===================== */
    const accessToken = ref(null);
    const user = ref(null);
    const loading = ref(false);
    const hotel = ref(null);

    /* ===================== */
    /* getters */
    /* ===================== */
    const isLoggedIn = computed(() => !!accessToken.value);

    const hasAuthority = (authority) =>
        computed(() => user.value?.authorities?.includes(authority));

    /* ===================== */
    /* setters */
    /* ===================== */
    const setAccessToken = (token) => {
        accessToken.value = token;
        if (token) localStorage.setItem("accessToken", token);
        else localStorage.removeItem("accessToken");
    };

    const setUser = (data) => {
        user.value = data;
        if (data) localStorage.setItem("user", JSON.stringify(data));
        else localStorage.removeItem("user");
    };

    /* ===================== */
    /* JWT → user */
    /* ===================== */
    const setUserFromToken = (token) => {
        try {
            const payload = jwtDecode(token);

            setUser({
                loginId: payload.sub,
                authorities: [payload.role],     // permissionName
                hotelGroupCode: payload.hotelGroupCode,
                propertyCode: payload.propertyCode,
            });

        } catch (e) {
            console.error("JWT decode 실패", e);
            setUser(null);
        }
    };

    /* ===================== */
    /* storage 복원 */
    /* ===================== */
    const loadFromStorage = () => {
        const token = localStorage.getItem("accessToken");
        const userStr = localStorage.getItem("user");

        if (token) accessToken.value = token;
        if (userStr) user.value = JSON.parse(userStr);
    };

    /* ===================== */
    /* login */
    /* ===================== */
    const login = async ({ loginId, password }) => {
        loading.value = true;
        try {
            const res = await loginApi(loginId, password);
            const { success, data } = res.data;
            if (!success) throw new Error();

            setAccessToken(data.accessToken);
            setUserFromToken(data.accessToken);
            await fetchMyHotel();

            return { success: true };
        } catch (e) {
            return { success: false };
        } finally {
            loading.value = false;
        }
    };

    const fetchMyHotel = async () => {
        try {
            const res = await getMyPropertyApi();
            hotel.value = res.data.data;
        } catch (e) {
            console.error("호텔 정보 조회 실패", e);
            hotel.value = null;
        }
    };


    /* ===================== */
    /* refresh */
    /* ===================== */
    const refreshTokens = async () => {
        const res = await refreshApi();
        const { data } = res.data;

        setAccessToken(data.accessToken);
        setUserFromToken(data.accessToken);
    };

    /* ===================== */
    /* logout */
    /* ===================== */
    const logout = async () => {
        try {
            await logoutApi();
        } finally {
            clearAuthState();
        }
    };

    const clearAuthState = () => {
        setAccessToken(null);
        setUser(null);
        hotel.value = null;
        router.push("/login");
    };

    return {
        accessToken,
        user,
        hotel,
        loading,

        isLoggedIn,
        hasAuthority,

        login,
        refreshTokens,
        logout,

        loadFromStorage,
        clearAuthState,
    };
});
