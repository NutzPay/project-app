/**
 * Email Templates para Nutzpay
 * Templates responsivos e modernos
 */

const baseStyle = `
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background-color: #f5f5f5;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
  }
  .header {
    background-color: #000000;
    padding: 40px 20px;
    text-align: center;
  }
  .logo {
    color: #ffffff;
    font-size: 32px;
    font-weight: 700;
    margin: 0;
  }
  .content {
    padding: 40px 20px;
  }
  .title {
    font-size: 24px;
    font-weight: 600;
    color: #000000;
    margin: 0 0 20px 0;
  }
  .text {
    font-size: 16px;
    line-height: 1.6;
    color: #333333;
    margin: 0 0 20px 0;
  }
  .code-box {
    background-color: #f8f8f8;
    border: 2px solid #000000;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    margin: 30px 0;
  }
  .code {
    font-size: 36px;
    font-weight: 700;
    color: #000000;
    letter-spacing: 8px;
    margin: 0;
  }
  .button {
    display: inline-block;
    background-color: #000000;
    color: #ffffff !important;
    text-decoration: none;
    padding: 16px 40px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 16px;
    margin: 20px 0;
  }
  .footer {
    background-color: #f8f8f8;
    padding: 30px 20px;
    text-align: center;
  }
  .footer-text {
    font-size: 14px;
    color: #666666;
    margin: 0 0 10px 0;
  }
  .divider {
    border: 0;
    border-top: 1px solid #e0e0e0;
    margin: 30px 0;
  }
`;

export interface EmailVerificationData {
  name: string;
  verificationUrl: string;
  token: string;
}

export interface TwoFactorData {
  name: string;
  code: string;
  expiresIn: number; // minutes
}

export interface AccountApprovedData {
  name: string;
  loginUrl: string;
}

/**
 * Template: Email Verification (Ativação de Conta)
 */
export function emailVerificationTemplate(data: EmailVerificationData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifique seu e-mail - Nutzpay</title>
  <style>${baseStyle}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">NUTZPAY</h1>
    </div>

    <div class="content">
      <h2 class="title">Bem-vindo, ${data.name}! 👋</h2>

      <p class="text">
        Obrigado por se cadastrar na Nutzpay. Para ativar sua conta e começar a usar nossa plataforma,
        precisamos verificar seu endereço de e-mail.
      </p>

      <p class="text">
        Clique no botão abaixo para verificar seu e-mail:
      </p>

      <div style="text-align: center;">
        <a href="${data.verificationUrl}" class="button">
          Verificar E-mail
        </a>
      </div>

      <hr class="divider">

      <p class="text" style="font-size: 14px;">
        Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
      </p>
      <p class="text" style="font-size: 14px; word-break: break-all; color: #666666;">
        ${data.verificationUrl}
      </p>

      <hr class="divider">

      <p class="text" style="font-size: 14px; color: #999999;">
        <strong>Este link é válido por 24 horas.</strong><br>
        Se você não criou uma conta na Nutzpay, ignore este e-mail.
      </p>
    </div>

    <div class="footer">
      <p class="footer-text">
        <strong>Nutzpay</strong><br>
        Plataforma de Pagamentos e Câmbio
      </p>
      <p class="footer-text">
        Este é um e-mail automático, por favor não responda.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Template: 2FA Code
 */
export function twoFactorCodeTemplate(data: TwoFactorData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de Verificação - Nutzpay</title>
  <style>${baseStyle}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">NUTZPAY</h1>
    </div>

    <div class="content">
      <h2 class="title">Código de Verificação 🔐</h2>

      <p class="text">
        Olá, ${data.name}!
      </p>

      <p class="text">
        Você está tentando fazer login na sua conta Nutzpay.
        Por favor, use o código abaixo para completar o acesso:
      </p>

      <div class="code-box">
        <p class="code">${data.code}</p>
      </div>

      <p class="text" style="text-align: center; font-size: 14px; color: #999999;">
        Este código expira em <strong>${data.expiresIn} minutos</strong>
      </p>

      <hr class="divider">

      <p class="text" style="font-size: 14px; color: #d32f2f;">
        ⚠️ <strong>Atenção de Segurança:</strong><br>
        Se você não tentou fazer login, alguém pode estar tentando acessar sua conta.
        Recomendamos trocar sua senha imediatamente.
      </p>
    </div>

    <div class="footer">
      <p class="footer-text">
        <strong>Nutzpay</strong><br>
        Plataforma de Pagamentos e Câmbio
      </p>
      <p class="footer-text">
        Este é um e-mail automático, por favor não responda.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Template: Account Approved (Conta Aprovada pelo Admin)
 */
export function accountApprovedTemplate(data: AccountApprovedData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conta Aprovada - Nutzpay</title>
  <style>${baseStyle}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">NUTZPAY</h1>
    </div>

    <div class="content">
      <h2 class="title">Sua conta foi aprovada! 🎉</h2>

      <p class="text">
        Olá, ${data.name}!
      </p>

      <p class="text">
        Ótimas notícias! Sua conta Nutzpay foi analisada e aprovada pela nossa equipe.
        Agora você tem acesso completo à plataforma.
      </p>

      <p class="text">
        <strong>O que você pode fazer agora:</strong>
      </p>

      <ul style="font-size: 16px; line-height: 1.8; color: #333333; margin: 0 0 20px 20px;">
        <li>Acessar seu dashboard</li>
        <li>Realizar transações PIX</li>
        <li>Comprar e vender USDT</li>
        <li>Gerenciar suas chaves de API</li>
        <li>Configurar webhooks</li>
      </ul>

      <div style="text-align: center;">
        <a href="${data.loginUrl}" class="button">
          Acessar Minha Conta
        </a>
      </div>

      <hr class="divider">

      <p class="text" style="font-size: 14px; color: #666666;">
        Se você tiver alguma dúvida, nossa equipe de suporte está disponível para ajudar.
      </p>
    </div>

    <div class="footer">
      <p class="footer-text">
        <strong>Nutzpay</strong><br>
        Plataforma de Pagamentos e Câmbio
      </p>
      <p class="footer-text">
        Este é um e-mail automático, por favor não responda.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}
