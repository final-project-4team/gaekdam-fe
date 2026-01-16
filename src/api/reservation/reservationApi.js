// src/api/reservation/reservationApi.js
import api from "@/api/axios";

/**
 * 프론트 컬럼 key → 백엔드 정렬 컬럼명 매핑
 */
const SORT_KEY_MAP = {
    reservationNo: "reservation_no",
    customerName: "customer_name",
    roomType: "room_type",
    checkinDate: "checkin_date",
    checkoutDate: "checkout_date",
    status: "status",
    createdAt: "created_at",
};

/**
 * 예약 리스트 조회 API
 */
export const getReservationListApi = ({
                                          page = 1,
                                          size = 10,

                                          keyword = "",
                                          searchType = "",

                                          filters = {},
                                          detail = {},

                                          sort = {},
                                      }) => {
    return api.get("/reservations", {
        params: {
            // paging
            page,
            size,

            // search
            keyword,
            searchType,

            // filter
            status: filters.status,
            roomType: filters.roomType,

            // detail search
            customerName: detail.customerName,
            reservationNo: detail.reservationNo,

            // sort
            sortBy: sort.sortBy ? SORT_KEY_MAP[sort.sortBy] : undefined,
            direction: sort.direction,
        },
    });
};
