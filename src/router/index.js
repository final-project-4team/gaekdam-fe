import { createRouter, createWebHistory } from 'vue-router'
import CrmLayout from '@/layouts/CrmLayout.vue'
import ActivityLayout from '@/views/activity/ActivityLayout.vue'
import ReportLayout from "@/views/report/ReportLayout.vue";
import CustomerLayout from "@/views/customer/CustomerLayout.vue";
import MessageLayout from "@/views/message/MessageLayout.vue";
import SettingLayout from "@/views/setting/SettingLayout.vue";
import SystemLayout from "@/views/system/SystemLayout.vue";
import VocLayout from "@/views/voc/VocLayout.vue";
import TestView from "@/views/TestView.vue";

const routes = [
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

export default createRouter({
    history: createWebHistory(),
    routes,
})