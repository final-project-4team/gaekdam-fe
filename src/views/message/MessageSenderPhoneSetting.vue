<template>
  <div class="sender-phone-setting">

    <!-- ===================== -->
    <!-- 헤더 -->
    <!-- ===================== -->
    <div class="page-header">
      <div class="title">발신번호 설정</div>
      <div class="desc">
        대표 발신번호를 설정하고, 여정별 메시지를 시연합니다.
      </div>
    </div>

    <!-- ===================== -->
    <!-- 발신번호 등록 -->
    <!-- ===================== -->
    <div class="card">
      <div class="card-title">발신번호 등록</div>

      <div class="form-row">
        <input v-model="newPhone.phoneNumber" placeholder="01012345678" />
        <input v-model="newPhone.label" placeholder="표시 이름" />
        <button @click="createSenderPhone">등록</button>
      </div>
    </div>

    <!-- ===================== -->
    <!-- 발신번호 목록 -->
    <!-- ===================== -->
    <div class="card">
      <div class="card-title">발신번호 목록</div>

      <div
          v-for="phone in senderPhones"
          :key="phone.senderPhoneCode"
          class="phone-row"
      >
        <label>
          <input
              type="radio"
              name="senderPhone"
              :checked="phone.active"
              @change="activate(phone.senderPhoneCode)"
          />
        </label>

        <div class="info">
          <div class="number">{{ phone.phoneNumber }}</div>
          <div class="label">{{ phone.label }}</div>
        </div>

        <span v-if="phone.active" class="badge">대표</span>
      </div>
    </div>

    <div v-if="demoReservation" class="card">
      <div class="card-title">시연 대상 예약</div>

      <div class="reservation-info">
        <div><b>예약코드</b> : {{ demoReservation.reservationCode }}</div>
        <div><b>전화번호</b> : {{ demoReservation.phone }}</div>
        <div><b>현재 상태</b> : {{ demoReservation.reservationStatus }}</div>
      </div>

      <div class="stage-buttons">
        <button
            v-for="stage in stages"
            :key="stage.stageCode"
            :disabled="!hasActivePhone"
            @click="sendStage(stage)"
        >
          {{ stage.stageNameKor }} 문자 보내기
        </button>
      </div>
    </div>

    <!-- ===================== -->
    <!-- 시연: 여정별 문자 발송 -->
    <!-- ===================== -->
    <div class="card">
      <div class="card-title">여정별 문자 시연</div>

      <div
          v-for="stage in stages"
          :key="stage.stageCode"
          class="stage-row"
      >
        <div class="stage-name">{{ stage.stageNameKor }}</div>

        <div class="buttons">
          <button
              v-for="(tpl, visitorType) in stage.templates"
              :key="tpl.templateCode"
              :disabled="!hasActivePhone"
              @click="sendStageSms(stage, tpl)"
          >
            {{ visitorType }} 발송
          </button>
        </div>
      </div>

      <div v-if="!hasActivePhone" class="hint">
        대표 발신번호를 먼저 선택하세요.
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

import {
  getMessageSenderPhoneListApi,
  createMessageSenderPhoneApi,
  activateMessageSenderPhoneApi,
} from '@/api/message/messageSenderPhoneApi'

import { getMessageJourneyStagesApi } from '@/api/message/messageStageApi'
import { getDemoReservationApi } from '@/api/message/demoReservationApi'
import { sendDemoSmsApi } from '@/api/message/demoSmsApi.js'

const demoReservation = ref(null)

/* ===================== */
/* 상태 */
/* ===================== */
const senderPhones = ref([])
const newPhone = ref({ phoneNumber: '', label: '' })
const stages = ref([])

/* ===================== */
/* 계산값 */
/* ===================== */
const hasActivePhone = computed(() =>
    senderPhones.value.some(p => p.active)
)

const loadDemoReservation = async () => {
  const res = await getDemoReservationApi()
  demoReservation.value = res.data
}

/* ===================== */
/* 발신번호 API */
/* ===================== */
const loadSenderPhones = async () => {
  const res = await getMessageSenderPhoneListApi()
  senderPhones.value = res.data || []
}

const createSenderPhone = async () => {
  if (!newPhone.value.phoneNumber) return
  await createMessageSenderPhoneApi(newPhone.value)
  newPhone.value = { phoneNumber: '', label: '' }
  await loadSenderPhones()
}

const activate = async (code) => {
  await activateMessageSenderPhoneApi(code)
  await loadSenderPhones()
}

/* ===================== */
/* 여정 / 문자 시연 */
/* ===================== */
const loadStages = async () => {
  const res = await getMessageJourneyStagesApi()
  stages.value = res.data.data || []
}

const sendStageSms = async (stage, template) => {
  await sendDemoSmsApi({
    reservationCode: 333,              // 시연용 고정
    stageCode: stage.stageCode,
    templateCode: template.templateCode,
    toPhone: '01082802984',             // 시연자 번호
  })

  alert(`${stage.stageNameKor} 문자 발송 완료`)
}


const sendStage = async (stage) => {
  if (!demoReservation.value) return

  await sendDemoSmsApi({
    reservationCode: demoReservation.value.reservationCode,
    stageCode: stage.stageCode,
    toPhone: demoReservation.value.phone,
  })

  alert(`${stage.stageNameKor} 문자 발송 완료`)
}

/* ===================== */
/* 생명주기 */
/* ===================== */
onMounted(async () => {
  await loadSenderPhones()
  await loadStages()
  await loadDemoReservation()
})
</script>


<style scoped>
.sender-phone-setting {
  padding: 18px 22px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-header .title {
  font-size: 18px;
  font-weight: 700;
}

.page-header .desc {
  margin-top: 6px;
  font-size: 13px;
  color: #6b7280;
}

.card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  background: #fff;
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 12px;
}

.form-row {
  display: flex;
  gap: 8px;
}

.form-row input {
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
}

.form-row button {
  padding: 8px 14px;
}

.phone-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
}

.info .number {
  font-weight: 600;
}

.info .label {
  font-size: 12px;
  color: #6b7280;
}

.badge {
  margin-left: auto;
  font-size: 12px;
  font-weight: 600;
  color: #4f46e5;
}

.stage-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.stage-buttons button {
  padding: 8px 12px;
}

.reservation-info {
  margin-bottom: 12px;
  font-size: 13px;
}

.hint {
  margin-top: 8px;
  font-size: 12px;
  color: #ef4444;
}
</style>
