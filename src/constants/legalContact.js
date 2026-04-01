export const LEGAL_CONTACT_EMAIL =
  import.meta.env.VITE_SUPPORT_CONTACT_EMAIL?.trim() || 'support@aulaaldia.com'

export const LEGAL_CONTACT_RESPONSE_WINDOW = '24-48 horas hábiles'

export const LEGAL_DATA_RIGHTS_SUBJECT = {
  value: 'habeas_data',
  label: 'Solicitud de Habeas Data / Revocatoria',
}

export const LEGAL_SECURITY_PROVIDER = 'Cloudflare Turnstile'