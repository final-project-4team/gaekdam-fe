<template>
  <div class="message-template-setting">

    <div
        v-for="stage in stages"
        :key="stage.stageCode"
        class="stage-row"
    >
      <div class="stage-label">
        {{ stage.stageNameKor }}
      </div>

      <div class="template-cards">
        <MessageTemplateCard
            v-for="visitor in visitorTypes"
            :key="visitor"
            :stage="stage"
            :visitorType="visitor"
            :template="findTemplate(stage, visitor)"
            @create="openCreate"
            @edit="openEdit"
        />
      </div>
    </div>

    <MessageTemplateModal
        v-if="showModal && selectedStage"
        :mode="modalMode"
        :stage="selectedStage"
        :visitorType="selectedVisitorType"
        :template="selectedTemplate"
        @close="closeModal"
        @saved="reload"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MessageTemplateCard from './components/MessageTemplateCard.vue'
import MessageTemplateModal from './components/MessageTemplateModal.vue'
import { getMessageTemplateSettingApi } from '@/api/message/messageTemplateApi'

const stages = ref([])
const visitorTypes = ['FIRST', 'REPEAT']

const showModal = ref(false)
const modalMode = ref('create')
const selectedStage = ref(null)
const selectedVisitorType = ref(null)
const selectedTemplate = ref(null)

const load = async () => {
  const res = await getMessageTemplateSettingApi()
  stages.value = res.data.data || []
}

const findTemplate = (stage, visitorType) =>
    stage.templates?.[visitorType] || null

const openCreate = ({ stage, visitorType }) => {
  modalMode.value = 'create'
  selectedStage.value = stage
  selectedVisitorType.value = visitorType
  selectedTemplate.value = null
  showModal.value = true
}

const openEdit = ({ stage, template, visitorType }) => {
  modalMode.value = 'edit'
  selectedStage.value = stage
  selectedTemplate.value = template
  selectedVisitorType.value = visitorType
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const reload = async () => {
  closeModal()
  await load()
}

onMounted(load)
</script>

<style scoped>
.message-template-setting {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.stage-row {
  display: flex;
  gap: 24px;
}

.stage-label {
  width: 120px;
  font-weight: 600;
  padding-top: 8px;
}

.template-cards {
  display: flex;
  gap: 16px;
}
</style>