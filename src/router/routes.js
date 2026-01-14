import DefaultLayout from '@/layouts/DefaultLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

export const routes = [

  {
    path: '/login',
    component: AuthLayout,
    children: [
      { path: '', name: 'login', component: () => import('@/views/auth/LoginView.vue') },
    ],
  },

  {
    path: '/',
    component: DefaultLayout,
    children: [
      { path: '', redirect: '/reservations' },
      { path: 'reservations', name: 'reservations', component: () => import('@/views/reservation/ReservationListView.vue') },
      { path: 'reservations/:reservationCode', name: 'reservationDetail', component: () => import('@/views/reservation/ReservationDetailView.vue') },
      { path: 'timeline/:stayCode', name: 'timeline', component: () => import('@/views/timeline/TimelineView.vue') },
    ],
  },

]