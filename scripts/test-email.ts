/**
 * Script de test pour vérifier la configuration email
 *
 * Usage:
 *   npx tsx scripts/test-email.ts <email-destinataire>
 *
 * Exemple:
 *   npx tsx scripts/test-email.ts test@example.com
 */

import nodemailer from 'nodemailer'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const testEmail = async (to: string) => {
  console.log('\n🔍 Test de configuration email\n')
  console.log('Configuration SMTP:')
  console.log('- Host:', process.env.SMTP_HOST || '❌ NON CONFIGURÉ')
  console.log('- Port:', process.env.SMTP_PORT || '❌ NON CONFIGURÉ')
  console.log('- User:', process.env.SMTP_USER || '❌ NON CONFIGURÉ')
  console.log('- Password:', process.env.SMTP_PASSWORD ? '✅ Configuré' : '❌ NON CONFIGURÉ')
  console.log('- Studio:', process.env.STUDIO_NAME || 'Studio Yoga (default)')
  console.log('- Destinataire:', to)
  console.log()

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('❌ Configuration SMTP incomplète. Vérifiez votre .env.local')
    process.exit(1)
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })

  console.log('📧 Envoi d\'un email de test...\n')

  try {
    const result = await transporter.sendMail({
      from: `${process.env.STUDIO_NAME ?? 'Studio Yoga'} <${process.env.SMTP_USER}>`,
      to,
      subject: '🧪 Test email - Studio Yoga',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Georgia, serif;
      background: #FAF8F5;
      margin: 0;
      padding: 40px 20px;
    }
    .container {
      max-width: 520px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 24px rgba(28,25,23,0.08);
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      color: #C4715A;
      margin-bottom: 16px;
    }
    .message {
      font-size: 16px;
      color: #1C1917;
      line-height: 1.6;
    }
    .success {
      background: #D1FAE5;
      border-left: 3px solid #10B981;
      padding: 16px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .footer {
      margin-top: 32px;
      font-size: 13px;
      color: #A89880;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="title">${process.env.STUDIO_NAME ?? 'Studio Yoga'}</div>
    <div class="message">
      <h1 style="font-size:20px;margin:0 0 16px">Email de test</h1>
      <div class="success">
        <strong>✅ Configuration SMTP fonctionnelle !</strong>
        <br><br>
        Cet email de test confirme que votre configuration SMTP fonctionne correctement.
      </div>
      <p>Détails de la configuration :</p>
      <ul>
        <li><strong>Serveur SMTP:</strong> ${process.env.SMTP_HOST}</li>
        <li><strong>Port:</strong> ${process.env.SMTP_PORT ?? '587'}</li>
        <li><strong>Utilisateur:</strong> ${process.env.SMTP_USER}</li>
        <li><strong>Studio:</strong> ${process.env.STUDIO_NAME ?? 'Studio Yoga'}</li>
      </ul>
      <p>Si vous recevez cet email, tous vos emails (confirmations, annulations, rappels) devraient fonctionner correctement.</p>
    </div>
    <div class="footer">${process.env.STUDIO_NAME ?? 'Studio Yoga'} · Test réussi 🎉</div>
  </div>
</body>
</html>
      `,
    })

    console.log('✅ Email envoyé avec succès !')
    console.log('\nDétails de l\'envoi:')
    console.log('- Message ID:', result.messageId)
    console.log('- Response:', result.response)
    console.log('\n📬 Vérifiez la boîte email de:', to)
    console.log('   (Pensez à vérifier les spams si vous ne le trouvez pas)\n')
  } catch (err: any) {
    console.error('❌ Échec de l\'envoi de l\'email\n')
    console.error('Erreur:', err.message)
    if (err.code) {
      console.error('Code:', err.code)
    }
    console.error('\nCauses possibles:')
    console.error('- Identifiants SMTP incorrects')
    console.error('- Port SMTP bloqué par votre firewall')
    console.error('- Limite d\'envoi atteinte')
    console.error('- Email destinataire invalide')
    console.error('\nVérifiez votre configuration dans .env.local\n')
    process.exit(1)
  }
}

// Get recipient email from command line
const recipientEmail = process.argv[2]

if (!recipientEmail) {
  console.error('\n❌ Usage: npx tsx scripts/test-email.ts <email-destinataire>\n')
  console.error('Exemple: npx tsx scripts/test-email.ts test@example.com\n')
  process.exit(1)
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(recipientEmail)) {
  console.error('\n❌ Email invalide:', recipientEmail, '\n')
  process.exit(1)
}

testEmail(recipientEmail)
