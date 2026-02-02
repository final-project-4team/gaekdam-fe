// src/test/views/voc/inquiry/view/InquiryDetailView.test.js
import { mount, flushPromises } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRouter, createMemoryHistory } from "vue-router";

import InquiryDetailView from "@/views/voc/inquiry/view/InquiryDetailView.vue";
import { getInquiryDetailApi } from "@/api/voc/inquiryApi.js";

vi.mock("@/api/voc/inquiryApi.js", () => ({
    getInquiryDetailApi: vi.fn(),
}));

const BaseButtonStub = {
    name: "BaseButton",
    props: ["type", "size"],
    emits: ["click"],
    template: `<button class="base-btn-stub" @click="$emit('click')"><slot /></button>`,
};

const detailRes = (overrides = {}) => ({
    data: {
        data: {
            inquiryCode: 777,
            customerName: "Kim",
            createdAt: "2026-01-01T10:00:00",
            inquiryCategoryName: "문의",
            employeeCode: null,
            inquiryStatus: "IN_PROGRESS",
            linkedIncidentCode: null,
            inquiryTitle: "제목777",
            inquiryContent: "내용777",
            answerContent: null,
            ...overrides,
        },
    },
});

const makeRouter = () =>
    createRouter({
        history: createMemoryHistory(),
        routes: [
            {
                path: "/voc/inquiry/:inquiryCode",
                name: "InquiryDetail",
                component: InquiryDetailView,
            },
        ],
    });

describe("InquiryDetailView", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it("mount 시 inquiryCode + query hotelGroupCode로 API 호출 후 내용 렌더", async () => {
        const router = makeRouter();
        vi.spyOn(router, "back").mockImplementation(() => {});

        getInquiryDetailApi.mockResolvedValueOnce(detailRes());

        await router.push({ name: "InquiryDetail", params: { inquiryCode: "777" }, query: { hotelGroupCode: "1" } });
        await router.isReady();

        const wrapper = mount(InquiryDetailView, {
            global: { plugins: [router], stubs: { BaseButton: BaseButtonStub } },
        });

        await flushPromises();

        expect(getInquiryDetailApi).toHaveBeenCalledTimes(1);
        expect(getInquiryDetailApi).toHaveBeenCalledWith({ hotelGroupCode: 1, inquiryCode: 777 });

        expect(wrapper.text()).toContain("문의 상세");
        expect(wrapper.text()).toContain("777");
        expect(wrapper.text()).toContain("Kim");
        expect(wrapper.text()).toContain("제목777");
        expect(wrapper.text()).toContain("내용777");
        expect(wrapper.text()).toContain("답변이 없습니다.");
    });

    it("query hotelGroupCode 없으면 localStorage hotelGroupCode 사용", async () => {
        const router = makeRouter();
        vi.spyOn(router, "back").mockImplementation(() => {});

        localStorage.setItem("hotelGroupCode", "9");
        getInquiryDetailApi.mockResolvedValueOnce(detailRes());

        await router.push({ name: "InquiryDetail", params: { inquiryCode: "777" }, query: {} });
        await router.isReady();

        mount(InquiryDetailView, {
            global: { plugins: [router], stubs: { BaseButton: BaseButtonStub } },
        });

        await flushPromises();

        expect(getInquiryDetailApi).toHaveBeenCalledTimes(1);
        expect(getInquiryDetailApi).toHaveBeenCalledWith({ hotelGroupCode: 9, inquiryCode: 777 });
    });

    it("hotelGroupCode 또는 inquiryCode 없으면 에러 표시 + API 호출 안 함", async () => {
        const router = makeRouter();
        vi.spyOn(router, "back").mockImplementation(() => {});

        // inquiryCode=0 -> Number("0") => 0 (falsy) → 에러 루트
        await router.push({ name: "InquiryDetail", params: { inquiryCode: "0" }, query: {} });
        await router.isReady();

        const wrapper = mount(InquiryDetailView, {
            global: { plugins: [router], stubs: { BaseButton: BaseButtonStub } },
        });

        await flushPromises();

        expect(getInquiryDetailApi).toHaveBeenCalledTimes(0);
        expect(wrapper.text()).toContain("hotelGroupCode 또는 inquiryCode가 없습니다.");
    });

    it("← back 버튼 클릭 시 router.back 호출", async () => {
        const router = makeRouter();
        const backSpy = vi.spyOn(router, "back").mockImplementation(() => {});

        getInquiryDetailApi.mockResolvedValueOnce(detailRes());

        await router.push({ name: "InquiryDetail", params: { inquiryCode: "777" }, query: { hotelGroupCode: "1" } });
        await router.isReady();

        const wrapper = mount(InquiryDetailView, {
            global: { plugins: [router], stubs: { BaseButton: BaseButtonStub } },
        });

        await flushPromises();

        await wrapper.find("button.back").trigger("click");
        expect(backSpy).toHaveBeenCalledTimes(1);
    });

    it("확인 버튼 클릭 시 router.back 호출", async () => {
        const router = makeRouter();
        const backSpy = vi.spyOn(router, "back").mockImplementation(() => {});

        getInquiryDetailApi.mockResolvedValueOnce(detailRes());

        await router.push({ name: "InquiryDetail", params: { inquiryCode: "777" }, query: { hotelGroupCode: "1" } });
        await router.isReady();

        const wrapper = mount(InquiryDetailView, {
            global: { plugins: [router], stubs: { BaseButton: BaseButtonStub } },
        });

        await flushPromises();

        const okBtn = wrapper.findAll(".base-btn-stub").find((b) => b.text() === "확인");
        await okBtn.trigger("click");

        expect(backSpy).toHaveBeenCalledTimes(1);
    });
});
