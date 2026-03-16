import nodemailer from 'nodemailer'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Class } from '@/types'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

const FROM = `${process.env.STUDIO_NAME ?? 'Studio Yoga'} <${process.env.SMTP_USER}>`
const STUDIO_NAME = process.env.STUDIO_NAME ?? 'Studio Yoga'

export async function sendBookingConfirmation({
  to,
  userName,
  yogaClass,
  isWaitlist = false,
  paymentMethod = 'card',
}: {
  to: string
  userName: string
  yogaClass: Class
  isWaitlist?: boolean
  paymentMethod?: 'card' | 'on_site' | 'trial'
}) {
  console.log('[EMAIL] sendBookingConfirmation called', { to, userName, yogaClass: yogaClass.title, isWaitlist, paymentMethod })

  const dateFormatted = format(new Date(yogaClass.date_time), "EEEE d MMMM 'à' HH'h'mm", {
    locale: fr,
  })

  const subject = isWaitlist
    ? `Liste d'attente — ${yogaClass.title}`
    : paymentMethod === 'trial'
    ? `Séance d'essai confirmée — ${yogaClass.title}`
    : `Réservation confirmée — ${yogaClass.title}`

  const statusMessage = isWaitlist
    ? 'Vous êtes sur liste d\'attente'
    : paymentMethod === 'trial'
    ? '🎁 Séance d\'essai gratuite confirmée ✓'
    : 'Réservation confirmée ✓'

  const cancellationNote = paymentMethod === 'card'
    ? 'Annulation gratuite jusqu\'à 24h avant le cours. Passé ce délai, la séance sera déduite.'
    : paymentMethod === 'trial'
    ? 'Vous pouvez annuler gratuitement à tout moment. Profitez de votre première séance !'
    : 'Vous pouvez annuler gratuitement à tout moment.'

  console.log('[EMAIL] Preparing to send email with subject:', subject)

  try {
    const result = await transporter.sendMail({
    from: FROM,
    to,
    subject,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF8F5;font-family:Georgia,serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
    style="background-color:#FAF8F5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
          style="max-width:520px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(28,25,23,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:${isWaitlist ? '#8C7C68' : '#C4715A'};padding:28px 40px;">
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.7);letter-spacing:0.08em;text-transform:uppercase;">
                ${STUDIO_NAME}
              </p>
            </td>
          </tr>

          <!-- Corps -->
          <tr>
            <td style="padding:40px 40px 32px;">

              <h1 style="margin:0 0 8px;font-size:24px;font-weight:600;color:#1C1917;line-height:1.2;">
                ${statusMessage}
              </h1>
              <p style="margin:0 0 28px;font-size:16px;color:#6B5F50;line-height:1.6;">
                Bonjour ${userName},${isWaitlist ? ' le cours est complet mais vous êtes sur la liste d\'attente. Vous serez notifié si une place se libère.' : ''}
              </p>

              <!-- Détails du cours -->
              <table cellpadding="0" cellspacing="0" role="presentation"
                style="width:100%;background-color:#FAF8F5;border-radius:12px;padding:20px;margin-bottom:24px;">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;font-size:12px;color:#8C7C68;letter-spacing:0.08em;text-transform:uppercase;">
                      Cours
                    </p>
                    <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#1C1917;">
                      ${yogaClass.title}
                    </p>
                    <p style="margin:0 0 4px;font-size:12px;color:#8C7C68;letter-spacing:0.08em;text-transform:uppercase;">
                      Date & heure
                    </p>
                    <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#1C1917;">
                      ${dateFormatted}
                    </p>
                    <p style="margin:0 0 4px;font-size:12px;color:#8C7C68;letter-spacing:0.08em;text-transform:uppercase;">
                      Lieu
                    </p>
                    <p style="margin:0;font-size:18px;font-weight:600;color:#1C1917;">
                      ${yogaClass.location}
                    </p>
                  </td>
                </tr>
              </table>

              ${paymentMethod === 'on_site' ? `
              <!-- Paiement sur place -->
              <table cellpadding="0" cellspacing="0" role="presentation"
                style="width:100%;background-color:#FEF3C7;border-radius:12px;padding:16px;margin-bottom:24px;">
                <tr>
                  <td>
                    <p style="margin:0;font-size:14px;color:#92400E;line-height:1.6;">
                      💳 <strong>Paiement sur place</strong> — Vous réglerez votre séance directement au studio.
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              ${!isWaitlist ? `
              <!-- Note annulation -->
              <table cellpadding="0" cellspacing="0" role="presentation"
                style="width:100%;border-left:3px solid #C4715A;padding-left:16px;margin-bottom:24px;">
                <tr>
                  <td>
                    <p style="margin:0;font-size:14px;color:#6B5F50;line-height:1.6;">
                      <strong>Politique d'annulation :</strong> ${cancellationNote}
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#FAF8F5;padding:20px 40px;border-top:1px solid #EDE5D8;">
              <p style="margin:0;font-size:12px;color:#A89880;text-align:center;line-height:1.6;">
                ${STUDIO_NAME} · À bientôt sur le tapis !
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    })

    console.log('[EMAIL] Booking confirmation email sent successfully to:', to)
    return result
  } catch (err) {
    console.error('[EMAIL] Failed to send booking confirmation:', err)
    throw err
  }
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
  console.log('[EMAIL] sendBookingReminder called', { to, userName, yogaClass: yogaClass.title })

  const dateFormatted = format(new Date(yogaClass.date_time), "EEEE d MMMM 'à' HH'h'mm", {
    locale: fr,
  })

  const subject = `Rappel — cours demain ${dateFormatted}`
  console.log('[EMAIL] Preparing to send reminder email with subject:', subject)

  try {
    const result = await transporter.sendMail({
      from: FROM,
      to,
      subject,
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

    console.log('[EMAIL] Reminder email sent successfully to:', to)
    return result
  } catch (err) {
    console.error('[EMAIL] Failed to send reminder email:', err)
    throw err
  }
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
  console.log('[EMAIL] sendCancellationEmail called', { to, userName, yogaClass: yogaClass.title, sessionLost })

  const dateFormatted = format(new Date(yogaClass.date_time), "EEEE d MMMM 'à' HH'h'mm", {
    locale: fr,
  })

  const subject = `Annulation confirmée — ${yogaClass.title}`
  console.log('[EMAIL] Preparing to send cancellation email with subject:', subject)

  try {
    const result = await transporter.sendMail({
      from: FROM,
      to,
      subject,
      html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Annulation confirmée</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF8F5;font-family:Georgia,serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
    style="background-color:#FAF8F5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
          style="max-width:520px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(28,25,23,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:${sessionLost ? '#C4715A' : '#8FA892'};padding:28px 40px;">
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.7);letter-spacing:0.08em;text-transform:uppercase;">
                ${STUDIO_NAME}
              </p>
            </td>
          </tr>

          <!-- Corps -->
          <tr>
            <td style="padding:40px 40px 32px;">

              <h1 style="margin:0 0 8px;font-size:24px;font-weight:600;color:#1C1917;line-height:1.2;">
                Annulation confirmée
              </h1>
              <p style="margin:0 0 28px;font-size:16px;color:#6B5F50;line-height:1.6;">
                Bonjour ${userName}, votre réservation a bien été annulée.
              </p>

              <!-- Détails du cours annulé -->
              <table cellpadding="0" cellspacing="0" role="presentation"
                style="width:100%;background-color:#FAF8F5;border-radius:12px;padding:20px;margin-bottom:24px;">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;font-size:12px;color:#8C7C68;letter-spacing:0.08em;text-transform:uppercase;">
                      Cours annulé
                    </p>
                    <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#1C1917;">
                      ${yogaClass.title} — ${dateFormatted}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Note séance -->
              <table cellpadding="0" cellspacing="0" role="presentation"
                style="width:100%;border-left:3px solid ${sessionLost ? '#C4715A' : '#8FA892'};padding-left:16px;margin-bottom:24px;">
                <tr>
                  <td>
                    <p style="margin:0;font-size:14px;color:#6B5F50;line-height:1.6;">
                      ${sessionLost
                        ? "⚠️ L'annulation est intervenue moins de 24h avant le cours. La séance a été déduite de votre carte."
                        : "✓ L'annulation est gratuite. Aucune séance n'a été déduite de votre carte."}
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#FAF8F5;padding:20px 40px;border-top:1px solid #EDE5D8;">
              <p style="margin:0;font-size:12px;color:#A89880;text-align:center;line-height:1.6;">
                ${STUDIO_NAME}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    })

    console.log('[EMAIL] Cancellation email sent successfully to:', to)
    return result
  } catch (err) {
    console.error('[EMAIL] Failed to send cancellation email:', err)
    throw err
  }
}
