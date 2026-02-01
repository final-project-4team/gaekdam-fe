import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";

import TimelineAllModal from "@/views/customer/modal/TimelineAllModal.vue";

const stubs = {
    // Teleport/외부 렌더 때문에 wrapper.text()가 비는 문제 방지
    BaseModal: {
        props: ["title"],
        template: `
      <div class="base-modal">
        <div class="title">{{ title }}</div>
        <slot />
        <slot name="footer" />
      </div>
    `,
    },

    // TableWithPaging이 실제로 rows 내용을 렌더하지 않으면 wrapper.text()에서 "hello"를 못 잡음
    TableWithPaging: {
        props: ["columns", "rows", "pageSize", "page", "total"],
        template: `
      <div class="table">
        <div v-for="r in (rows || [])" :key="r.id">
          {{ r.at }} {{ r.type }} {{ r.text }}
        </div>
      </div>
    `,
    },
};

describe("TimelineAllModal", () => {
    it("items 없으면 empty 표시", () => {
        const wrapper = mount(TimelineAllModal, {
            props: { open: true, items: [] },
            global: { stubs },
        });

        expect(wrapper.text()).toContain("타임라인 데이터가 없습니다.");
    });

    it("items 있으면 내용 렌더링", () => {
        const wrapper = mount(TimelineAllModal, {
            props: {
                open: true,
                items: [{ at: "2026-01-01 10:00:00", type: "MEMO", text: "hello" }],
            },
            global: { stubs },
        });

        expect(wrapper.text()).toContain("hello");
        expect(wrapper.text()).toContain("MEMO");
    });
});
