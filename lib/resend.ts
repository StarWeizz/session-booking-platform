import { Resend } from 'resend'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Class } from '@/types'

export const resend = new Resend(process.env.RESEND_API_KEY!)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@votrestudio.fr'
const STUDIO_NAME = process.env.STUDIO_NAME ?? 'Studio Yoga'

export async function sendBookingConfirmation({
  to,
  userName,
  yogaClass,
}: {
  to: string
  userName: string
  yogaClass: Class
}) {
  const dateFormatted = format(new Date(yogaClass.date_time), "EEEE d MMMM 'à' HH'h'mm", {
    locale: fr,
  })

  return resend.emails.send({
    from: `${STUDIO_NAME} <${FROM_EMAIL}>`,
    to,
    subject: `Réservation confirmée — ${dateFormatted}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Georgia, serif; color: #1C1917; background: #FAF8F5; margin: 0; padding: 40px 20px; }
    .container { max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; }
    .title { font-size: 24px; font-weight: bold; color: #C4715A; margin-bottom: 8px; }
    .detail { background: #FAF8F5; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #8C7C68; }
    .value { font-size: 18px; font-weight: 600; margin-top: 4px; }
    .note { font-size: 14px; color: #6B5F50; line-height: 1.6; border-left: 3px solid #C4715A; padding-left: 16px; }
    .footer { margin-top: 32px; font-size: 13px; color: #A89880; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="title">${STUDIO_NAME}</div>
    <h1 style="font-size:20px;margin:0 0 24px">Bonjour ${userName},<br>votre réservation est confirmée ✓</h1>
    <div class="detail">
      <div class="label">Cours</div>
      <div class="value">${yogaClass.title}</div>
      <div class="label" style="margin-top:16px">Date & heure</div>
      <div class="value">${dateFormatted}</div>
      <div class="label" style="margin-top:16px">Lieu</div>
      <div class="value">${yogaClass.location}</div>
    </div>
    <p class="note">
      <strong>Politique d'annulation :</strong> annulation gratuite jusqu'à 24h avant le cours.<br>
      Passé ce délai, la séance sera considérée comme utilisée.
    </p>
    <div class="footer">${STUDIO_NAME} · À bientôt sur le tapis !</div>
  </div>
</body>
</html>`,
  })
}

export async function sendBookingReminder({
  to,
  userName,
  yogaClass,
}: {
  to: string
  userName: string
  yogaClass: Class
}) {
  const dateFormatted = format(new Date(yogaClass.date_time), "EEEE d MMMM 'à' HH'h'mm", {
    locale: fr,
  })

  return resend.emails.send({
    from: `${STUDIO_NAME} <${FROM_EMAIL}>`,
    to,
    subject: `Rappel — cours demain ${dateFormatted}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Georgia, serif; color: #1C1917; background: #FAF8F5; margin: 0; padding: 40px 20px; }
    .container { max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; }
    .title { font-size: 24px; font-weight: bold; color: #C4715A; margin-bottom: 8px; }
    .detail { background: #FAF8F5; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #8C7C68; }
    .value { font-size: 18px; font-weight: 600; margin-top: 4px; }
    .note { font-size: 14px; color: #6B5F50; line-height: 1.6; border-left: 3px solid #8FA892; padding-left: 16px; }
    .footer { margin-top: 32px; font-size: 13px; color: #A89880; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="title">${STUDIO_NAME}</div>
    <h1 style="font-size:20px;margin:0 0 24px">Bonjour ${userName} 🌿<br>Rappel pour votre cours de demain</h1>
    <div class="detail">
      <div class="label">Cours</div>
      <div class="value">${yogaClass.title}</div>
      <div class="label" style="margin-top:16px">Date & heure</div>
      <div class="value">${dateFormatted}</div>
      <div class="label" style="margin-top:16px">Lieu</div>
      <div class="value">${yogaClass.location}</div>
    </div>
    <p class="note">
      Dernière chance pour annuler gratuitement — le délai de 24h est passé ou très proche.
    </p>
    <div class="footer">${STUDIO_NAME} · À demain sur le tapis !</div>
  </div>
</body>
</html>`,
  })
}

export async function sendCancellationEmail({
  to,
  userName,
  yogaClass,
  sessionLost,
}: {
  to: string
  userName: string
  yogaClass: Class
  sessionLost: boolean
}) {
  const dateFormatted = format(new Date(yogaClass.date_time), "EEEE d MMMM 'à' HH'h'mm", {
    locale: fr,
  })

  return resend.emails.send({
    from: `${STUDIO_NAME} <${FROM_EMAIL}>`,
    to,
    subject: `Annulation — ${dateFormatted}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Georgia, serif; color: #1C1917; background: #FAF8F5; margin: 0; padding: 40px 20px; }
    .container { max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; }
    .title { font-size: 24px; font-weight: bold; color: #C4715A; margin-bottom: 8px; }
    .note { font-size: 14px; color: #6B5F50; line-height: 1.6; border-left: 3px solid ${sessionLost ? '#C4715A' : '#8FA892'}; padding-left: 16px; }
    .footer { margin-top: 32px; font-size: 13px; color: #A89880; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="title">${STUDIO_NAME}</div>
    <h1 style="font-size:20px;margin:0 0 24px">Bonjour ${userName},<br>votre annulation a bien été prise en compte.</h1>
    <p style="color:#6B5F50;">Cours annulé : <strong>${yogaClass.title}</strong> — ${dateFormatted}</p>
    <p class="note">
      ${sessionLost
        ? "⚠️ L'annulation est intervenue moins de 24h avant le cours. La séance a été déduite de votre carte."
        : "✓ L'annulation est gratuite. Aucune séance n'a été déduite de votre carte."}
    </p>
    <div class="footer">${STUDIO_NAME}</div>
  </div>
</body>
</html>`,
  })
}
