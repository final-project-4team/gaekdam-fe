import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

import CrmLayout from '@/layouts/CrmLayout.vue'
import ActivityLayout from '@/views/activity/ActivityLayout.vue'
import ReportLayout from '@/views/report/ReportLayout.vue'
import CustomerLayout from '@/views/customer/CustomerLayout.vue'
import MessageLayout from '@/views/message/MessageLayout.vue'
import SettingLayout from '@/views/setting/SettingLayout.vue'
import SystemLayout from '@/views/system/SystemLayout.vue'
import VocLayout from '@/views/voc/VocLayout.vue'
import TestView from '@/views/TestView.vue'
import LoginView from '@/views/auth/LoginView.vue'

/* ===================== */
/* Routes */
/* ===================== */
const routes = [
    {
        path: '/login',
        component: LoginView,
        meta: { public: true }, // 인증 예외
    },

    {
        path: '/',
        component: CrmLayout,
        children: [
            { path: '', component: TestView },

            { path: 'reports', component: ReportLayout },
            { path: 'customers', component: CustomerLayout },

            {
                path: 'activities',
                component: ActivityLayout,
                redirect: '/activities/all',
                children: [
                    { path: 'all', component: () => import('@/views/activity/ActivityAllView.vue') },
                    { path: 'check', component: () => import('@/views/activity/ActivityCheckView.vue') },
                    { path: 'facility', component: () => import('@/views/activity/ActivityFacilityView.vue') },
                    { path: 'timeline', component: () => import('@/views/activity/ActivityTimelineView.vue') },
                ],
            },

            { path: 'voc', component: VocLayout },
            { path: 'messages', component: MessageLayout },
            { path: 'setting', component: SettingLayout },
            { path: 'system', component: SystemLayout },
        ],
    },
]

/* ===================== */
/* Router instance */
/* ===================== */
const router = createRouter({
    history: createWebHistory(),
    routes,
})

/* ===================== */
/* Auth Guard */
/* ===================== */
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()

    // 로그인 상태인데 /login 접근 → 메인으로
    if (to.path === '/login' && authStore.isLoggedIn) {
        return next('/')
    }

    // 로그인 페이지는 비로그인 상태에서만 허용
    if (to.path === '/login') {
        return next()
    }

    // 로그인 안 했으면 CRM 접근 불가
    if (!authStore.isLoggedIn) {
        return next({
            path: '/login',
            query: { redirect: to.fullPath },
        })
    }

    next()
})


export default router
