import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

import CrmLayout from '@/layouts/CrmLayout.vue'
import ActivityLayout from '@/views/activity/view/ActivityLayout.vue'
import ReportLayout from '@/views/report/ReportLayout.vue'
import CustomerLayout from '@/views/customer/view/CustomerLayout.vue'
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

            { path: 'reports', 
                component: ReportLayout,
                children: [
                    { path: '', component: () => import('@/views/report/ReportLayoutView.vue') },
                ] 
            },
            
            {
                path: 'customers',
                component: CustomerLayout,
                children: [
                    { path: '', redirect: '/customers/all' },
                    { path: 'all', name: 'CustomerList', component: () => import('@/views/customer/view/CustomerListView.vue') },
                    { path: ':id', name: 'CustomerDetail', component: () => import('@/views/customer/view/CustomerDetailView.vue') },
                ],
            },

            {
                path: 'voc',
                component: VocLayout,
                children: [
                    { path: '', redirect: '/voc/inquiries' },
                    { path: 'inquiries', name: 'InquiryList', component: () => import('@/views/voc/view/InquiryListView.vue'),},
                    { path: 'incidents', name: 'IncidentList', component: () => import('@/views/voc/view/IncidentListView.vue') },
                ]
            },


                    {
                path: 'activities',
                component: ActivityLayout,
                redirect: '/activities/all',
                children: [
                    { path: 'all', component: () => import('@/views/activity/view/ActivityAllView.vue') },
                    { path: 'check', component: () => import('@/views/activity/view/ActivityCheckView.vue') },
                    { path: 'facility', component: () => import('@/views/activity/view/ActivityFacilityView.vue') },
                    { path: 'timeline', component: () => import('@/views/activity/view/ActivityTimelineView.vue') },
                ],
            },

            { path: 'messages', component: MessageLayout },


            { path: 'setting',
              component: SettingLayout,
              children:[
                { path: 'employee', component: () => import('@/views/setting/SettingEmployee.vue') },
                { path: 'objective', component: () => import('@/views/setting/SettingObjective.vue') },
                { path: 'permission', component: () => import('@/views/setting/SettingPermission.vue') },
                { path: 'membership', component: () => import('@/views/setting/SettingMembership.vue') },
                { path: 'loyalty', component: () => import('@/views/setting/SettingLoyalty.vue') },

              ]
            },
            { path: 'system',
              component: SystemLayout,
              children: [
                  {path: 'systemLog',component:()=> import('@/views/system/SystemSystemLog.vue')},
                  {path: 'myPage',component:()=> import('@/views/system/SystemMyPage.vue')}
              ]
            },

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
