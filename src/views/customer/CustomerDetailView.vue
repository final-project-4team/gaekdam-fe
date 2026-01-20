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

      <!-- ✅ 목록으로 버튼을 우측 끝 최상단 -->
      <div class="h-right">
        <BaseButton type="ghost" size="sm" @click="goBack">목록으로</BaseButton>
        <BaseButton type="primary" size="sm" @click="onDetailView">상세 보기</BaseButton>
        <BaseButton type="ghost" size="sm" @click="onMembershipChange">멤버십 변경</BaseButton>
        <BaseButton type="ghost" size="sm" @click="onCardSetting">카드 설정</BaseButton>
      </div>
    </section>

    <!-- 본문 -->
    <div class="grid">
      <!-- LEFT -->
      <div class="col">
        <template v-for="card in leftCards" :key="card.id">
          <!-- 고객 스냅샷 -->
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

          <!-- 최근 타임라인 -->
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

          <!-- 예약/이용 -->
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

          <!-- 문의/클레임 -->
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

      <!-- RIGHT -->
      <div class="col">
        <template v-for="card in rightCards" :key="card.id">
          <!-- 메모 -->
          <CustomerMemoView
              v-if="card.id === 'memo'"
              :customerCode="customerCode"
              @changed="onMemoChanged"
          />

          <!-- 멤버십 -->
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

          <!-- 로열티 -->
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

    <!-- 연락처 전체보기 모달 -->
    <BaseModal v-if="showContactModal" title="연락처 전체보기" @close="showContactModal = false">
      <div class="modal-body">
        <div v-if="(detail.contacts?.length || 0) === 0">연락처 데이터가 없습니다.</div>

        <p v-for="(c, i) in detail.contacts" :key="i" style="margin: 6px 0">
          - {{ c.contactType }} :
          <span v-if="c.contactType === 'PHONE'">{{ formatPhone(c.contactValue) }}</span>
          <span v-else>{{ c.contactValue }}</span>

          <span v-if="c.isPrimary" style="margin-left: 8px; font-weight: 900">(PRIMARY)</span>
          <span style="margin-left: 8px; color:#6b7280">
            {{ c.marketingOptIn ? "마케팅 동의" : "미동의" }}
          </span>
        </p>
      </div>

      <template #footer>
        <BaseButton type="ghost" size="sm" @click="showContactModal = false">닫기</BaseButton>
      </template>
    </BaseModal>

    <!-- ✅ 고객 상세보기 모달 -->
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

    <!-- ✅ 멤버십 변경 모달(UI까지) -->
    <BaseModal v-if="showMembershipModal" title="멤버십 변경" @close="showMembershipModal=false">
      <div class="modal-body">
        <div class="form-row">
          <label>변경 등급</label>
          <select v-model="membershipChange.grade">
            <option value="">선택</option>
            <option value="BASIC">BASIC</option>
            <option value="BRONZE">BRONZE</option>
            <option value="SILVER">SILVER</option>
            <option value="GOLD">GOLD</option>
            <option value="PLATINUM">PLATINUM</option>
            <option value="DIAMOND">DIAMOND</option>
          </select>
        </div>

        <div class="form-row">
          <label>직원 코드</label>
          <input v-model="membershipChange.employeeCode" placeholder="예: 10001" />
        </div>

        <p class="hint">
          ※ 실제 PATCH 호출은 백엔드 DTO 필드 확정 후 연결 필요 (현재 UI/입력/검증만 완료)
        </p>
      </div>

      <template #footer>
        <BaseButton type="ghost" size="sm" @click="showMembershipModal=false">취소</BaseButton>
        <BaseButton type="primary" size="sm" @click="submitMembershipChange">저장</BaseButton>
      </template>
    </BaseModal>

    <!-- ✅ 카드 설정 모달 -->
    <BaseModal v-if="showCardSettingModal" title="카드 설정" @close="showCardSettingModal=false">
      <div class="modal-body">
        <div class="card-setting-list">
          <div v-for="c in cardSettingsDraft" :key="c.id" class="card-setting-item">
            <label class="chk">
              <input type="checkbox" v-model="c.enabled" />
              <span>{{ c.label }}</span>
            </label>

            <div class="pos">
              <BaseButton
                  type="ghost"
                  size="sm"
                  :disabled="!c.enabled"
                  :class="{ active: c.column === 'left' }"
                  @click="c.column = 'left'"
              >
                왼쪽
              </BaseButton>
              <BaseButton
                  type="ghost"
                  size="sm"
                  :disabled="!c.enabled"
                  :class="{ active: c.column === 'right' }"
                  @click="c.column = 'right'"
              >
                오른쪽
              </BaseButton>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <BaseButton type="ghost" size="sm" @click="resetCardSetting">기본값</BaseButton>
        <BaseButton type="primary" size="sm" @click="saveCardSetting">저장</BaseButton>
      </template>
    </BaseModal>

    <!-- 타임라인 전체보기 모달 -->
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
import { getCustomerDetailApi, getCustomerSnapshotApi, getCustomerTimelineApi } from "@/api/customer/customerApi";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const hotelGroupCode = computed(() => authStore.hotel?.hotelGroupCode);
const customerCode = computed(() => Number(route.params.id));

/* API state */
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

/* badge/chip */
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

/* ✅ 전화 포맷 */
const formatPhone = (v) => {
  const digits = (v ?? "").toString().replace(/\D/g, "");
  if (!digits) return "-";
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return v;
};

/* primary contact fallback */
const primaryPhoneRaw = computed(() => {
  const p = detail.value.contacts?.find((c) => c.contactType === "PHONE" && c.isPrimary);
  return p?.contactValue || detail.value.primaryPhone || "";
});
const primaryPhone = computed(() => formatPhone(primaryPhoneRaw.value) || "-");

const primaryEmail = computed(() => {
  const p = detail.value.contacts?.find((c) => c.contactType === "EMAIL" && c.isPrimary);
  return p?.contactValue || detail.value.primaryEmail || "-";
});

/* membership/loyalty safe */
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

/* ✅ 최근 5건만 */
const timelineTop5 = computed(() => (timelineItems.value ?? []).slice(0, 5));

/* API loaders */
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

/* handlers */
const goBack = () => router.push({ name: "CustomerList" });

const showContactModal = ref(false);
const openContactModal = () => (showContactModal.value = true);

/* ✅ 메모 변경 시 타임라인 즉시 반영 */
const onMemoChanged = async () => {
  await loadTimeline();
};

/* 예약/문의 더미 */
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

/* ✅ 상단 버튼 모달 */
const showDetailModal = ref(false);
const onDetailView = () => (showDetailModal.value = true);

const showMembershipModal = ref(false);
const membershipChange = ref({ grade: "", employeeCode: "" });
const onMembershipChange = () => {
  membershipChange.value = { grade: "", employeeCode: "" };
  showMembershipModal.value = true;
};

const submitMembershipChange = () => {
  // TODO: 백엔드 MembershipManualChangeRequest 필드에 맞춰 실제 PATCH 연결 필요
  console.log("멤버십 변경 요청(임시):", membershipChange.value, "customerCode:", customerCode.value);
  showMembershipModal.value = false;
};

const showCardSettingModal = ref(false);
const onCardSetting = () => {
  cardSettingsDraft.value = JSON.parse(JSON.stringify(cardSettings.value));
  showCardSettingModal.value = true;
};

/* ✅ 카드 설정 */
const LS_KEY = "customer_detail_card_setting_v1";

const defaultCardSetting = () => ([
  { id: "snapshot", label: "고객 스냅샷", enabled: true, column: "left" },
  { id: "timeline", label: "최근 타임라인", enabled: true, column: "left" },
  { id: "reservation", label: "예약/이용(최근 5건)", enabled: true, column: "left" },
  { id: "voc", label: "문의/클레임(최근 3건)", enabled: true, column: "left" },
  { id: "memo", label: "고객 메모", enabled: true, column: "right" },
  { id: "membership", label: "멤버십", enabled: true, column: "right" },
  { id: "loyalty", label: "로열티", enabled: true, column: "right" },
]);

const cardSettings = ref(defaultCardSetting());

const loadCardSetting = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) cardSettings.value = parsed;
  } catch (e) {
    // ignore
  }
};
loadCardSetting();

const cardSettingsDraft = ref(JSON.parse(JSON.stringify(cardSettings.value)));

const leftCards = computed(() =>
    cardSettings.value.filter((c) => c.enabled && c.column === "left")
);

const rightCards = computed(() =>
    cardSettings.value.filter((c) => c.enabled && c.column === "right")
);

const saveCardSetting = () => {
  cardSettings.value = JSON.parse(JSON.stringify(cardSettingsDraft.value));
  localStorage.setItem(LS_KEY, JSON.stringify(cardSettings.value));
  showCardSettingModal.value = false;
};

const resetCardSetting = () => {
  cardSettingsDraft.value = defaultCardSetting();
};

/* 타임라인 전체보기 */
const showTimelineAll = ref(false);
const openTimelineAllModal = () => (showTimelineAll.value = true);

/* 기타 버튼(기존 유지) */
const onReservationAll = () => console.log("예약 전체보기");
const onVocAll = () => console.log("VOC 전체보기");
const onMembershipHistory = () => console.log("멤버십 이력");
const onLoyaltyHistory = () => console.log("로열티 이력");

/* utils */
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
  font-weight: 900 !important;
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

/* 멤버십/로열티 */
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

/* 상세보기 모달 */
.detail-box {
  border: 1px solid #eef2f7;
  border-radius: 12px;
  padding: 10px;
  margin-bottom: 10px;
}

.detail-title {
  font-weight: 900;
  margin-bottom: 8px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 8px 10px;
  font-size: 12px;
  align-items: center;
}

.k4 {
  color: #6b7280;
  font-weight: 900;
}

.v4 {
  color: #111827;
  font-weight: 800;
}

/* 멤버십 변경 모달 */
.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.form-row label {
  font-size: 12px;
  font-weight: 900;
  color: #374151;
}

.form-row input,
.form-row select {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px 10px;
  font-weight: 700;
}

.hint {
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
}

/* 카드설정 */
.card-setting-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #eef2f7;
  border-radius: 12px;
  padding: 10px;
}

.chk {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
  color: #374151;
}

.pos {
  display: flex;
  gap: 8px;
}

.pos :deep(button.active) {
  border: 2px solid #2563eb !important;
}
</style>
