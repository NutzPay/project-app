import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    // Use configured from email or default
    const fromEmail = options.from || process.env.RESEND_FROM_EMAIL || 'Nutzpay <noreply@nutzpay.com>';

    console.log(`📧 Sending email to ${options.to}`);

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error('❌ Error sending email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email'
      };
    }

    console.log(`✅ Email sent successfully:`, data?.id);

    return {
      success: true,
      messageId: data?.id
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
