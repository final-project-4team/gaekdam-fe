import { createRouter, createWebHistory } from 'vue-router'
import CrmLayout from '@/layouts/CrmLayout.vue'
import ActivityLayout from '@/views/activity/ActivityLayout.vue'
import EmptyView from '@/views/dummy/EmptyView.vue'

const routes = [
    {
        path: '/',
        component: CrmLayout,
        children: [
            //  루트는 activities로만 보낸다
            { path: '', redirect: 'activities' },

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

            { path: 'reports', component: EmptyView },
            { path: 'customers', component: EmptyView },
            { path: 'voc', component: EmptyView },
            { path: 'survey', component: EmptyView },
            { path: 'messages', component: EmptyView },
            { path: 'setting', component: EmptyView },
            { path: 'system', component: EmptyView },
        ],
    },
]

export default createRouter({
    history: createWebHistory(),
    routes,
})