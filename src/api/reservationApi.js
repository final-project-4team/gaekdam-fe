import axios from './axios'

export const getReservations = (params) => {
  return axios.get('/reservations', { params })
}

export const getReservationDetail = (reservationCode) => {
  return axios.get(`/reservations/${reservationCode}`)
}