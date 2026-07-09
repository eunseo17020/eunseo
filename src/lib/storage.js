// FeelMe · 감정 기록 저장 (localStorage)
const KEY = 'feelme.history.v1'

export function loadHistory() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveResult(emotionId) {
  try {
    const history = loadHistory()
    history.push({ emotionId, date: new Date().toISOString() })
    // 최근 200개만 유지
    localStorage.setItem(KEY, JSON.stringify(history.slice(-200)))
    return history
  } catch {
    return loadHistory()
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* noop */
  }
}
