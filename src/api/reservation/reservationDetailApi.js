import api from "@/api/axios";

/**
 * 예약 통합 상세 조회
 * GET /api/v1/reservations/detail/{reservationCode}
 */
export const getReservationDetailApi = (reservationCode) => {
    return api.get(`/reservations/detail/${reservationCode}`);
};