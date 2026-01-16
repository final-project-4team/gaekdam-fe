// src/api/reservation/reservationApi.js
import api from "@/api/axios";

/**
 * 프론트 컬럼 key → 백엔드 정렬 컬럼명
 * MyBatis ORDER BY ${sort.sortBy}
 */
const SORT_KEY_MAP = {
    reservationCode: "reservation_code",
    reservationStatus: "reservation_status",
    checkinDate: "checkin_date",
    checkoutDate: "checkout_date",
    guestCount: "guest_count",
    reservationChannel: "reservation_channel",
    createdAt: "created_at",
};

export const getReservationListApi = ({
                                          page = 1,
                                          size = 10,

                                          // === ReservationSearchRequest ===
                                          status,
                                          reservationChannel,
                                          guestType,
                                          propertyCode,
                                          roomCode,
                                          customerCode,
                                          hasPackage,
                                          fromDate,
                                          toDate,
                                          keyword,

                                          // === SortRequest ===
                                          sortBy,
                                          direction,
                                      } = {}) => {
    return api.get("/reservations", {
        params: {
            // paging
            page,
            size,

            // search (ReservationSearchRequest)
            status: status || undefined,
            reservationChannel: reservationChannel || undefined,
            guestType: guestType || undefined,
            propertyCode: propertyCode || undefined,
            roomCode: roomCode || undefined,
            customerCode: customerCode || undefined,
            hasPackage: hasPackage ?? undefined,
            fromDate: fromDate || undefined,
            toDate: toDate || undefined,
            keyword: keyword || undefined,


            // sort (SortRequest)
            sortBy: sortBy ? SORT_KEY_MAP[sortBy] : undefined,
            direction: direction || undefined,
        },
    });
};
