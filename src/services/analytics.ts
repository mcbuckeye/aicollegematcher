/**
 * Simple analytics tracking service
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD ? '/api' : 'http://localhost:8002/api'
)

function getSessionId(): string {
  let sessionId = sessionStorage.getItem('analytics_session_id')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    sessionStorage.setItem('analytics_session_id', sessionId)
  }
  return sessionId
}

export async function trackEvent(
  eventType: 'page_view' | 'quiz_start' | 'quiz_complete' | 'quiz_abandon' | 'pdf_download' | 'school_view',
  eventData: Record<string, unknown> = {}
): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: eventType,
        event_data: eventData,
        session_id: getSessionId(),
      }),
    })
  } catch {
    // Analytics should never block the user experience
  }
}
