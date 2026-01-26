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
          </div>
        </div>

        <div v-if="loading" class="msg bot">
          <div class="bubble">응답 생성중...</div>
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
import { ref, nextTick } from 'vue'
import { askChat } from '@/api/ai'
import { useAuthStore } from '@/stores/authStore'

const auth = useAuthStore()
const open = ref(false)
const messages = ref([]) // { role: 'user'|'bot', text: '...' }
const text = ref('')
const loading = ref(false)
const body = ref(null)
const placeholder = '궁금하신게 있으면 말씀해주세요.'
const sessionId = String(Date.now())

function toggle() {
  open.value = !open.value
  // 열 때 최초 안내 메시지 한 번만 추가
  if (open.value && messages.value.length === 0) {
    messages.value.push({ role: 'bot', text: placeholder })
    // 스크롤 보정
    nextTick(() => scrollToBottom())
  }
}

async function onSend() {
  if (!text.value) return
  const q = text.value.trim()
  messages.value.push({ role: 'user', text: escapeHtml(q) })
  text.value = ''
  loading.value = true
  nextTick(() => scrollToBottom())

  // build payload per requested schema
  const payload = {
    userId: auth.user?.loginId || 'anonymous',
    sessionId: sessionId,
    message: q,
    customerAttributes: {
      membershipLevel: auth.user?.membershipLevel || 'NORMAL',
    },
  }

  try {
    const data = await askChat(payload)
    // server returns { reply, sources }
    const botText = data.reply ?? data.answer ?? JSON.stringify(data)
    messages.value.push({ role: 'bot', text: escapeHtml(botText) })
  } catch (err) {
    messages.value.push({ role: 'bot', text: `오류: ${err.message}` })
  } finally {
    loading.value = false
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
  width: 360px; max-width: calc(100vw - 48px);
  height: 520px; display:flex; flex-direction:column;
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
</style>