// src/views/customer/composables/useCustomerDetailPage.js
import { computed, ref } from "vue";
import {
    getCustomerDetailApi,
    getCustomerSnapshotApi,
    getCustomerTimelineApi,
} from "@/api/customer/customerDetailApi.js";
import { getInquiryListApi } from "@/api/voc/inquiryApi.js";
import { formatDate, formatPhone } from "@/views/customer/utils/customerDetail.utils.js";

export const useCustomerDetailPage = ({ hotelGroupCode, customerCode } = {}) => {
    const detail = ref({
        customerCode: null,
        customerName: "",
        status: "",
        nationalityType: "",
        contractType: "",
        inflowChannel: "",
        primaryPhone: "",
        primaryEmail: "",
        member: null,
        membership: null,
        loyalty: null,
        contacts: [],
    });

    const snapshot = ref({
        customerCode: null,
        totalStayCount: 0,
        ltvAmount: null,
        lastUsedAt: null,
        unresolvedInquiryCount: 0,
    });

    const timelineItems = ref([]);
    const recentInquiries = ref([]); // 최근 문의/클레임(최근 3건)

    const loadDetail = async () => {
        if (!hotelGroupCode?.value || !customerCode?.value) return;

        const res = await getCustomerDetailApi({
            customerCode: customerCode.value,
            hotelGroupCode: hotelGroupCode.value,
        });

        detail.value = res.data?.data ?? detail.value;
    };

    const loadSnapshot = async () => {
        if (!hotelGroupCode?.value || !customerCode?.value) return;

        const res = await getCustomerSnapshotApi({
            customerCode: customerCode.value,
            hotelGroupCode: hotelGroupCode.value,
        });

        snapshot.value = res.data?.data ?? snapshot.value;
    };

    const loadTimeline = async () => {
        if (!hotelGroupCode?.value || !customerCode?.value) return;

        const res = await getCustomerTimelineApi({
            customerCode: customerCode.value,
            hotelGroupCode: hotelGroupCode.value,
            limit: 50,
        });

        const items = res.data?.data?.items ?? [];
        timelineItems.value = items.map((it) => ({
            occurredAtRaw: it.occurredAt,
            at: formatDate(it.occurredAt),
            type: it.eventType || "-",
            text: `${it.title || "-"} · ${it.summary || ""}`.trim(),
            refId: it.refId,
        }));
    };

    const loadRecentInquiries = async () => {
        if (!hotelGroupCode?.value || !customerCode?.value) return;

        const res = await getInquiryListApi({
            size: 3,
            offset: 0,
            sortBy: "created_at",
            direction: "DESC",
            customerCode: customerCode.value,
            hotelGroupCode: hotelGroupCode.value, // 누락 방지
        });

        recentInquiries.value = res.data?.data?.content ?? [];
    };

    const loadAllCore = async () => {
        await Promise.all([loadDetail(), loadSnapshot(), loadTimeline(), loadRecentInquiries()]);
    };

    // UI computed
    const badges = computed(() => {
        const arr = [];
        if (detail.value.membership?.gradeName) arr.push(detail.value.membership.gradeName);
        if (detail.value.loyalty?.gradeName) arr.push(detail.value.loyalty.gradeName);
        if (detail.value.status) arr.push(detail.value.status);
        return arr.length ? arr : ["-"];
    });

    const chips = computed(() => {
        const arr = [];
        if (detail.value.contractType) arr.push(detail.value.contractType);
        if (detail.value.nationalityType) arr.push(detail.value.nationalityType);
        if (detail.value.inflowChannel) arr.push(detail.value.inflowChannel);
        return arr.length ? arr : ["-"];
    });

    const primaryPhone = computed(() => {
        const p = detail.value.contacts?.find((c) => c.contactType === "PHONE" && c.isPrimary);
        const raw = p?.contactValue || detail.value.primaryPhone || "";
        return formatPhone(raw) || "-";
    });

    const primaryEmail = computed(() => {
        const p = detail.value.contacts?.find((c) => c.contactType === "EMAIL" && c.isPrimary);
        return p?.contactValue || detail.value.primaryEmail || "-";
    });

    const membership = computed(() => {
        return (
            detail.value.membership || {
                gradeName: "미가입",
                membershipStatus: null,
                joinedAt: null,
                calculatedAt: null,
                expiredAt: null,
            }
        );
    });

    const loyalty = computed(() => {
        return (
            detail.value.loyalty || {
                gradeName: null,
                loyaltyStatus: null,
                joinedAt: null,
                calculatedAt: null,
            }
        );
    });

    const timelineTop5 = computed(() => (timelineItems.value ?? []).slice(0, 5));
    const inquiriesTop3 = computed(() => (recentInquiries.value ?? []).slice(0, 3)); // 화면용

    return {
        detail,
        snapshot,
        timelineItems,
        recentInquiries,

        badges,
        chips,
        primaryPhone,
        primaryEmail,
        membership,
        loyalty,
        timelineTop5,
        inquiriesTop3,

        // loaders
        loadAllCore,
        loadAll: loadAllCore,
        loadTimeline,
        loadRecentInquiries,
    };
};
