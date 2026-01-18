import api from '@/api/axios'

/**
 * 프론트 컬럼 key → 백엔드 정렬 컬럼 (t alias 기준)
 */
const OPERATION_SORT_KEY_MAP = {
    reservationNo: 't.reservationCode',
    propertyName: 't.propertyName',
    customerName: 't.customerNameHash',
    roomType: 't.roomType',
    checkinDate: 't.plannedCheckinDate',
    checkoutDate: 't.plannedCheckoutDate',
    status: 't.operationStatus',
}

/**
 * 운영 보드 조회 API
 *
 * summaryType:
 * - ALL_TODAY
 * - TODAY_CHECKIN
 * - TODAY_CHECKOUT
 * - STAYING
 */
export const getOperationBoardApi = ({
                                         page = 1,
                                         size = 10,


                                         filters = {},
                                         detail = {},
                                         sort = {},

                                         // 요약 카드 타입
                                         summaryType,
                                     }) => {
    return api.get('/reservations/operations', {
        params: {
            page,
            size,

            /* =====================
             * Summary (상단 카드 클릭)
             * ===================== */
            summaryType: summaryType ?? undefined,

            /* =====================
             * Filters
             * ===================== */
            propertyCode:
                filters.propertyCode !== null && filters.propertyCode !== ''
                    ? filters.propertyCode
                    : undefined,

            status:
                filters.status !== null && filters.status !== ''
                    ? filters.status
                    : undefined,

            /* =====================
             * Detail Search
             * ===================== */
            customerName:
                detail.customerName && detail.customerName.trim() !== ''
                    ? detail.customerName
                    : undefined,

            reservationCode:
                detail.reservationCode != null && detail.reservationCode !== ''
                    ? Number(detail.reservationCode)
                    : undefined,

            /* =====================
             * Sort
             * ===================== */
            sortBy:
                sort.sortBy && OPERATION_SORT_KEY_MAP[sort.sortBy]
                    ? OPERATION_SORT_KEY_MAP[sort.sortBy]
                    : undefined,

            direction: sort.direction || undefined,
        },
    })
}
