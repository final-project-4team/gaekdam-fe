import { mount, flushPromises } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";

import CustomerMemoView from "@/views/customer/view/CustomerMemoView.vue";

import {
    getCustomerMemosApi,
    getCustomerMemoDetailApi,
    createCustomerMemoApi,
    updateCustomerMemoApi,
    deleteCustomerMemoApi,
} from "@/api/customer/customerMemoApi.js";

vi.mock("@/api/customer/customerMemoApi.js", () => ({
    getCustomerMemosApi: vi.fn(),
    getCustomerMemoDetailApi: vi.fn(),
    createCustomerMemoApi: vi.fn(),
    updateCustomerMemoApi: vi.fn(),
    deleteCustomerMemoApi: vi.fn(),
}));

vi.mock("@/composables/usePermissionGuard", () => ({
    usePermissionGuard: () => ({
        withPermission: (_perm, fn) => fn(), // 권한 체크 없이 바로 실행
    }),
}));

const stubs = {
    BaseModal: {
        props: ["title"],
        template: `
      <div class="base-modal">
        <h1>{{ title }}</h1>
        <div class="body"><slot /></div>
        <div class="footer"><slot name="footer" /></div>
        <button class="close" @click="$emit('close')">닫기</button>
      </div>
    `,
    },
    BaseButton: {
        template: `<button @click="$emit('click')"><slot /></button>`,
    },
};

describe("CustomerMemoView", () => {
    beforeEach(() => vi.clearAllMocks());

    it("mount 시 최근 메모 3개 로드해서 렌더링", async () => {
        getCustomerMemosApi.mockResolvedValue({
            data: { data: { content: [{ customerMemoCode: 1, customerMemoContent: "memo1", createdAt: "2026-01-01T10:00:00" }] } },
        });

        const wrapper = mount(CustomerMemoView, {
            props: { customerCode: 123 },
            global: { stubs },
        });

        await flushPromises();

        expect(getCustomerMemosApi).toHaveBeenCalledTimes(1);
        expect(wrapper.text()).toContain("고객 메모");
        expect(wrapper.text()).toContain("memo1");
    });

    it("전체 보기 클릭하면 리스트 모달 열리고 목록 렌더링", async () => {
        // 최근
        getCustomerMemosApi
            .mockResolvedValueOnce({
                data: { data: { content: [] } },
            })
            // 리스트(전체보기)
            .mockResolvedValueOnce({
                data: {
                    data: {
                        content: [{ customerMemoCode: 2, customerMemoContent: "all memo", createdAt: "2026-01-01T10:00:00" }],
                        page: 1,
                        totalPages: 1,
                    },
                },
            });

        const wrapper = mount(CustomerMemoView, {
            props: { customerCode: 123 },
            global: { stubs },
        });

        await flushPromises();

        await wrapper.findAll("button").find(b => b.text() === "전체 보기")?.trigger("click");
        await flushPromises();

        expect(wrapper.text()).toContain("고객 메모 전체 보기");
        expect(wrapper.text()).toContain("memo1");
    });
});
