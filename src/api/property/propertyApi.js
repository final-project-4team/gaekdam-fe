import api from "@/api/axios";

export const getMyPropertyApi = () => {
    return api.get("/property/me");
};