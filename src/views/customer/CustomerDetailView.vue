<!-- src/views/customer/CustomerDetailView.vue -->
<template>
  <div class="customer-detail-page">
    <!-- 상단 헤더 -->
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
          <div class="v">
            {{ primaryPhone }}
            <a class="link" href="#" @click.prevent="openContactModal">연락처 전체보기</a>
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
        <BaseButton type="primary" size="sm" @click="onDetailView">상세 보기</BaseButton>
        <BaseButton type="ghost" size="sm" @click="onMembershipChange">멤버십 변경</BaseButton>
        <BaseButton type="ghost" size="sm" @click="onCardSetting">카드 설정</BaseButton>
        <BaseButton type="ghost" size="sm" @click="goBack">목록으로</BaseButton>
      </div>
    </section>

    <!-- 본문 -->
    <div class="grid">
      <!-- LEFT -->
      <div class="col">
        <!-- 고객 스냅샷 -->
        <section class="card">
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

        <!-- 최근 타임라인 -->
        <section class="card">
          <div class="card-head">
            <div class="card-title">최근 타임라인</div>
            <a class="link" href="#" @click.prevent="onTimelineAll">전체보기</a>
          </div>

          <ul class="timeline">
            <li v-for="(t, idx) in timelineItems" :key="idx" class="tl-item">
              <div class="dot" />
              <div class="tl-body">
                <div class="tl-text">{{ t.text }}</div>
                <div class="tl-sub">{{ t.at }} · {{ t.type }}</div>
              </div>
            </li>

            <li v-if="timelineItems.length === 0" class="empty">
              타임라인 데이터가 없습니다.
            </li>
          </ul>
        </section>

        <!-- 예약/이용 (현재 더미 유지: API 생기면 교체) -->
        <section class="card">
          <div class="card-head">
            <div class="card-title">예약/이용 (최근 5건)</div>
            <a class="link" href="#" @click.prevent="onReservationAll">전체보기</a>
          </div>

          <TableWithPaging
              :columns="reservationColumns"
              :rows="reservationRows"
              :pageSize="5"
              @row-click="openReservationModal"
          />
        </section>

        <!-- 문의/클레임 (현재 더미 유지: API 생기면 교체) -->
        <section class="card">
          <div class="card-head">
            <div class="card-title">문의/클레임 (최근 3건)</div>
            <a class="link" href="#" @click.prevent="onVocAll">전체보기</a>
          </div>

          <TableWithPaging
              :columns="vocColumns"
              :rows="vocRows"
              :pageSize="5"
              @row-click="openVocModal"
          />
        </section>
      </div>

      <!-- RIGHT -->
      <div class="col">
        <!-- 메모는 분리된 CustomerMemoView로 대체 -->
        <CustomerMemoView :customerCode="customerCode" />

        <!-- 멤버십 -->
        <section class="card">
          <div class="card-head">
            <div class="card-title">멤버십</div>
            <a class="link" href="#" @click.prevent="onMembershipHistory">이력 보기</a>
          </div>

          <div class="kv2">
            <div class="k3">등급</div><div class="v3">{{ membership.gradeName || "미가입" }}</div>
            <div class="k3">상태</div><div class="v3">{{ membership.membershipStatus || "-" }}</div>
            <div class="k3">가입일</div><div class="v3">{{ formatDate(membership.joinedAt) }}</div>
            <div class="k3">만료일</div><div class="v3">{{ formatDate(membership.expiredAt) }}</div>
            <div class="k3">산정일시</div><div class="v3">{{ formatDate(membership.calculatedAt) }}</div>
          </div>
        </section>

        <!-- 로열티 -->
        <section class="card">
          <div class="card-head">
            <div class="card-title">로열티</div>
            <a class="link" href="#" @click.prevent="onLoyaltyHistory">이력 보기</a>
          </div>

          <div class="kv2">
            <div class="k3">등급</div><div class="v3">{{ loyalty.gradeName || "-" }}</div>
            <div class="k3">상태</div><div class="v3">{{ loyalty.loyaltyStatus || "-" }}</div>
            <div class="k3">가입일</div><div class="v3">{{ formatDate(loyalty.joinedAt) }}</div>
            <div class="k3">산정일시</div><div class="v3">{{ formatDate(loyalty.calculatedAt) }}</div>
          </div>
        </section>
      </div>
    </div>

    <!-- 연락처 전체보기 모달 ( contacts DTO 반영) -->
    <BaseModal v-if="showContactModal" title="연락처 전체보기" @close="showContactModal=false">
      <div class="modal-body">
        <div v-if="(detail.contacts?.length || 0) === 0">
          연락처 데이터가 없습니다.
        </div>

        <p v-for="(c, i) in detail.contacts" :key="i" style="margin: 6px 0">
          - {{ c.contactType }} : {{ c.contactValue }}
          <span v-if="c.isPrimary" style="margin-left: 8px; font-weight: 900">(PRIMARY)</span>
          <span style="margin-left: 8px; color:#6b7280">
            {{ c.marketingOptIn ? "마케팅 동의" : "미동의" }}
          </span>
        </p>
      </div>

      <template #footer>
        <BaseButton type="ghost" size="sm" @click="showContactModal=false">닫기</BaseButton>
      </template>
    </BaseModal>

    <!-- 예약 row 모달(더미) -->
    <BaseModal v-if="showReservationModal" title="예약 상세" @close="closeReservationModal">
      <div class="modal-body" v-if="selectedReservation">
        <p><b>예약번호:</b> {{ selectedReservation.reservationNo }}</p>
        <p><b>객실유형:</b> {{ selectedReservation.roomType }}</p>
        <p><b>투숙기간:</b> {{ selectedReservation.checkin }} ~ {{ selectedReservation.checkout }}</p>
        <p><b>예약상태:</b> {{ selectedReservation.status }}</p>
        <p><b>채널:</b> {{ selectedReservation.channel }}</p>
      </div>
    </BaseModal>

    <!-- VOC row 모달(더미) -->
    <BaseModal v-if="showVocModal" title="문의/클레임 상세" @close="closeVocModal">
      <div class="modal-body" v-if="selectedVoc">
        <p><b>문의번호:</b> {{ selectedVoc.vocNo }}</p>
        <p><b>제목:</b> {{ selectedVoc.title }}</p>
        <p><b>상태:</b> {{ selectedVoc.status }}</p>
        <p><b>일자:</b> {{ selectedVoc.date }}</p>
      </div>
    </BaseModal>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import BaseButton from "@/components/common/button/BaseButton.vue";
import BaseModal from "@/components/common/modal/BaseModal.vue";
import TableWithPaging from "@/components/common/table/TableWithPaging.vue";

import CustomerMemoView from "@/views/customer/CustomerMemoView.vue";

import { useAuthStore } from "@/stores/authStore";
import {
  getCustomerDetailApi,
  getCustomerSnapshotApi,
  getCustomerTimelineApi,
} from "@/api/customer/customerApi";

/* ===================== */
/* route / store */
/* ===================== */
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const hotelGroupCode = computed(() => authStore.hotel?.hotelGroupCode);
const customerCode = computed(() => Number(route.params.id));

/* ===================== */
/* API state */
/* ===================== */
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

/* ===================== */
/* computed: badge/chip */
/* ===================== */
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

/* ===================== */
/* primary contact fallback */
/* ===================== */
const primaryPhone = computed(() => {
  const p = detail.value.contacts?.find((c) => c.contactType === "PHONE" && c.isPrimary);
  return p?.contactValue || detail.value.primaryPhone || "-";
});

const primaryEmail = computed(() => {
  const p = detail.value.contacts?.find((c) => c.contactType === "EMAIL" && c.isPrimary);
  return p?.contactValue || detail.value.primaryEmail || "-";
});

/* ===================== */
/* membership/loyalty safe */
/* ===================== */
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

/* ===================== */
/* API loaders */
/* ===================== */
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

/* ===================== */
/* handlers */
/* ===================== */
const goBack = () => router.push({ name: "CustomerList" });

const showContactModal = ref(false);
const openContactModal = () => (showContactModal.value = true);

/* 예약/문의 더미(기존 유지) */
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

/* 버튼 핸들러(로그만) */
const onDetailView = () => console.log("상세 보기");
const onMembershipChange = () => console.log("멤버십 변경");
const onCardSetting = () => console.log("카드 설정");
const onTimelineAll = () => console.log("타임라인 전체보기");
const onReservationAll = () => console.log("예약 전체보기");
const onVocAll = () => console.log("VOC 전체보기");
const onMembershipHistory = () => console.log("멤버십 이력");
const onLoyaltyHistory = () => console.log("로열티 이력");

/* ===================== */
/* utils */
/* ===================== */
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
</script>

<style scoped>
.customer-detail-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 10px;
}

/* 공통 카드 */
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
  font-weight: 800;
}

.badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.badge {
  font-size: 11px;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 999px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
}

.sub-row {
  margin-top: 6px;
  color: #6b7280;
  font-size: 12px;
  font-weight: 700;
}

.chips {
  margin-top: 10px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.chip {
  font-size: 11px;
  font-weight: 800;
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
  font-weight: 800;
}

.v {
  color: #111827;
  font-weight: 700;
}

.h-right {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.link {
  margin-left: 10px;
  color: #2563eb;
  font-weight: 800;
  font-size: 12px;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
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
  font-size: 13px;
  font-weight: 900;
  margin-bottom: 10px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 10px;
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
  font-weight: 900;
}

.v2 {
  font-size: 14px;
  font-weight: 900;
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
  font-weight: 800;
}

.tl-sub {
  font-size: 12px;
  color: #6b7280;
  font-weight: 700;
  margin-top: 2px;
}

.empty {
  padding: 10px;
  border: 1px dashed #e5e7eb;
  border-radius: 12px;
  color: #6b7280;
  font-size: 13px;
}

/* ✅ 여기(멤버십/로열티 정렬 핵심) */
.kv2 {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 8px 10px;
  font-size: 12px;
  align-items: center;
}

.k3 {
  color: #6b7280;
  font-weight: 900;
}

.v3 {
  color: #111827;
  font-weight: 800;
}

/* modal */
.modal-body p {
  margin: 6px 0;
}

.textarea {
  width: 100%;
  min-height: 120px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px;
  font-size: 14px;
  outline: none;
}
</style>