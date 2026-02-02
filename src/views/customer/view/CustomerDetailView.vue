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

            <div v-if="reservationLoading" class="empty">예약 데이터를 불러오는 중...</div>
            <div v-else-if="reservationRows.length === 0" class="empty">예약 데이터가 없습니다.</div>

            <TableWithPaging
                v-else
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
                <BaseButton type="ghost" size="sm" @click="onInquiryAll">전체보기</BaseButton>
              </div>
            </div>

            <div v-if="inquiryLoading" class="empty">문의 데이터를 불러오는 중...</div>
            <div v-else-if="inquiryRows.length === 0" class="empty">문의 데이터가 없습니다.</div>

            <TableWithPaging
                v-else
                :columns="inquiryColumns"
                :rows="inquiryRows"
                :pageSize="3"
                @row-click="openInquiryModal"
            />
          </section>
        </template>
      </div>

      <div class="col right-col">
        <template v-for="card in rightCards" :key="card.id">
          <CustomerMemoView
              v-if="card.id === 'memo'"
              :customerCode="customerCode"
              @changed="onMemoChanged"
          />

          <section v-else-if="card.id === 'statusHistory'" class="card">
            <div class="card-head">
              <div class="card-title">고객 상태 변경 이력</div>
              <div class="outline-wrap">
                <BaseButton type="ghost" size="sm" @click="onStatusHistory">이력 보기</BaseButton>
              </div>
            </div>

            <div class="kv2">
              <div class="k3">최근 변경</div>
              <div class="v3">{{ statusBeforeLabel }} → {{ statusAfterLabel }}</div>

              <div class="k3">변경 주체</div>
              <div class="v3">{{ statusActorLabel }}</div>

              <div class="k3">변경자</div>
              <div class="v3">{{ statusEmployeeLabel }}</div>

              <div class="k3">변경일시</div>
              <div class="v3">{{ statusChangedAtLabel }}</div>

              <div class="k3">사유</div>
              <div class="v3 v3-ellipsis">{{ statusReasonLabel }}</div>
            </div>
          </section>

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

    <BaseModal v-if="showReservationAllModal" title="예약 / 이용 전체" @close="closeReservationAllModal">
      <div class="modal-body">
        <div class="range-bar">
          <div class="range-left">
            <button class="pill" :class="{ active: reservationRange.months === 1 }" @click="setReservationMonths(1)">1개월</button>
            <button class="pill" :class="{ active: reservationRange.months === 3 }" @click="setReservationMonths(3)">3개월</button>
            <button class="pill" :class="{ active: reservationRange.months === 6 }" @click="setReservationMonths(6)">6개월</button>
            <button class="pill" :class="{ active: reservationRange.months === 12 }" @click="setReservationMonths(12)">12개월</button>
          </div>

          <div class="range-right">
            <input class="date" type="date" v-model="reservationRange.from" />
            <span class="sep">~</span>
            <input class="date" type="date" v-model="reservationRange.to" />
            <BaseButton type="ghost" size="sm" @click="resetReservationRange">초기화</BaseButton>
            <BaseButton type="primary" size="sm" @click="applyReservationRange">적용</BaseButton>
          </div>
        </div>

        <div v-if="reservationAllLoading" class="empty">불러오는 중...</div>
        <div v-else-if="reservationAllRows.length === 0" class="empty">예약 데이터가 없습니다.</div>

        <TableWithPaging v-else :columns="reservationColumns" :rows="reservationAllRows" :pageSize="20" />
      </div>
    </BaseModal>

    <BaseModal v-if="showInquiryAllModal" title="문의 / 클레임 전체" @close="closeInquiryAllModal">
      <div class="modal-body">
        <div class="range-bar">
          <div class="range-left">
            <button class="pill" :class="{ active: inquiryRange.months === 1 }" @click="setInquiryMonths(1)">1개월</button>
            <button class="pill" :class="{ active: inquiryRange.months === 3 }" @click="setInquiryMonths(3)">3개월</button>
            <button class="pill" :class="{ active: inquiryRange.months === 6 }" @click="setInquiryMonths(6)">6개월</button>
            <button class="pill" :class="{ active: inquiryRange.months === 12 }" @click="setInquiryMonths(12)">12개월</button>
          </div>

          <div class="range-right">
            <input class="date" type="date" v-model="inquiryRange.from" />
            <span class="sep">~</span>
            <input class="date" type="date" v-model="inquiryRange.to" />
            <BaseButton type="ghost" size="sm" @click="resetInquiryRange">초기화</BaseButton>
            <BaseButton type="primary" size="sm" @click="applyInquiryRange">적용</BaseButton>
          </div>
        </div>

        <div v-if="inquiryAllLoading" class="empty">불러오는 중...</div>
        <div v-else-if="inquiryAllRows.length === 0" class="empty">문의 데이터가 없습니다.</div>

        <TableWithPaging v-else :columns="inquiryColumns" :rows="inquiryAllRows" :pageSize="20" />
      </div>
    </BaseModal>

    <TimelineAllModal :open="showTimelineAllModal" :items="timelineItems" @close="closeTimelineAllModal" />

    <BaseModal v-if="showReservationModal" title="예약 상세" @close="closeReservationModal">
      <div class="modal-body" v-if="selectedReservationDetail">
        <p><b>예약번호:</b> {{ selectedReservationDetail.reservationCode }}</p>
        <p><b>예약상태:</b> {{ selectedReservationDetail.reservationStatus }}</p>
        <p><b>채널:</b> {{ selectedReservationDetail.reservationChannel }}</p>
        <p><b>투숙기간:</b> {{ selectedReservationDetail.checkinDate }} ~ {{ selectedReservationDetail.checkoutDate }}</p>
        <p><b>객실:</b> {{ selectedReservationDetail.roomLabel }}</p>
        <p><b>인원:</b> {{ selectedReservationDetail.guestCount }} ({{ selectedReservationDetail.guestType }})</p>
        <p><b>총금액:</b> {{ selectedReservationDetail.totalPrice }}</p>
      </div>
      <div class="modal-body" v-else>불러오는 중...</div>
    </BaseModal>

    <BaseModal v-if="showInquiryModal" title="문의/클레임 상세" @close="closeInquiryModal">
      <div class="modal-body" v-if="selectedInquiryDetail">
        <p><b>문의번호:</b> {{ selectedInquiryDetail.inquiryCode }}</p>
        <p><b>상태:</b> {{ selectedInquiryDetail.inquiryStatus }}</p>
        <p><b>카테고리:</b> {{ selectedInquiryDetail.inquiryCategoryName }}</p>
        <p><b>제목:</b> {{ selectedInquiryDetail.inquiryTitle }}</p>
        <p><b>접수일:</b> {{ selectedInquiryDetail.createdAt }}</p>
        <p><b>수정일:</b> {{ selectedInquiryDetail.updatedAt }}</p>

        <div class="detail-box" style="margin-top: 10px;">
          <div class="detail-title">문의 내용</div>
          <div style="white-space: pre-wrap; font-size: 13px;">{{ selectedInquiryDetail.inquiryContent }}</div>
        </div>

        <div class="detail-box" v-if="selectedInquiryDetail.answerContent">
          <div class="detail-title">답변</div>
          <div style="white-space: pre-wrap; font-size: 13px;">{{ selectedInquiryDetail.answerContent }}</div>
        </div>

        <p v-if="selectedInquiryDetail.linkedIncidentCode">
          <b>연결 사건코드:</b> {{ selectedInquiryDetail.linkedIncidentCode }}
        </p>
      </div>
      <div class="modal-body" v-else>불러오는 중...</div>
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

    <CustomerStatusHistoryModal
        :open="showStatusHistoryModal"
        :customerCode="customerCode"
        @close="showStatusHistoryModal = false"
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
import TimelineAllModal from "@/views/customer/modal/TimelineAllModal.vue";
import CustomerStatusHistoryModal from "@/views/customer/modal/CustomerStatusHistoryModal.vue";

import { useAuthStore } from "@/stores/authStore.js";
import api from "@/api/axios.js";
import { getMembershipGradeList } from "@/api/setting/membershipGrade.js";

import { getCustomerStatusHistoriesApi } from "@/api/customer/customerDetailApi";

import { formatDate, formatMoney, formatPhone, toYmd } from "@/views/customer/utils/customerDetail.utils.js";

import { useCustomerDetailPage } from "@/views/customer/composables/useCustomerDetailPage.js";
import { useCustomerReservations } from "@/views/customer/composables/useCustomerReservations.js";
import { useCustomerInquiries } from "@/views/customer/composables/useCustomerInquiries.js";
import { useCardSettingDnd } from "@/views/customer/composables/useCardSettingDnd.js";
import { usePermissionGuard } from '@/composables/usePermissionGuard';

const { withPermission } = usePermissionGuard();

/* router/store */
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const hotelGroupCode = computed(() => authStore.hotel?.hotelGroupCode);
const customerCode = computed(() => Number(route.params.id));

/* detail/snapshot/timeline + header 표시값 */
const {
  detail,
  snapshot,
  timelineItems,
  badges,
  chips,
  primaryPhone,
  primaryEmail,
  membership,
  loyalty,
  loadAll,
  loadTimeline,
} = useCustomerDetailPage({
  hotelGroupCode,
  customerCode,
});

const timelineTop5 = computed(() => (timelineItems.value ?? []).slice(0, 5));

/* =========================
   고객 상태 변경 이력 Top1 (우측 카드 요약용)
   ========================= */
const statusHistoryTop1 = ref(null);

const statusBeforeLabel = computed(() => statusHistoryTop1.value?.beforeStatus ?? "-");
const statusAfterLabel = computed(() => statusHistoryTop1.value?.afterStatus ?? "-");
//  변경 주체 (SYSTEM / MANUAL)
const statusActorLabel = computed(() => {
  const src = String(statusHistoryTop1.value?.changeSource ?? "").toUpperCase();
  return src === "SYSTEM" ? "SYSTEM" : (src ? "MANUAL" : "-");
});

//  변경자 (SYSTEM이면 '-' / MANUAL이면 이름 우선)
const statusEmployeeLabel = computed(() => {
  if (statusActorLabel.value === "SYSTEM") return "-";

  const name = statusHistoryTop1.value?.employeeName;
  if (name) return name;

  const code = statusHistoryTop1.value?.employeeCode;
  return code === null || code === undefined ? "-" : String(code);
});
const statusChangedAtLabel = computed(() => {
  const v = statusHistoryTop1.value?.changedAt;
  return v ? formatDate(v) : "-";
});

const statusReasonLabel = computed(() => statusHistoryTop1.value?.changeReason ?? "-");

const loadStatusTop1 = async () => {
  try {
    const res = await getCustomerStatusHistoriesApi({
      customerCode: Number(customerCode.value),
      params: { size: 1, offset: 0, sortBy: "changed_at", direction: "DESC" },
    });

    const content = res?.data?.data?.content ?? [];
    statusHistoryTop1.value = Array.isArray(content) ? content[0] ?? null : null;
  } catch {
    statusHistoryTop1.value = null;
  }
};

/* =========================
   API (기존 그대로)
   ========================= */
const patchMembershipManually = async (customerCode, payload) => {
  const res = await api.patch(`/memberships/customers/${customerCode}/manual`, payload);
  return res.data?.data;
};

const getReservationsByCustomerApi = async ({ customerCode, size = 5, offset = 0 }) => {
  const res = await api.get("/reservations", { params: { customerCode, size, offset } });
  return res.data?.data;
};

const getReservationDetailApi = async (reservationCode) => {
  const res = await api.get(`/reservations/detail/${reservationCode}`);
  return res.data?.data;
};

const getInquiryListApi = async (params) => {
  const res = await api.get("/inquiries", { params });
  return res.data?.data;
};

const getInquiryDetailApi = async (inquiryCode) => {
  const res = await api.get(`/inquiries/${inquiryCode}`);
  return res.data?.data;
};

/* =========================
   composables wiring (기존 그대로)
   ========================= */
// reservations
const {
  reservationColumns,
  reservationLoading,
  reservationRows,
  loadReservationsTop5,

  showReservationModal,
  selectedReservationDetail,
  openReservationModal,
  closeReservationModal,

  showReservationAllModal,
  reservationAllLoading,
  reservationAllRows,
  onReservationAll,
  closeReservationAllModal,

  reservationRange,
  setReservationMonths,
  resetReservationRange,
  applyReservationRange,
} = useCustomerReservations({
  customerCodeRef: customerCode,
  getReservationsByCustomerApi,
  getReservationDetailApi,
});

// inquiries
const {
  inquiryColumns,
  inquiryLoading,
  inquiryRows,
  loadInquiriesTop3,

  showInquiryModal,
  selectedInquiryDetail,
  openInquiryModal,
  closeInquiryModal,

  showInquiryAllModal,
  inquiryAllLoading,
  inquiryAllRows,
  onInquiryAll,
  closeInquiryAllModal,

  inquiryRange,
  setInquiryMonths,
  resetInquiryRange,
  applyInquiryRange,
} = useCustomerInquiries({
  customerCodeRef: customerCode,
  getInquiryListApi,
  getInquiryDetailApi,
});

// card setting dnd
const LS_KEY = "customer_detail_card_setting_v2";
const defaultCardSetting = () => [
  { id: "snapshot", label: "고객 스냅샷", enabled: true, column: "left", order: 1 },
  { id: "timeline", label: "최근 타임라인", enabled: true, column: "left", order: 2 },
  { id: "reservation", label: "예약/이용(최근 5건)", enabled: true, column: "left", order: 3 },
  { id: "voc", label: "문의/클레임(최근 3건)", enabled: true, column: "left", order: 4 },

  { id: "memo", label: "고객 메모", enabled: true, column: "right", order: 1 },
  { id: "statusHistory", label: "고객 상태 변경 이력", enabled: true, column: "right", order: 2 },
  { id: "membership", label: "멤버십", enabled: true, column: "right", order: 3 },
  { id: "loyalty", label: "로열티", enabled: true, column: "right", order: 4 },
];

const {
  showCardSettingModal,
  onCardSetting,
  saveCardSetting,
  resetCardSetting,

  leftCards,
  rightCards,
  draftLeft,
  draftRight,

  onToggleEnabled,
  dragState,
  isOver,
  showIndicator,
  onDragStart,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDropAt,
  onDragEnd,
} = useCardSettingDnd({ lsKey: LS_KEY, defaultCardSetting });

/* =========================
   mount
   ========================= */
const loadPage = async () => {
  await Promise.all([loadAll(), loadReservationsTop5(), loadInquiriesTop3(), loadStatusTop1()]);
};
onMounted(loadPage);

/* =========================
   header actions / modals
   ========================= */
const goBack = () => router.push({ name: "CustomerList" });

const showContactModal = ref(false);
const openContactModal = () => (showContactModal.value = true);

const onMemoChanged = async () => {
  await Promise.all([loadTimeline(), loadStatusTop1()]);
};

/* =========================
   membership change (기존 로직 유지)
   ========================= */
const showMembershipModal = ref(false);
const savingMembership = ref(false);

const membershipGrades = ref([]);
const membershipGradeOptions = computed(() =>
    membershipGrades.value
    .filter((g) => g?.membershipGradeStatus !== "INACTIVE")
    .map((g) => ({ label: g.gradeName, value: g.membershipGradeCode }))
);

const loadMembershipGrades = async () => {
  try {
    const list = await getMembershipGradeList();
    membershipGrades.value = Array.isArray(list) ? list : [];
  } catch {
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

const onMembershipChange =  () => {
  withPermission('CUSTOMER_UPDATE', async () => {
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
  });
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

    await Promise.all([loadAll(), loadStatusTop1()]);
  } catch (e) {
    alert("멤버십 변경 실패(형식/값 확인)");
  } finally {
    savingMembership.value = false;
  }
};

// membership/loyalty history
const showMembershipHistoryModal = ref(false);
const showLoyaltyHistoryModal = ref(false);
const onMembershipHistory = () => (showMembershipHistoryModal.value = true);
const onLoyaltyHistory = () => (showLoyaltyHistoryModal.value = true);

// status history modal
const showStatusHistoryModal = ref(false);
const onStatusHistory = () => (showStatusHistoryModal.value = true);

// timeline modal
const showTimelineAllModal = ref(false);
const openTimelineAllModal = () => (showTimelineAllModal.value = true);
const closeTimelineAllModal = () => (showTimelineAllModal.value = false);
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

.card { background: #fff; border: 1px solid #eef2f7; border-radius: 14px; padding: 12px; }
.header-card { display: grid; grid-template-columns: 1.2fr 1.2fr 0.7fr; gap: 12px; }
.name-row { display: flex; align-items: center; gap: 10px; }
.name { font-size: 18px; font-weight: 700; letter-spacing: -0.2px; }
.badges { display: flex; gap: 6px; flex-wrap: wrap; }
.badge { font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 999px; background: #f3f4f6; border: 1px solid #e5e7eb; }
.sub-row { margin-top: 6px; color: #6b7280; font-size: 12px; font-weight: 500; }
.chips { margin-top: 10px; display: flex; gap: 6px; flex-wrap: wrap; }
.chip { font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 10px; background: #eef6ff; border: 1px solid #dbeafe; }

.h-mid { display: flex; flex-direction: column; gap: 8px; }
.kv { display: grid; grid-template-columns: 90px 1fr; gap: 10px; font-size: 13px; }
.k { color: #6b7280; font-weight: 500; }
.v { color: #111827; font-weight: 600; }
.v-inline { display: flex; align-items: center; gap: 10px; }

.h-right { display: flex; flex-direction: column; gap: 8px; align-items: flex-end; }

.outline-wrap :deep(button) {
  height: 30px !important;
  padding: 0 12px !important;
  border-radius: 999px !important;
  background: #fff !important;
  border: 1px solid #e5e7eb !important;
  color: #2563eb !important;
  font-weight: 600 !important;
}
.outline-wrap :deep(button:hover) { background: #f3f4f6 !important; }
.outline-wrap.inline :deep(button) { height: 26px !important; padding: 0 10px !important; font-size: 12px !important; }
.h-right :deep(button) { min-width: 110px; justify-content: center; }

.grid { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; }
.col { display: flex; flex-direction: column; gap: 12px; }
.card-title { font-size: 14px; font-weight: 700; margin-bottom: 10px; letter-spacing: -0.2px; }
.card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }

.snap-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.snap { border: 1px solid #eef2f7; border-radius: 12px; padding: 10px; }
.k2 { font-size: 12px; color: #6b7280; font-weight: 500; }
.v2 { font-size: 14px; font-weight: 700; margin-top: 6px; }

.timeline { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
.tl-item { display: flex; gap: 10px; align-items: flex-start; }
.dot { width: 8px; height: 8px; border-radius: 999px; background: #2563eb; margin-top: 6px; }
.tl-text { font-size: 13px; font-weight: 600; }
.tl-sub { font-size: 12px; color: #6b7280; font-weight: 500; margin-top: 2px; }
.empty { padding: 10px; border: 1px dashed #e5e7eb; border-radius: 12px; color: #6b7280; font-size: 13px; }

.kv2 { display: grid; grid-template-columns: 120px 1fr; gap: 8px 10px; font-size: 13px; align-items: center; }
.k3 { color: #6b7280; font-weight: 500; }
.v3 { color: #111827; font-weight: 600; }

.pill-badge{
  display:inline-flex;
  align-items:center;
  height:22px;
  padding:0 10px;
  border-radius:999px;
  border:1px solid #e5e7eb;
  background:#fff;
  font-size:12px;
  font-weight:700;
  color:#374151;
}

.v3-ellipsis{
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.change-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 14px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field.full { grid-column: 1 / -1; }
.field label { font-size: 12px; font-weight: 600; color: #374151; }
.field input, .field select, .field textarea { border: 1px solid #e5e7eb; border-radius: 10px; padding: 8px 10px; font-weight: 500; font-size: 13px; }
.field textarea { min-height: 90px; resize: vertical; }
.hint { margin-top: 10px; font-size: 12px; color: #6b7280; }

.contact-row { margin: 6px 0; font-size: 13px; }
.primary { margin-left: 8px; font-weight: 700; }
.optin { margin-left: 8px; color: #6b7280; }

.detail-box { border: 1px solid #eef2f7; border-radius: 12px; padding: 10px; margin-bottom: 10px; }
.detail-title { font-weight: 700; margin-bottom: 8px; font-size: 13px; }

.cs-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.cs-col { border: 1px solid #eef2f7; border-radius: 12px; padding: 10px; background: #fafbfc; }
.cs-title { font-size: 13px; font-weight: 700; margin-bottom: 10px; }
.cs-list { display: flex; flex-direction: column; gap: 8px; }
.cs-item { position: relative; display: flex; align-items: center; gap: 10px; border: 1px solid #eef2f7; border-radius: 12px; padding: 10px; background: #fff; transition: transform 0.08s ease, box-shadow 0.08s ease, border-color 0.08s ease; }
.cs-item.disabled { opacity: 0.6; }
.cs-item.dragging { border-color: #bfdbfe; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08); transform: scale(0.995); }
.cs-item.over { border-color: #93c5fd; background: #f8fbff; }
.drag-handle { width: 18px; text-align: center; color: #9ca3af; cursor: grab; user-select: none; font-weight: 700; }
.chk { display: flex; align-items: center; gap: 10px; font-weight: 600; color: #374151; }
.cs-dropzone { position: relative; margin-top: 6px; padding: 10px; border: 1px dashed #e5e7eb; border-radius: 12px; color: #9ca3af; font-size: 12px; text-align: center; background: #fff; }
.cs-dropzone.over { border-color: #93c5fd; background: #f8fbff; }
.drop-indicator { position: absolute; left: 10px; right: 10px; bottom: -6px; height: 2px; border-radius: 2px; background: #93c5fd; }

.range-bar { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
.range-left { display: flex; gap: 8px; flex-wrap: wrap; }
.pill { height: 30px; padding: 0 12px; border-radius: 999px; border: 1px solid #e5e7eb; background: #fff; font-size: 12px; font-weight: 700; color: #374151; cursor: pointer; }
.pill.active { background: #eef6ff; border-color: #bfdbfe; color: #2563eb; }
.range-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.date { height: 30px; border: 1px solid #e5e7eb; border-radius: 10px; padding: 0 10px; font-size: 12px; font-weight: 600; color: #111827; }
.sep { color: #6b7280; font-weight: 700; }
</style>