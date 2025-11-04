import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Create transporter based on environment
function createTransporter(): Transporter {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    // Development: Use Mailhog or MailDev
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '1025'),
      secure: false, // Mailhog doesn't use TLS
      ignoreTLS: true,
    });
  }

  // Production: Use real SMTP server
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send email using SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const transporter = createTransporter();

    // Use configured from email or default
    const fromEmail = options.from || process.env.SMTP_FROM || 'Nutzpay <noreply@nutzpay.com>';

    console.log(`📧 Sending email to ${options.to}`);

    const info = await transporter.sendMail({
      from: fromEmail,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log(`✅ Email sent successfully:`, info.messageId);

    // In development with Mailhog, show the preview URL
    if (process.env.NODE_ENV === 'development') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`📬 Preview URL: ${previewUrl}`);
      } else {
        const mailhogUrl = `http://localhost:8025`;
        console.log(`📬 View in Mailhog: ${mailhogUrl}`);
      }
    }

    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('❌ Exception sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test SMTP connection
 */
export async function testSMTPConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ SMTP connection successful');
    return { success: true };
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed'
    };
  }
}

/**
 * Generate a 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a secure random token
 */
export function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
