<template>
  <div class="chatbot-root">
    <!-- 채팅창 -->
    <div v-if="open" class="chat-window">
      <header class="chat-header">
        <div>챗봇</div>
        <button class="close-btn" @click="toggle">✕</button>
      </header>

      <div class="chat-body" ref="body">
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
      </div>

      <form class="chat-input" @submit.prevent="onSend">
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
import { ref, nextTick, onUnmounted } from 'vue'
import { askChat } from '@/api/ai'

const open = ref(false)
const messages = ref([]) // { role: 'user'|'bot', text: '...' }
const text = ref('')
const loading = ref(false)
const body = ref(null)
// welcome message shown once when opening
const welcomeMessage = '안녕하세요. 객담의 AI Agent 객봇 입니다.\n 호텔 고객응대 관련 사항이 궁금하다면 메뉴얼 혹은 클레임 같은 키워드를 포함하여 질문해주시고,\n 체크인, 체크아웃 수 현황이 궁금하다면 기간을 명시하고 현황을 물어봐주세요.'
// input placeholder
const placeholder = '문의 내용을 입력해주세요.'
const sessionId = String(Date.now())

// 타이머 관련
const timer = ref(0)
const timerInterval = ref(null)
const pendingUserIndex = ref(null) // messages 배열에서 대기중인 사용자 메시지 인덱스

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
</script>

<style scoped>
.chatbot-root { position: fixed; right: 20px; bottom: 20px; z-index: 10000; }

/* 아이콘 */
.chat-icon {
  width: 56px; height: 56px; border-radius: 12px; border: none;
  box-shadow: 0 6px 18px rgba(0,0,0,0.12); background: #fff; cursor: pointer;
  display:flex; align-items:center; justify-content:center;
}
.chat-icon svg { display:block; }

/* 창 */
.chat-window {
  width: 500px; max-width: calc(100vw - 48px);
  height: 80vh; display:flex; flex-direction:column;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15); border-radius: 12px; overflow: hidden;
  margin-bottom: 10px; background: #f8fafb;
}

/* header */
.chat-header {
  height: 48px; background:#475569; color:#fff; display:flex;
  align-items:center; justify-content:space-between; padding:0 12px; font-weight:600;
}
.close-btn { background:transparent; border:none; color:#fff; font-size:16px; cursor:pointer; }

/* body */
.chat-body {
  flex:1; padding:12px; overflow:auto; display:flex; flex-direction:column; gap:8px;
  background: linear-gradient(180deg,#ffffff 0%, #fbfdff 100%);
}
.msg { display:flex; }
.msg.user { justify-content:flex-end; }
.msg.bot { justify-content:flex-start; }
.bubble {
  max-width:78%; padding:12px; border-radius:12px; line-height:1.4;
  background:#fff; color:#111; box-shadow: 0 2px 6px rgba(0,0,0,0.04);
}
.msg.user .bubble { background:#e6f7ff; }

/* input */
.chat-input { height:56px; display:flex; gap:8px; padding:8px; border-top:1px solid #e6eef6; background:transparent; }
.chat-input input { flex:1; border-radius:999px; border:1px solid #dfeaf3; padding:10px 14px; }
.chat-input button { width:48px; border-radius:999px; background:#2b8be6; color:#fff; border:none; cursor:pointer; }

/* timer style */
.timer {
  font-size: 12px; color: #6b7280; margin-top: 4px; margin-left: 8px;
}
.elapsed { font-size: 11px; color: #6b7280; margin-top:6px; }
</style>