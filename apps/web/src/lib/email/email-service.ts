import { prisma } from '@/lib/prisma';
import { sendEmail, generateVerificationCode, generateToken } from './smtp';
import {
  emailVerificationTemplate,
  twoFactorCodeTemplate,
  accountApprovedTemplate,
  type EmailVerificationData,
  type TwoFactorData,
  type AccountApprovedData
} from './templates';

/**
 * Código Master 2FA - bypass para desenvolvimento/emergência
 * IMPORTANTE: Em produção, remover ou proteger adequadamente
 */
const MASTER_2FA_CODE = '865911';

/**
 * Send email verification when user registers
 */
export async function sendEmailVerification(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Generate verification token
    const token = generateToken();
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // Valid for 24 hours

    // Save token to database
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: token,
        emailVerificationExpires: expires
      }
    });

    // Generate verification URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`;

    // Send email
    const emailData: EmailVerificationData = {
      name: user.name,
      verificationUrl,
      token
    };

    const result = await sendEmail({
      to: user.email,
      subject: 'Verifique seu e-mail - Nutzpay',
      html: emailVerificationTemplate(emailData)
    });

    if (!result.success) {
      console.error('Failed to send verification email:', result.error);
      return { success: false, error: result.error };
    }

    console.log(`✅ Verification email sent to ${user.email}`);
    return { success: true };

  } catch (error) {
    console.error('Error sending verification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Verify email token
 */
export async function verifyEmailToken(token: string): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date() // Token not expired
        }
      }
    });

    if (!user) {
      return { success: false, error: 'Invalid or expired token' };
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpires: null
      }
    });

    console.log(`✅ Email verified for user ${user.email}`);
    return { success: true, userId: user.id };

  } catch (error) {
    console.error('Error verifying email token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send 2FA code via email
 */
export async function send2FACode(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Generate 6-digit code
    const code = generateVerificationCode();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10); // Valid for 10 minutes

    // Save code to database
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorCode: code,
        twoFactorCodeExpires: expires
      }
    });

    // Send email
    const emailData: TwoFactorData = {
      name: user.name,
      code,
      expiresIn: 10
    };

    const result = await sendEmail({
      to: user.email,
      subject: 'Código de Verificação - Nutzpay',
      html: twoFactorCodeTemplate(emailData)
    });

    if (!result.success) {
      console.error('Failed to send 2FA code:', result.error);
      return { success: false, error: result.error };
    }

    console.log(`✅ 2FA code sent to ${user.email}`);
    return { success: true };

  } catch (error) {
    console.error('Error sending 2FA code:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Verify 2FA code
 * Supports master code 865911 for emergency access
 */
export async function verify2FACode(userId: string, code: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if it's the master code
    if (code === MASTER_2FA_CODE) {
      console.log(`🔐 Master 2FA code used for user ${userId}`);

      // Clear any existing 2FA code
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorCode: null,
          twoFactorCodeExpires: null
        }
      });

      return { success: true };
    }

    // Regular code verification
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        twoFactorCode: code,
        twoFactorCodeExpires: {
          gt: new Date() // Code not expired
        }
      }
    });

    if (!user) {
      return { success: false, error: 'Invalid or expired code' };
    }

    // Clear 2FA code after successful verification
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorCode: null,
        twoFactorCodeExpires: null,
        lastLoginAt: new Date()
      }
    });

    console.log(`✅ 2FA code verified for user ${user.email}`);
    return { success: true };

  } catch (error) {
    console.error('Error verifying 2FA code:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send account approved email (after admin approval)
 */
export async function sendAccountApprovedEmail(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const loginUrl = `${baseUrl}/auth/login`;

    const emailData: AccountApprovedData = {
      name: user.name,
      loginUrl
    };

    const result = await sendEmail({
      to: user.email,
      subject: 'Sua conta foi aprovada! - Nutzpay',
      html: accountApprovedTemplate(emailData)
    });

    if (!result.success) {
      console.error('Failed to send account approved email:', result.error);
      return { success: false, error: result.error };
    }

    console.log(`✅ Account approved email sent to ${user.email}`);
    return { success: true };

  } catch (error) {
    console.error('Error sending account approved email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user.emailVerified) {
      return { success: false, error: 'Email already verified' };
    }

    return await sendEmailVerification(user.id);

  } catch (error) {
    console.error('Error resending verification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
