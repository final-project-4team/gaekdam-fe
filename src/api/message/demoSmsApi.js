import api from '@/api/axios'

export const sendDemoSmsApi = ({
                                   reservationCode,
                                   stageCode,
                                   templateCode,
                                   toPhone,
                               }) => {
    return api.post('/api/v1/demo/sms/send', {
        reservationCode,
        stageCode,
        templateCode,
        toPhone,
    })

}
