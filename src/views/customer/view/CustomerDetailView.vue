<template>
  <div class="customer-detail-page">
    <section class="card header-card">
      <div class="h-left">
        <div class="name-row">
          <div class="name">{{ detail.customerName || "-" }}</div>
          <div class="badges">
            <span v-for="b in badges" :key="b" class="badge">{{ b }}</span>
          </div>
        </div>

        <div class="sub-row">
          <span class="code">고객코드 #{{ detail.customerCode ?? "-" }}</span>
        </div>

        <div class="chips">
          <span v-for="c in chips" :key="c" class="chip">{{ c }}</span>
        </div>
      </div>

      <div class="h-mid">
        <div class="kv">
          <div class="k">대표 연락처</div>
          <div class="v v-inline">
            <span>{{ primaryPhone }}</span>

            <div class="outline-wrap inline">
              <BaseButton type="ghost" size="sm" @click="openContactModal">
                연락처 전체보기
              </BaseButton>
            </div>
          </div>
        </div>

        <div class="kv">
          <div class="k">이메일</div>
          <div class="v">{{ primaryEmail }}</div>
        </div>

        <div class="kv">
          <div class="k">유입 채널</div>
          <div class="v">{{ detail.inflowChannel || "-" }}</div>
        </div>
      </div>

      <div class="h-right">
        <BaseButton type="ghost" size="sm" @click="goBack">목록으로</BaseButton>
        <BaseButton type="primary" size="sm" @click="onDetailView">상세 보기</BaseButton>
        <BaseButton type="ghost" size="sm" @click="onMembershipChange">멤버십 변경</BaseButton>
        <BaseButton type="ghost" size="sm" @click="onCardSetting">카드 설정</BaseButton>
      </div>
    </section>

    <div class="grid">
      <div class="col">
        <template v-for="card in leftCards" :key="card.id">
          <section v-if="card.id === 'snapshot'" class="card">
            <div class="card-title">고객 스냅샷</div>

            <div class="snap-grid">
              <div class="snap">
                <div class="k2">총 이용횟수</div>
                <div class="v2">{{ snapshot.totalStayCount ?? 0 }}회</div>
              </div>
              <div class="snap">
                <div class="k2">누적 결제(LTV)</div>
                <div class="v2">{{ formatMoney(snapshot.ltvAmount) }}</div>
              </div>
              <div class="snap">
                <div class="k2">최근 이용일</div>
                <div class="v2">{{ formatDate(snapshot.lastUsedAt) }}</div>
              </div>
              <div class="snap">
                <div class="k2">미해결 이슈</div>
                <div class="v2">{{ snapshot.unresolvedInquiryCount ?? 0 }}건</div>
              </div>
            </div>
          </section>

          <section v-else-if="card.id === 'timeline'" class="card">
            <div class="card-head">
              <div class="card-title">최근 타임라인</div>
              <div class="outline-wrap">
                <BaseButton type="ghost" size="sm" @click="openTimelineAllModal">전체보기</BaseButton>
              </div>
            </div>

            <ul class="timeline">
              <li v-for="(t, idx) in timelineTop5" :key="idx" class="tl-item">
                <div class="dot" />
                <div class="tl-body">
                  <div class="tl-text">{{ t.text }}</div>
                  <div class="tl-sub">{{ t.at }} · {{ t.type }}</div>
                </div>
              </li>

              <li v-if="timelineTop5.length === 0" class="empty">타임라인 데이터가 없습니다.</li>
            </ul>
          </section>

          <section v-else-if="card.id === 'reservation'" class="card">
            <div class="card-head">
              <div class="card-title">예약/이용 (최근 5건)</div>
              <div class="outline-wrap">
                <BaseButton type="ghost" size="sm" @click="onReservationAll">전체보기</BaseButton>
              </div>
            </div>

            <TableWithPaging
                :columns="reservationColumns"
                :rows="reservationRows"
                :pageSize="5"
                @row-click="openReservationModal"
            />
          </section>

          <section v-else-if="card.id === 'voc'" class="card">
            <div class="card-head">
              <div class="card-title">문의/클레임 (최근 3건)</div>
              <div class="outline-wrap">
                <BaseButton type="ghost" size="sm" @click="onVocAll">전체보기</BaseButton>
              </div>
            </div>

            <TableWithPaging :columns="vocColumns" :rows="vocRows" :pageSize="5" @row-click="openVocModal" />
          </section>
        </template>
      </div>

      <div class="col">
        <template v-for="card in rightCards" :key="card.id">
          <CustomerMemoView v-if="card.id === 'memo'" :customerCode="customerCode" @changed="onMemoChanged" />

          <section v-else-if="card.id === 'membership'" class="card">
            <div class="card-head">
              <div class="card-title">멤버십</div>
              <div class="outline-wrap">
                <BaseButton type="ghost" size="sm" @click="onMembershipHistory">이력 보기</BaseButton>
              </div>
            </div>

            <div class="kv2">
              <div class="k3">등급</div><div class="v3">{{ membership.gradeName || "미가입" }}</div>
              <div class="k3">상태</div><div class="v3">{{ membership.membershipStatus || "-" }}</div>
              <div class="k3">가입일</div><div class="v3">{{ formatDate(membership.joinedAt) }}</div>
              <div class="k3">만료일</div><div class="v3">{{ formatDate(membership.expiredAt) }}</div>
              <div class="k3">산정일시</div><div class="v3">{{ formatDate(membership.calculatedAt) }}</div>
            </div>
          </section>

          <section v-else-if="card.id === 'loyalty'" class="card">
            <div class="card-head">
              <div class="card-title">로열티</div>
              <div class="outline-wrap">
                <BaseButton type="ghost" size="sm" @click="onLoyaltyHistory">이력 보기</BaseButton>
              </div>
            </div>

            <div class="kv2">
              <div class="k3">등급</div><div class="v3">{{ loyalty.gradeName || "-" }}</div>
              <div class="k3">상태</div><div class="v3">{{ loyalty.loyaltyStatus || "-" }}</div>
              <div class="k3">가입일</div><div class="v3">{{ formatDate(loyalty.joinedAt) }}</div>
              <div class="k3">산정일시</div><div class="v3">{{ formatDate(loyalty.calculatedAt) }}</div>
            </div>
          </section>
        </template>
      </div>
    </div>

    <BaseModal v-if="showContactModal" title="연락처 전체보기" @close="showContactModal = false">
      <div class="modal-body">
        <div v-if="(detail.contacts?.length || 0) === 0">연락처 데이터가 없습니다.</div>

        <p v-for="(c, i) in detail.contacts" :key="i" class="contact-row">
          - {{ c.contactType }} :
          <span v-if="c.contactType === 'PHONE'">{{ formatPhone(c.contactValue) }}</span>
          <span v-else>{{ c.contactValue }}</span>

          <span v-if="c.isPrimary" class="primary">(PRIMARY)</span>
          <span class="optin">{{ c.marketingOptIn ? "마케팅 동의" : "미동의" }}</span>
        </p>
      </div>

      <template #footer>
        <BaseButton type="ghost" size="sm" @click="showContactModal = false">닫기</BaseButton>
      </template>
    </BaseModal>

    <BaseModal v-if="showDetailModal" title="고객 상세보기" @close="showDetailModal=false">
      <div class="modal-body">
        <div class="detail-box">
          <div class="detail-title">기본정보</div>
          <div class="detail-grid">
            <div class="k4">이름</div><div class="v4">{{ detail.customerName || "-" }}</div>
            <div class="k4">고객코드</div><div class="v4">#{{ detail.customerCode ?? "-" }}</div>
            <div class="k4">고객 상태</div><div class="v4">{{ detail.status || "-" }}</div>
            <div class="k4">대표 연락처</div><div class="v4">{{ primaryPhone }}</div>
            <div class="k4">이메일</div><div class="v4">{{ primaryEmail }}</div>
            <div class="k4">계약주체</div><div class="v4">{{ detail.contractType || "-" }}</div>
            <div class="k4">국적</div><div class="v4">{{ detail.nationalityType || "-" }}</div>
            <div class="k4">유입 채널</div><div class="v4">{{ detail.inflowChannel || "-" }}</div>
          </div>
        </div>

        <div class="detail-box">
          <div class="detail-title">멤버십</div>
          <div class="detail-grid">
            <div class="k4">등급</div><div class="v4">{{ membership.gradeName || "미가입" }}</div>
            <div class="k4">상태</div><div class="v4">{{ membership.membershipStatus || "-" }}</div>
            <div class="k4">가입일</div><div class="v4">{{ formatDate(membership.joinedAt) }}</div>
            <div class="k4">만료일</div><div class="v4">{{ formatDate(membership.expiredAt) }}</div>
          </div>
        </div>

        <div class="detail-box">
          <div class="detail-title">로열티</div>
          <div class="detail-grid">
            <div class="k4">등급</div><div class="v4">{{ loyalty.gradeName || "-" }}</div>
            <div class="k4">상태</div><div class="v4">{{ loyalty.loyaltyStatus || "-" }}</div>
            <div class="k4">가입일</div><div class="v4">{{ formatDate(loyalty.joinedAt) }}</div>
            <div class="k4">산정일시</div><div class="v4">{{ formatDate(loyalty.calculatedAt) }}</div>
          </div>
        </div>
      </div>

      <template #footer>
        <BaseButton type="ghost" size="sm" @click="showDetailModal=false">확인</BaseButton>
      </template>
    </BaseModal>

    <BaseModal v-if="showMembershipModal" title="멤버십 변경" @close="showMembershipModal=false">
      <div class="modal-body">
        <div class="change-grid">
          <div class="field">
            <label>고객명</label>
            <input :value="detail.customerName || '-'" disabled />
          </div>

          <div class="field">
            <label>변경자(직원코드)</label>
            <input v-model="membershipChange.employeeCode" placeholder="예) 10001" />
          </div>

          <div class="field">
            <label>변경 등급</label>
            <select v-model="membershipChange.membershipGradeCode">
              <option value="">선택</option>
              <option v-for="g in membershipGradeOptions" :key="g.value" :value="g.value">
                {{ g.label }}
              </option>
            </select>
          </div>

          <div class="field">
            <label>변경 상태</label>
            <select v-model="membershipChange.membershipStatus">
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div class="field">
            <label>만료일</label>
            <input type="date" v-model="membershipChange.expiredAt" />
          </div>

          <div class="field full">
            <label>변경 사유</label>
            <textarea
                v-model="membershipChange.changeReason"
                placeholder="예) CS보상 / VIP 고객 대상 기준 상향 / 등급 재산정"
            />
          </div>
        </div>

        <p class="hint">
          * 저장 시: 고객 멤버십 변경 + 이력 적재가 되도록 PATCH API에 연결됩니다.
        </p>
      </div>

      <template #footer>
        <BaseButton type="ghost" size="sm" @click="showMembershipModal=false">취소</BaseButton>
        <BaseButton type="primary" size="sm" :disabled="savingMembership" @click="submitMembershipChange">저장</BaseButton>
      </template>
    </BaseModal>

    <!-- 카드 설정 -->
    <BaseModal v-if="showCardSettingModal" title="카드 설정" @close="showCardSettingModal=false">
      <div class="modal-body">
        <div class="cs-wrap">
          <div class="cs-col">
            <div class="cs-title">왼쪽 영역</div>

            <div class="cs-list">
              <div
                  v-for="(c, idx) in draftLeft"
                  :key="c.id"
                  class="cs-item"
                  :class="{
                  disabled: !c.enabled,
                  dragging: dragState.id === c.id,
                  over: isOver('left', idx),
                }"
                  draggable="true"
                  @dragstart="onDragStart($event, c.id, 'left')"
                  @dragenter.prevent="onDragEnter('left', idx)"
                  @dragover.prevent="onDragOver('left', idx)"
                  @dragleave="onDragLeave('left', idx)"
                  @drop="onDropAt('left', idx)"
                  @dragend="onDragEnd"
              >
                <span class="drag-handle" title="드래그로 순서 변경">⋮⋮</span>

                <label class="chk">
                  <input type="checkbox" v-model="c.enabled" @change="onToggleEnabled('left')" />
                  <span>{{ c.label }}</span>
                </label>

                <div v-if="showIndicator('left', idx)" class="drop-indicator" />
              </div>

              <div
                  class="cs-dropzone"
                  :class="{ over: isOver('left', draftLeft.length) }"
                  @dragenter.prevent="onDragEnter('left', draftLeft.length)"
                  @dragover.prevent="onDragOver('left', draftLeft.length)"
                  @dragleave="onDragLeave('left', draftLeft.length)"
                  @drop="onDropAt('left', draftLeft.length)"
              >
                여기로 드롭하면 맨 아래로 이동
                <div v-if="showIndicator('left', draftLeft.length)" class="drop-indicator" />
              </div>
            </div>
          </div>

          <div class="cs-col">
            <div class="cs-title">오른쪽 영역</div>

            <div class="cs-list">
              <div
                  v-for="(c, idx) in draftRight"
                  :key="c.id"
                  class="cs-item"
                  :class="{
                  disabled: !c.enabled,
                  dragging: dragState.id === c.id,
                  over: isOver('right', idx),
                }"
                  draggable="true"
                  @dragstart="onDragStart($event, c.id, 'right')"
                  @dragenter.prevent="onDragEnter('right', idx)"
                  @dragover.prevent="onDragOver('right', idx)"
                  @dragleave="onDragLeave('right', idx)"
                  @drop="onDropAt('right', idx)"
                  @dragend="onDragEnd"
              >
                <span class="drag-handle" title="드래그로 순서 변경">⋮⋮</span>

                <label class="chk">
                  <input type="checkbox" v-model="c.enabled" @change="onToggleEnabled('right')" />
                  <span>{{ c.label }}</span>
                </label>

                <div v-if="showIndicator('right', idx)" class="drop-indicator" />
              </div>

              <div
                  class="cs-dropzone"
                  :class="{ over: isOver('right', draftRight.length) }"
                  @dragenter.prevent="onDragEnter('right', draftRight.length)"
                  @dragover.prevent="onDragOver('right', draftRight.length)"
                  @dragleave="onDragLeave('right', draftRight.length)"
                  @drop="onDropAt('right', draftRight.length)"
              >
                여기로 드롭하면 맨 아래로 이동
                <div v-if="showIndicator('right', draftRight.length)" class="drop-indicator" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <BaseButton type="ghost" size="sm" @click="resetCardSetting">기본값</BaseButton>
        <BaseButton type="primary" size="sm" @click="saveCardSetting">저장</BaseButton>
      </template>
    </BaseModal>

    <BaseModal v-if="showTimelineAll" title="타임라인 전체보기" @close="showTimelineAll=false">
      <div class="modal-body">
        <ul class="timeline">
          <li v-for="(t, idx) in timelineItems" :key="idx" class="tl-item">
            <div class="dot" />
            <div class="tl-body">
              <div class="tl-text">{{ t.text }}</div>
              <div class="tl-sub">{{ t.at }} · {{ t.type }}</div>
            </div>
          </li>

          <li v-if="timelineItems.length === 0" class="empty">타임라인 데이터가 없습니다.</li>
        </ul>
      </div>
      <template #footer>
        <BaseButton type="ghost" size="sm" @click="showTimelineAll=false">닫기</BaseButton>
      </template>
    </BaseModal>

    <BaseModal v-if="showReservationModal" title="예약 상세" @close="closeReservationModal">
      <div class="modal-body" v-if="selectedReservation">
        <p><b>예약번호:</b> {{ selectedReservation.reservationNo }}</p>
        <p><b>객실유형:</b> {{ selectedReservation.roomType }}</p>
        <p><b>투숙기간:</b> {{ selectedReservation.checkin }} ~ {{ selectedReservation.checkout }}</p>
        <p><b>예약상태:</b> {{ selectedReservation.status }}</p>
        <p><b>채널:</b> {{ selectedReservation.channel }}</p>
      </div>
    </BaseModal>

    <BaseModal v-if="showVocModal" title="문의/클레임 상세" @close="closeVocModal">
      <div class="modal-body" v-if="selectedVoc">
        <p><b>문의번호:</b> {{ selectedVoc.vocNo }}</p>
        <p><b>제목:</b> {{ selectedVoc.title }}</p>
        <p><b>상태:</b> {{ selectedVoc.status }}</p>
        <p><b>일자:</b> {{ selectedVoc.date }}</p>
      </div>
    </BaseModal>

    <MembershipHistoryModal
        :open="showMembershipHistoryModal"
        :customerCode="customerCode"
        :membership="membership"
        @close="showMembershipHistoryModal = false"
    />

    <LoyaltyHistoryModal
        :open="showLoyaltyHistoryModal"
        :customerCode="customerCode"
        :loyalty="loyalty"
        @close="showLoyaltyHistoryModal = false"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import BaseButton from "@/components/common/button/BaseButton.vue";
import BaseModal from "@/components/common/modal/BaseModal.vue";
import TableWithPaging from "@/components/common/table/TableWithPaging.vue";

import CustomerMemoView from "@/views/customer/view/CustomerMemoView.vue";
import MembershipHistoryModal from "@/views/customer/modal/MembershipHistoryModal.vue";
import LoyaltyHistoryModal from "@/views/customer/modal/LoyaltyHistoryModal.vue";

import { useAuthStore } from "@/stores/authStore.js";
import { getCustomerDetailApi, getCustomerSnapshotApi, getCustomerTimelineApi } from "@/api/customer/customerApi.js";
import { getMembershipGradeList } from "@/api/setting/membershipGrade.js";
import api from "@/api/axios.js";

const patchMembershipManually = async (customerCode, payload) => {
  const res = await api.patch(`/memberships/customers/${customerCode}/manual`, payload);
  return res.data?.data;
};

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const hotelGroupCode = computed(() => authStore.hotel?.hotelGroupCode);
const customerCode = computed(() => Number(route.params.id));

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

const formatPhone = (v) => {
  const digits = (v ?? "").toString().replace(/\D/g, "");
  if (!digits) return "-";
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return v;
};

const primaryPhoneRaw = computed(() => {
  const p = detail.value.contacts?.find((c) => c.contactType === "PHONE" && c.isPrimary);
  return p?.contactValue || detail.value.primaryPhone || "";
});
const primaryPhone = computed(() => formatPhone(primaryPhoneRaw.value) || "-");

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

const loadDetail = async () => {
  if (!hotelGroupCode.value || !customerCode.value) return;
  const res = await getCustomerDetailApi({
    customerCode: customerCode.value,
    hotelGroupCode: hotelGroupCode.value,
  });
  detail.value = res.data?.data ?? detail.value;
};

const loadSnapshot = async () => {
  if (!hotelGroupCode.value || !customerCode.value) return;
  const res = await getCustomerSnapshotApi({
    customerCode: customerCode.value,
    hotelGroupCode: hotelGroupCode.value,
  });
  snapshot.value = res.data?.data ?? snapshot.value;
};

const loadTimeline = async () => {
  if (!hotelGroupCode.value || !customerCode.value) return;
  const res = await getCustomerTimelineApi({
    customerCode: customerCode.value,
    hotelGroupCode: hotelGroupCode.value,
    limit: 50,
  });

  const data = res.data?.data;
  const items = data?.items ?? [];
  timelineItems.value = items.map((it) => ({
    at: formatDate(it.occurredAt),
    type: it.eventType || "-",
    text: `${it.title || "-"} · ${it.summary || ""}`.trim(),
    refId: it.refId,
  }));
};

const loadAll = async () => {
  await Promise.all([loadDetail(), loadSnapshot(), loadTimeline()]);
};

onMounted(loadAll);

const goBack = () => router.push({ name: "CustomerList" });

const showContactModal = ref(false);
const openContactModal = () => (showContactModal.value = true);

const onMemoChanged = async () => {
  await loadTimeline();
};

const reservationColumns = [
  { key: "reservationNo", label: "예약번호", sortable: true, align: "center" },
  { key: "roomType", label: "객실유형", sortable: true, align: "center" },
  { key: "checkin", label: "투숙예정일", sortable: true, align: "center" },
  { key: "checkout", label: "투숙종료일", sortable: true, align: "center" },
  { key: "status", label: "예약상태", sortable: true, align: "center" },
  { key: "channel", label: "예약채널", sortable: true, align: "center" },
];

const reservationRows = ref(
    Array.from({ length: 7 }).map((_, i) => ({
      id: i + 1,
      reservationNo: String(1000 + i),
      roomType: i % 2 ? "스위트" : "디럭스",
      checkin: "2025/12/27",
      checkout: "2025/12/28",
      status: ["RESERVED", "CHECKIN", "CHECKOUT"][i % 3],
      channel: ["WEB", "OFFLINE", "OTA"][i % 3],
    }))
);

const vocColumns = [
  { key: "vocNo", label: "문의 번호", sortable: true, align: "center" },
  { key: "title", label: "제목", sortable: false },
  { key: "status", label: "상태", sortable: true, align: "center" },
  { key: "date", label: "일자", sortable: true, align: "center" },
];

const vocRows = ref(
    Array.from({ length: 3 }).map((_, i) => ({
      id: i + 1,
      vocNo: String(i + 1),
      title: ["소음 관련 문의", "객실 청결 문의", "체크인 시간 문의"][i % 3],
      status: ["Open", "InProgress", "Closed"][i % 3],
      date: `2025/12/${String(28 - i).padStart(2, "0")}`,
    }))
);

const showReservationModal = ref(false);
const selectedReservation = ref(null);
const openReservationModal = (row) => {
  selectedReservation.value = row;
  showReservationModal.value = true;
};
const closeReservationModal = () => {
  showReservationModal.value = false;
  selectedReservation.value = null;
};

const showVocModal = ref(false);
const selectedVoc = ref(null);
const openVocModal = (row) => {
  selectedVoc.value = row;
  showVocModal.value = true;
};
const closeVocModal = () => {
  showVocModal.value = false;
  selectedVoc.value = null;
};

const showDetailModal = ref(false);
const onDetailView = () => (showDetailModal.value = true);

/* 멤버십 변경 */
const showMembershipModal = ref(false);
const savingMembership = ref(false);

const membershipGrades = ref([]);
const membershipGradeOptions = computed(() => {
  return membershipGrades.value
      .filter((g) => g?.membershipGradeStatus !== "INACTIVE")
      .map((g) => ({ label: g.gradeName, value: g.membershipGradeCode }));
});

const loadMembershipGrades = async () => {
  try {
    const list = await getMembershipGradeList();
    membershipGrades.value = Array.isArray(list) ? list : [];
  } catch (e) {
    membershipGrades.value = [];
  }
};

const membershipChange = ref({
  membershipGradeCode: null,
  membershipStatus: "ACTIVE",
  expiredAt: "",
  changeReason: "",
  employeeCode: null,
});

const onMembershipChange = async () => {
  await loadMembershipGrades();

  const currentExpiredYmd = toYmd(membership.value?.expiredAt) || "";
  membershipChange.value = {
    membershipGradeCode: null,
    membershipStatus: membership.value?.membershipStatus || "ACTIVE",
    expiredAt: currentExpiredYmd,
    changeReason: "",
    employeeCode: null,
  };

  showMembershipModal.value = true;
};

const submitMembershipChange = async () => {
  if (savingMembership.value) return;

  savingMembership.value = true;
  try {
    const payload = {
      membershipGradeCode: Number(membershipChange.value.membershipGradeCode),
      membershipStatus: membershipChange.value.membershipStatus,
      expiredAt: membershipChange.value.expiredAt ? `${membershipChange.value.expiredAt}T00:00:00` : null,
      changeReason: (membershipChange.value.changeReason || "").trim(),
      employeeCode: Number(membershipChange.value.employeeCode),
    };

    await patchMembershipManually(customerCode.value, payload);

    alert("멤버십 변경 완료");
    showMembershipModal.value = false;

    await loadDetail();
    await loadTimeline();
  } catch (e) {
    alert("멤버십 변경 실패(형식/값 확인)");
  } finally {
    savingMembership.value = false;
  }
};

/* 카드 설정 */
const showCardSettingModal = ref(false);

const LS_KEY = "customer_detail_card_setting_v2";

const defaultCardSetting = () => [
  { id: "snapshot", label: "고객 스냅샷", enabled: true, column: "left", order: 1 },
  { id: "timeline", label: "최근 타임라인", enabled: true, column: "left", order: 2 },
  { id: "reservation", label: "예약/이용(최근 5건)", enabled: true, column: "left", order: 3 },
  { id: "voc", label: "문의/클레임(최근 3건)", enabled: true, column: "left", order: 4 },

  { id: "memo", label: "고객 메모", enabled: true, column: "right", order: 1 },
  { id: "membership", label: "멤버십", enabled: true, column: "right", order: 2 },
  { id: "loyalty", label: "로열티", enabled: true, column: "right", order: 3 },
];

const normalizeCardSetting = (list) => {
  const arr = Array.isArray(list) ? list : [];
  const left = arr.filter((x) => x.column === "left");
  const right = arr.filter((x) => x.column === "right");

  const fix = (items) => {
    const hasOrder = items.every((x) => typeof x.order === "number");
    if (hasOrder) return items;

    return items.map((x, idx) => ({
      ...x,
      order: typeof x.order === "number" ? x.order : idx + 1,
    }));
  };

  const fixedLeft = fix(left);
  const fixedRight = fix(right);

  return [...fixedLeft, ...fixedRight];
};

const cardSettings = ref(defaultCardSetting());

const loadCardSetting = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) {
      cardSettings.value = normalizeCardSetting(parsed);
    }
  } catch (e) {}
};
loadCardSetting();

const cardSettingsDraft = ref(JSON.parse(JSON.stringify(cardSettings.value)));

const leftCards = computed(() =>
    cardSettings.value
        .filter((c) => c.enabled && c.column === "left")
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
);

const rightCards = computed(() =>
    cardSettings.value
        .filter((c) => c.enabled && c.column === "right")
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
);

// enabled 먼저, disabled 아래 (draft에서만)
const draftLeft = computed(() =>
    cardSettingsDraft.value
        .filter((c) => c.column === "left")
        .slice()
        .sort((a, b) => {
          if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
          return (a.order ?? 999) - (b.order ?? 999);
        })
);

const draftRight = computed(() =>
    cardSettingsDraft.value
        .filter((c) => c.column === "right")
        .slice()
        .sort((a, b) => {
          if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
          return (a.order ?? 999) - (b.order ?? 999);
        })
);

const onCardSetting = () => {
  cardSettingsDraft.value = JSON.parse(JSON.stringify(cardSettings.value));
  // 열기 전에 한 번 정렬 규칙 적용
  reflowColumn("left");
  reflowColumn("right");
  showCardSettingModal.value = true;
};

const saveCardSetting = () => {
  cardSettings.value = normalizeCardSetting(JSON.parse(JSON.stringify(cardSettingsDraft.value)));
  localStorage.setItem(LS_KEY, JSON.stringify(cardSettings.value));
  showCardSettingModal.value = false;
};

const resetCardSetting = () => {
  cardSettingsDraft.value = defaultCardSetting();
  reflowColumn("left");
  reflowColumn("right");
};

// enabled/disabled 정렬 규칙(체크 해제는 아래로)
const reflowColumn = (column) => {
  const list = cardSettingsDraft.value
      .filter((x) => x.column === column)
      .slice()
      .sort((a, b) => {
        if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
        return (a.order ?? 999) - (b.order ?? 999);
      });

  list.forEach((item, idx) => {
    item.order = idx + 1;
  });
};

const onToggleEnabled = (column) => {
  reflowColumn(column);
};

// drag UX
const dragState = ref({ id: null, column: null });
const overState = ref({ column: null, index: null });

const isOver = (column, index) => {
  return dragState.value.id && overState.value.column === column && overState.value.index === index;
};

const showIndicator = (column, index) => {
  if (!dragState.value.id) return false;
  return isOver(column, index);
};

const createDragGhost = (e) => {
  try {
    const target = e.currentTarget;
    if (!target) return;

    const ghost = target.cloneNode(true);
    ghost.classList.add("drag-ghost");
    ghost.style.width = `${target.getBoundingClientRect().width}px`;
    document.body.appendChild(ghost);

    const rect = target.getBoundingClientRect();
    const offsetX = Math.min(24, rect.width / 4);
    const offsetY = Math.min(18, rect.height / 2);
    e.dataTransfer.setDragImage(ghost, offsetX, offsetY);

    setTimeout(() => {
      if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
    }, 0);
  } catch (_) {}
};

const onDragStart = (e, id, column) => {
  dragState.value = { id, column };
  overState.value = { column, index: null };

  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", String(id));

  // 유령 프리뷰 깔끔하게
  createDragGhost(e);
};

const onDragEnter = (column, index) => {
  if (!dragState.value.id || dragState.value.column !== column) return;
  overState.value = { column, index };
};

const onDragOver = (column, index) => {
  if (!dragState.value.id || dragState.value.column !== column) return;
  overState.value = { column, index };
};

const onDragLeave = (column, index) => {
  if (!dragState.value.id) return;
  if (overState.value.column === column && overState.value.index === index) {
    overState.value = { column: dragState.value.column, index: null };
  }
};

const applyOrder = (orderedList) => {
  orderedList.forEach((item, idx) => {
    item.order = idx + 1;
  });
};

const onDropAt = (column, targetIndex) => {
  const { id: dragId, column: dragCol } = dragState.value;
  if (!dragId || dragCol !== column) return;

  const list = (column === "left" ? draftLeft.value : draftRight.value).slice();
  const fromIndex = list.findIndex((x) => x.id === dragId);
  if (fromIndex < 0) return;

  const toIndex = Math.max(0, Math.min(targetIndex, list.length));
  const [moved] = list.splice(fromIndex, 1);

  // 같은 자리로 드롭해도 정렬 규칙은 유지
  list.splice(toIndex, 0, moved);

  applyOrder(list);

  // 체크 해제는 아래로 자동 정렬
  reflowColumn(column);

  overState.value = { column, index: null };
};

const onDragEnd = () => {
  dragState.value = { id: null, column: null };
  overState.value = { column: null, index: null };
};

const showTimelineAll = ref(false);
const openTimelineAllModal = () => (showTimelineAll.value = true);

const showMembershipHistoryModal = ref(false);
const showLoyaltyHistoryModal = ref(false);

const onMembershipHistory = () => {
  showMembershipHistoryModal.value = true;
};

const onLoyaltyHistory = () => {
  showLoyaltyHistoryModal.value = true;
};

const onReservationAll = () => {};
const onVocAll = () => {};

const formatDate = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}`;
};

const formatMoney = (v) => {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return `${n.toLocaleString()}원`;
};

const toYmd = (v) => {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
</script>

<style scoped>
.customer-detail-page {
  font-family: ui-sans-serif, system-ui, -apple-system, "Pretendard Variable", Pretendard, "Noto Sans KR",
  "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
  color: #111827;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 10px;
}

.card {
  background: #fff;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  padding: 12px;
}

.header-card {
  display: grid;
  grid-template-columns: 1.2fr 1.2fr 0.7fr;
  gap: 12px;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.name {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.2px;
}

.badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.badge {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 999px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
}

.sub-row {
  margin-top: 6px;
  color: #6b7280;
  font-size: 12px;
  font-weight: 500;
}

.chips {
  margin-top: 10px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.chip {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 10px;
  background: #eef6ff;
  border: 1px solid #dbeafe;
}

.h-mid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kv {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 10px;
  font-size: 13px;
}

.k {
  color: #6b7280;
  font-weight: 500;
}

.v {
  color: #111827;
  font-weight: 600;
}

.v-inline {
  display: flex;
  align-items: center;
  gap: 10px;
}

.h-right {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.outline-wrap :deep(button) {
  height: 30px !important;
  padding: 0 12px !important;
  border-radius: 999px !important;
  background: #fff !important;
  border: 1px solid #e5e7eb !important;
  color: #2563eb !important;
  font-weight: 600 !important;
}

.outline-wrap :deep(button:hover) {
  background: #f3f4f6 !important;
}

.outline-wrap.inline :deep(button) {
  height: 26px !important;
  padding: 0 10px !important;
  font-size: 12px !important;
}

.h-right :deep(button) {
  min-width: 110px;
  justify-content: center;
}

.grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
}

.col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 10px;
  letter-spacing: -0.2px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

/* snapshot */
.snap-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.snap {
  border: 1px solid #eef2f7;
  border-radius: 12px;
  padding: 10px;
}

.k2 {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.v2 {
  font-size: 14px;
  font-weight: 700;
  margin-top: 6px;
}

/* timeline */
.timeline {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tl-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #2563eb;
  margin-top: 6px;
}

.tl-text {
  font-size: 13px;
  font-weight: 600;
}

.tl-sub {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  margin-top: 2px;
}

.empty {
  padding: 10px;
  border: 1px dashed #e5e7eb;
  border-radius: 12px;
  color: #6b7280;
  font-size: 13px;
}

/* membership / loyalty */
.kv2 {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 8px 10px;
  font-size: 13px;
  align-items: center;
}

.k3 {
  color: #6b7280;
  font-weight: 500;
}

.v3 {
  color: #111827;
  font-weight: 600;
}

/* detail modal */
.detail-box {
  border: 1px solid #eef2f7;
  border-radius: 12px;
  padding: 10px;
  margin-bottom: 10px;
}

.detail-title {
  font-weight: 700;
  margin-bottom: 8px;
  font-size: 13px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 8px 10px;
  font-size: 13px;
  align-items: center;
}

.k4 {
  color: #6b7280;
  font-weight: 500;
}

.v4 {
  color: #111827;
  font-weight: 600;
}

/* membership change modal */
.change-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field.full {
  grid-column: 1 / -1;
}

.field label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.field input,
.field select,
.field textarea {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px 10px;
  font-weight: 500;
  font-size: 13px;
}

.field textarea {
  min-height: 90px;
  resize: vertical;
}

.hint {
  margin-top: 10px;
  font-size: 12px;
  color: #6b7280;
}

/* contact modal */
.contact-row {
  margin: 6px 0;
  font-size: 13px;
}
.primary {
  margin-left: 8px;
  font-weight: 700;
}
.optin {
  margin-left: 8px;
  color: #6b7280;
}

/* card setting */
.cs-wrap {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.cs-col {
  border: 1px solid #eef2f7;
  border-radius: 12px;
  padding: 10px;
  background: #fafbfc;
}

.cs-title {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 10px;
}

.cs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cs-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #eef2f7;
  border-radius: 12px;
  padding: 10px;
  background: #fff;
  transition: transform 0.08s ease, box-shadow 0.08s ease, border-color 0.08s ease;
}

.cs-item.disabled {
  opacity: 0.6;
}

.cs-item.dragging {
  border-color: #bfdbfe;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  transform: scale(0.995);
}

.cs-item.over {
  border-color: #93c5fd;
  background: #f8fbff;
}

.drag-handle {
  width: 18px;
  text-align: center;
  color: #9ca3af;
  cursor: grab;
  user-select: none;
  font-weight: 700;
}

.chk {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: #374151;
}

.cs-dropzone {
  position: relative;
  margin-top: 6px;
  padding: 10px;
  border: 1px dashed #e5e7eb;
  border-radius: 12px;
  color: #9ca3af;
  font-size: 12px;
  text-align: center;
  background: #fff;
}

.cs-dropzone.over {
  border-color: #93c5fd;
  background: #f8fbff;
}

/* drop indicator line */
.drop-indicator {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: -6px;
  height: 2px;
  border-radius: 2px;
  background: #93c5fd;
}


/* ghost element for drag preview */
:global(.drag-ghost) {
  position: fixed;
  top: -9999px;
  left: -9999px;
  pointer-events: none;
  opacity: 0.92;
  transform: scale(1.01);
  border-radius: 12px;
  border: 1px solid #bfdbfe;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  background: #ffffff;
}
</style>
