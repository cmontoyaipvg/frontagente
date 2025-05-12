export function buildMessageFormData(
  message: string,
  userId: string,
  sessionId: string,
  files?: File[]
): FormData {
  const formData = new FormData()
  formData.append("message", message)
  formData.append("user_id", userId)
  formData.append("session_id", sessionId)
  formData.append("stream", "true")

  if (files && files.length > 0) {
    for (const file of files) {
      formData.append("files", file)
    }
  }

  return formData
}
