import api from "@/api/axios";

/**
 * 오늘 예약 요약
 * - 전체
 * - 체크인 예정
 * - 체크아웃 예정
 * - 현재 투숙
 */
export const getTodayReservationSummaryApi = ({ propertyCode } = {}) => {
    return api.get("/reservations/today/summary", {
        params: {
            propertyCode: propertyCode ?? undefined,
        },
    });
};
