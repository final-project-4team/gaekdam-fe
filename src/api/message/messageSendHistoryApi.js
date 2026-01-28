import api from '@/api/axios'

export const getMessageSendHistoryApi = ({
                                             page = 1,
                                             size = 10,
                                             sort,
                                             search,
                                         }) => {
    return api.get('/message-send-histories', {
        params: {
            page,
            size,
            ...sort,
            ...search,
        },
    })
}
