import { mount, flushPromises } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";
import CustomerDetailView from "@/views/customer/view/CustomerDetailView.vue";

vi.mock("vue-router", () => ({
    useRoute: () => ({ params: { id: "123" } }),
    useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/stores/authStore.js", () => ({
    useAuthStore: () => ({ hotel: { hotelGroupCode: "HG" } }),
}));

// permission guard는 그냥 실행되게
vi.mock("@/composables/usePermissionGuard", () => ({
    usePermissionGuard: () => ({
        withPermission: (_perm, fn) => fn(),
    }),
}));

// CustomerDetailPage composable mock
const loadAll = vi.fn();
const loadTimeline = vi.fn();

vi.mock("@/views/customer/composables/useCustomerDetailPage.js", () => ({
    useCustomerDetailPage: () => ({
        detail: ref({ customerName: "홍길동", customerCode: 123, inflowChannel: "OTA", contacts: [] }),
        snapshot: ref({ totalStayCount: 1, ltvAmount: 1000, lastUsedAt: null, unresolvedInquiryCount: 0 }),
        timelineItems: ref([]),
        badges: ref(["VIP"]),
        chips: ref(["ACTIVE"]),
        primaryPhone: ref("-"),
        primaryEmail: ref("-"),
        membership: ref({ gradeName: "GOLD", membershipStatus: "ACTIVE" }),
        loyalty: ref({ gradeName: "SILVER", loyaltyStatus: "ACTIVE" }),
        loadAll,
        loadTimeline,
    }),
}));

// reservations/inquiries/dnd composable mock (템플릿 렌더만 통과용)
vi.mock("@/views/customer/composables/useCustomerReservations.js", () => ({
    useCustomerReservations: () => ({
        reservationColumns: [],
        reservationLoading: false,
        reservationRows: [],
        loadReservationsTop5: vi.fn(),
        showReservationModal: ref(false),
        selectedReservationDetail: ref(null),
        openReservationModal: vi.fn(),
        closeReservationModal: vi.fn(),
        showReservationAllModal: { value: false },
        reservationAllLoading: false,
        reservationAllRows: [],
        onReservationAll: vi.fn(),
        closeReservationAllModal: vi.fn(),
        reservationRange: { value: { months: 12, from: "", to: "" } },
        setReservationMonths: vi.fn(),
        resetReservationRange: vi.fn(),
        applyReservationRange: vi.fn(),
    }),
}));

vi.mock("@/views/customer/composables/useCustomerInquiries.js", () => ({
    useCustomerInquiries: () => ({
        inquiryColumns: [],
        inquiryLoading: false,
        inquiryRows: [],
        loadInquiriesTop3: vi.fn(),
        showInquiryModal: { value: false },
        selectedInquiryDetail: { value: null },
        openInquiryModal: vi.fn(),
        closeInquiryModal: vi.fn(),
        showInquiryAllModal: { value: false },
        inquiryAllLoading: false,
        inquiryAllRows: [],
        onInquiryAll: vi.fn(),
        closeInquiryAllModal: vi.fn(),
        inquiryRange: { value: { months: 12, from: "", to: "" } },
        setInquiryMonths: vi.fn(),
        resetInquiryRange: vi.fn(),
        applyInquiryRange: vi.fn(),
    }),
}));

vi.mock("@/views/customer/composables/useCardSettingDnd.js", () => ({
    useCardSettingDnd: () => ({
        showCardSettingModal: { value: false },
        onCardSetting: vi.fn(),
        saveCardSetting: vi.fn(),
        resetCardSetting: vi.fn(),
        leftCards: ref([{ id: "snapshot" }]),
        rightCards: { value: [{ id: "statusHistory" }] },
        draftLeft: { value: [] },
        draftRight: { value: [] },
        onToggleEnabled: vi.fn(),
        dragState: { value: { id: null } },
        isOver: vi.fn(() => false),
        showIndicator: vi.fn(() => false),
        onDragStart: vi.fn(),
        onDragEnter: vi.fn(),
        onDragOver: vi.fn(),
        onDragLeave: vi.fn(),
        onDropAt: vi.fn(),
        onDragEnd: vi.fn(),
    }),
}));

// status history top1 api도 mock
vi.mock("@/api/customer/customerDetailApi", () => ({
    getCustomerStatusHistoriesApi: vi.fn().mockResolvedValue({ data: { data: { content: [] } } }),
}));

describe("CustomerDetailView", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("mount 시 loadAll 호출", async () => {
        mount(CustomerDetailView);
        await flushPromises();
        expect(loadAll).toHaveBeenCalled();
    });

    it("멤버십 변경 버튼 클릭 시 모달 열림(텍스트 기준)", async () => {
        const wrapper = mount(CustomerDetailView);
        await flushPromises();

        const btn = wrapper.findAll("button").find(b => b.text().includes("멤버십 변경"));
        expect(btn).toBeTruthy();

        await btn.trigger("click");
        await flushPromises();

        // BaseModal title 렌더 확인
        expect(wrapper.text()).toContain("멤버십 변경");
    });
});
