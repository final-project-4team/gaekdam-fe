// src/api/report/reportTemplateApi.js
import axios from '@/api/axios' // 프로젝트의 axios 인스턴스 경로에 맞춰 조정

export function listReportTemplates(params = {}) {
  return axios.get('/api/v1/report/templates', { params })
}