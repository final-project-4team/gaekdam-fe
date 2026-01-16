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

    // 공개 페이지는 통과
    if (to.meta.public) {
        return next()
    }

    // 로그인 안 했으면 로그인으로
    if (!authStore.isLoggedIn) {
        return next({
            path: '/login',
            query: { redirect: to.fullPath },
        })
    }

    next()
})

export default router
