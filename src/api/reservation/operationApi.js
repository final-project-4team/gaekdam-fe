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

export const getOperationBoardApi = ({
                                         page = 1,
                                         size = 10,
                                         filters = {},
                                         detail = {},
                                         sort = {},
                                     }) => {
    return api.get('/reservations/operations', {
        params: {
            page,
            size,

            // filter
            propertyCode:
                filters.propertyCode !== null && filters.propertyCode !== ''
                    ? filters.propertyCode
                    : undefined,

            status:
                filters.status !== null && filters.status !== ''
                    ? filters.status
                    : undefined,


            customerName: detail.customerName || undefined,

            reservationCode:
                detail.reservationCode != null
                    ? Number(detail.reservationCode)
                    : undefined,

            // sort
            sortBy:
                sort.sortBy && OPERATION_SORT_KEY_MAP[sort.sortBy]
                    ? OPERATION_SORT_KEY_MAP[sort.sortBy]
                    : undefined,

            direction: sort.direction || undefined,
        },

    })
}
