<template>
  <div class="chatbot-root">
    <!-- 채팅창 -->
    <div v-if="open" class="chat-window">
      <header class="chat-header">
        <div>챗봇</div>
        <button class="close-btn" @click="toggle">✕</button>
      </header>

      <div class="chat-body" ref="body" @dragover.prevent @drop.prevent="onDrop">
        <div v-for="(m, i) in messages" :key="i" :class="['msg', m.role]">
          <div class="bubble">
            <div class="text" v-html="m.text"></div>
            <div class="elapsed" v-if="m.elapsed !== undefined">응답 시간: {{ formatTime(m.elapsed) }}</div>
          </div>
        </div>

        <div v-if="loading" class="msg bot">
          <div class="bubble">응답 생성중...</div>
        </div>

        <!-- Show timer only for the latest user message that is pending response -->
        <div v-if="pendingUserIndex !== null" class="msg user">
          <div class="timer">{{ formatTime(timer) }}</div>
        </div>

        <!-- Upload history (recent uploads) -->
        <div class="upload-history" v-if="uploads.length > 0">
          <div class="history-title">최근 업로드</div>
          <div v-for="(u, i) in uploads" :key="u.id || i" class="history-item">
            <div class="history-name">{{ u.name }}</div>
            <div class="history-state">{{ u.state }}</div>
          </div>
        </div>
      </div>

      <!-- hidden file input kept; upload button moved into chat input as '+' -->
      <input ref="fileInput" type="file" accept=".pdf,.txt" @change="onFileChange" style="display:none" />

      <form class="chat-input" @submit.prevent="onSend">
        <!-- attach/upload button on the left of input -->
        <button type="button" class="attach-btn" @click="triggerFilePicker" :disabled="uploadLoading" title="문서 업로드">+</button>
        <input v-model="text" :placeholder="placeholder" :disabled="loading" />
        <button type="submit" :disabled="!text || loading">↑</button>
      </form>
    </div>

    <!-- 아이콘 (항상 보임, 클릭으로 열기) -->
    <button class="chat-icon" @click="toggle" :aria-expanded="open" :title="open ? '닫기' : '챗 열기'">
      <!-- 간단 로봇 아이콘 (SVG) -->
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="7" width="18" height="11" rx="2" stroke="#222" stroke-width="1.2" fill="#fff"/>
        <circle cx="8.5" cy="12.5" r="1.1" fill="#222"/>
        <circle cx="15.5" cy="12.5" r="1.1" fill="#222"/>
        <path d="M9 4v2M15 4v2" stroke="#222" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { askChat, getDocStatus } from '@/api/ai'

const open = ref(false)
const messages = ref([]) // { role: 'user'|'bot', text: '...' }
const text = ref('')
const loading = ref(false)
const body = ref(null)
// welcome message shown once when opening
const welcomeMessage = '안녕하세요. 객담의 AI Agent 객봇 입니다. \n 귀사 호텔의 고객응대에 대해 궁금한게 있으시면 \n 무엇이든 물어봐주세요!'
// input placeholder
const placeholder = '문의 내용을 입력해주세요.'
const sessionId = String(Date.now())

// 타이머 관련
const timer = ref(0)
const timerInterval = ref(null)
const pendingUserIndex = ref(null) // messages 배열에서 대기중인 사용자 메시지 인덱스

// --- Upload related state ---
const fileInput = ref(null)
const uploadLoading = ref(false)
const uploadProgress = ref(0)
const jobPollInterval = ref(null)
const uploads = ref([]) // simple upload history: { id, name, state }

// API config from env
const API_KEY = import.meta.env.VITE_API_KEY
const API_AI = (import.meta.env.VITE_API_AI || 'http://127.0.0.1:9000/api/v1').replace(/\/$/, '')

function startTimer(index) {
  stopTimer()
  timer.value = 0
  pendingUserIndex.value = index
  timerInterval.value = window.setInterval(() => {
    timer.value += 1
  }, 1000)
}

function stopTimer() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
  timer.value = 0
  pendingUserIndex.value = null
}

onUnmounted(() => {
  stopTimer()
  stopPolling()
})

function toggle() {
  open.value = !open.value
  // 열 때 최초 안내 메시지 한 번만 추가
  if (open.value && messages.value.length === 0) {
    messages.value.push({ role: 'bot', text: escapeHtml(welcomeMessage) })
    // 스크롤 보정
    nextTick(() => scrollToBottom())
  }
}

// --- Chat send logic (existing) ---
async function onSend() {
  if (!text.value) return
  const q = text.value.trim()
  // push user message and mark its index for timer
  messages.value.push({ role: 'user', text: escapeHtml(q) })
  const userIndex = messages.value.length - 1
  text.value = ''
  loading.value = true
  // start timer for this user message
  startTimer(userIndex)
  nextTick(() => scrollToBottom())

  // build payload per requested schema
  const payload = {
    userId: 'anonymous',
    sessionId: sessionId,
    message: q,
    customerAttributes: {},
  }

  try {
    const data = await askChat(payload)
    // server returns { reply, sources }
    const botText = data.reply ?? data.answer ?? JSON.stringify(data)
    // capture elapsed seconds before timer is stopped
    const elapsedSec = timer.value || 0
    messages.value.push({ role: 'bot', text: escapeHtml(botText), elapsed: elapsedSec })
  } catch (err) {
    messages.value.push({ role: 'bot', text: `오류: ${err.message}`, elapsed: timer.value || 0 })
  } finally {
    loading.value = false
    // stop timer when response received (or on error)
    stopTimer()
    nextTick(() => scrollToBottom())
  }
}

function scrollToBottom() {
  if (!body.value) return
  body.value.scrollTop = body.value.scrollHeight + 100
}

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('\n', '<br/>')
}

// 포맷터: 초 단위 경과 시간을 시:분:초 형식의 문자열로 변환
function formatTime(seconds) {
  if (seconds <= 0) return '00:00'
  const mins = Math.floor(seconds / 60) % 60
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

// ---------------- Upload helpers and flow ----------------

// client-side file validation helper (size & basic mime/type checks)
function validateFile(file) {
  if (!file) throw new Error('파일이 없습니다')
  const maxMB = 50
  if (file.size > maxMB * 1024 * 1024) {
    throw new Error(`파일이 너무 큽니다 (최대 ${maxMB}MB)`)
  }
  const allowed = ['application/pdf', 'text/plain']
  const name = (file.name || '').toLowerCase()
  if (!allowed.includes(file.type) && !name.endsWith('.pdf') && !name.endsWith('.txt')) {
    throw new Error('지원되지 않는 파일 형식입니다. PDF 또는 TXT 파일을 업로드하세요.')
  }
}

// Presign → PUT → notify flow
async function presignAndUpload(file, onProgress) {
  // 1) request presign URL and job id from backend
  const presignResp = await fetch(`${API_AI}/docs/presign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
    },
    body: JSON.stringify({ filename: file.name, content_type: file.type || 'application/octet-stream' }),
  })
  if (!presignResp.ok) {
    const txt = await presignResp.text().catch(()=>'' )
    throw new Error(`presign 실패: ${presignResp.status} ${presignResp.statusText} ${txt}`)
  }
  const presignData = await presignResp.json()
  const putUrl = presignData.url || presignData.put_url || presignData.presigned_url || presignData.presignedUrl || presignData.uploadUrl
  const jobId = presignData.job_id || presignData.jobId || presignData.id
  const s3Key = presignData.s3_key || presignData.key
  if (!putUrl || !jobId) throw new Error('presign 응답에 url 또는 job_id가 없습니다')

  // 2) upload file to S3 presigned URL using XHR to get progress
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', putUrl)
    xhr.upload.onprogress = (ev) => { if (ev.lengthComputable && onProgress) onProgress(ev) }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`파일 업로드 실패: ${xhr.status} ${xhr.statusText}`))
    }
    xhr.onerror = () => reject(new Error('파일 업로드 네트워크 오류'))
    try { xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream') } catch (e) { /* some presigned urls disallow extra headers */ }
    xhr.send(file)
  })

  // 3) notify backend that upload finished so it can enqueue processing (SQS) — best-effort
  try {
    const notifyResp = await fetch(`${API_AI}/docs/notify_upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
      },
      body: JSON.stringify({ job_id: jobId, s3_key: s3Key }),
    })
    if (!notifyResp.ok) {
      console.warn('notify_upload 실패', await notifyResp.text().catch(()=>''))
    }
  } catch (err) {
    console.warn('notify_upload 예외', err)
  }

  return { job_id: jobId }
}

// triggerFilePicker: open hidden file input
function triggerFilePicker() {
  fileInput.value?.click()
}

// onFileChange: handle file selection from input
async function onFileChange(e) {
  const f = e.target.files?.[0]
  e.target.value = '' // reset so same file can be reselected
  if (!f) return

  // reuse the inline upload flow (same as onDrop)
  try {
    validateFile(f)
  } catch (err) {
    messages.value.push({ role: 'bot', text: `업로드 오류: ${err.message}` })
    return
  }

  uploadLoading.value = true
  uploadProgress.value = 0
  messages.value.push({ role: 'bot', text: `업로드 시작: ${escapeHtml(f.name)}` })
  const histEntry = { id: null, name: f.name, state: 'uploading' }
  uploads.value.unshift(histEntry)

  try {
    const res = await presignAndUpload(f, (ev) => {
      if (ev.total) uploadProgress.value = Math.round((ev.loaded / ev.total) * 100)
    })

    const jobId = res?.job_id || res?.jobId || res?.id
    if (!jobId) {
      throw new Error('서버가 job_id를 반환하지 않았습니다')
    }

    histEntry.id = jobId
    histEntry.state = 'submitted'
    messages.value.push({ role: 'bot', text: `업로드 완료 — 백그라운드 인덱싱이 시작되었습니다.` })
    pollJobStatus(jobId, histEntry)
  } catch (err) {
    messages.value.push({ role: 'bot', text: `업로드 실패: ${err?.message || err}` })
    if (uploads.value[0]) uploads.value[0].state = 'failed'
  } finally {
    uploadLoading.value = false
    uploadProgress.value = 0
  }
}

// onDrop: handle drag-and-drop file
async function onDrop(e) {
  // prevent default navigation (browser opens dropped file) and stop propagation
  e.preventDefault()
  e.stopPropagation()
  // set copy effect for UX
  try { if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy' } catch (err) {}

  const f = e.dataTransfer?.files?.[0]
  if (!f) return

  // Inline handling here to ensure no ReferenceError if startUpload is unavailable
  try {
    validateFile(f)
  } catch (err) {
    messages.value.push({ role: 'bot', text: `업로드 오류: ${err.message}` })
    return
  }

  uploadLoading.value = true
  uploadProgress.value = 0
  messages.value.push({ role: 'bot', text: `업로드 시작: ${escapeHtml(f.name)}` })
  const histEntry = { id: null, name: f.name, state: 'uploading' }
  uploads.value.unshift(histEntry)

  try {
    const res = await presignAndUpload(f, (ev) => {
      if (ev.total) uploadProgress.value = Math.round((ev.loaded / ev.total) * 100)
    })

    const jobId = res?.job_id || res?.jobId || res?.id
    if (!jobId) {
      throw new Error('서버가 job_id를 반환하지 않았습니다')
    }

    histEntry.id = jobId
    histEntry.state = 'submitted'
    messages.value.push({ role: 'bot', text: `업로드 완료 — 백그라운드 인덱싱이 시작되었습니다.` })
    pollJobStatus(jobId, histEntry)
  } catch (err) {
    messages.value.push({ role: 'bot', text: `업로드 실패: ${err?.message || err}` })
    if (uploads.value[0]) uploads.value[0].state = 'failed'
  } finally {
    uploadLoading.value = false
    uploadProgress.value = 0
  }
}

// pollJobStatus: poll backend for job status and update history/messages
function pollJobStatus(jobId, historyEntry) {
  // ensure only one poller runs
  stopPolling()

  const poll = async () => {
    try {
      const r = await getDocStatus(jobId)
      const status = (r && (r.status || r.state)) || 'unknown'

      if