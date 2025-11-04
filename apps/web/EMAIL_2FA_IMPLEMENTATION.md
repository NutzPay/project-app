# Sistema de Email Verification & 2FA - Nutzpay

## ✅ O que já foi feito

### 1. Instalação
```bash
pnpm add resend --filter @nutzbeta/web
```

### 2. Schema do Prisma atualizado
Adicionados no modelo `User`:
```prisma
emailVerificationToken String?
emailVerificationExpires DateTime?
twoFactorEnabled Boolean @default(true) // Obrigatório
twoFactorCode String?
twoFactorCodeExpires DateTime?
```

### 3. Arquivos criados

- **`src/lib/email/resend.ts`** - Cliente Resend e helpers
- **`src/lib/email/templates.ts`** - 3 templates de e-mail bonitos:
  - Email Verification (ativação)
  - 2FA Code
  - Account Approved
- **`src/lib/email/email-service.ts`** - Lógica completa:
  - `sendEmailVerification(userId)`
  - `verifyEmailToken(token)`
  - `send2FACode(userId)`
  - `verify2FACode(userId, code)` - Suporta código master `865911`
  - `sendAccountApprovedEmail(userId)`

## 🔐 Código Master 2FA

**Código:** `865911`
**Uso:** Bypass para 2FA sem precisar de e-mail
**Localização:** `src/lib/email/email-service.ts:17`

## 📝 Próximos passos para completar

### 1. Aplicar migration no banco
```bash
cd apps/web
npx prisma db push
npx prisma generate
```

### 2. Configurar variáveis de ambiente (.env.local)
```env
# Resend API Key (pegar em https://resend.com/api-keys)
RESEND_API_KEY=re_...

# From email (configurar domínio no Resend)
RESEND_FROM_EMAIL=Nutzpay <noreply@nutzpay.com>

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Criar rotas de API

#### `/api/auth/verify-email` (GET)
```typescript
import { verifyEmailToken } from '@/lib/email/email-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect('/auth/login?error=invalid_token');
  }

  const result = await verifyEmailToken(token);

  if (result.success) {
    return NextResponse.redirect('/auth/login?verified=true');
  }

  return NextResponse.redirect('/auth/login?error=verification_failed');
}
```

#### `/api/auth/resend-verification` (POST)
```typescript
import { resendVerificationEmail } from '@/lib/email/email-service';

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  const result = await resendVerificationEmail(email);
  return NextResponse.json(result);
}
```

#### `/api/auth/send-2fa` (POST)
```typescript
import { send2FACode } from '@/lib/email/email-service';

export async function POST(request: NextRequest) {
  const { userId } = await request.json();
  const result = await send2FACode(userId);
  return NextResponse.json(result);
}
```

#### `/api/auth/verify-2fa` (POST)
```typescript
import { verify2FACode } from '@/lib/email/email-service';

export async function POST(request: NextRequest) {
  const { userId, code } = await request.json();
  const result = await verify2FACode(userId, code);
  return NextResponse.json(result);
}
```

### 4. Modificar `/api/auth/register/route.ts`

Adicionar após criar o usuário:
```typescript
// Send verification email
await sendEmailVerification(newUser.id);
```

### 5. Modificar `/api/auth/login/route.ts`

Trocar a lógica de login para:
```typescript
// Após validar email/senha:
const user = await prisma.user.findUnique({ where: { email } });

// Check if email is verified
if (!user.emailVerified) {
  return NextResponse.json({
    error: 'Email não verificado. Verifique sua caixa de entrada.',
    code: 'EMAIL_NOT_VERIFIED'
  }, { status: 403 });
}

// Send 2FA code
await send2FACode(user.id);

// Return requiring 2FA
return NextResponse.json({
  requiresTwoFactor: true,
  userId: user.id,
  message: 'Código de verificação enviado para seu e-mail'
});
```

### 6. Modificar `/api/backoffice/sellers/[id]/approve/route.ts`

Adicionar após aprovar:
```typescript
// Send account approved email
await sendAccountApprovedEmail(sellerId);
```

### 7. Criar página `/app/auth/verify-2fa/page.tsx`

```typescript
'use client';

import { useState } from 'react';

export default function Verify2FAPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const userId = sessionStorage.getItem('pending2faUserId');

    const response = await fetch('/api/auth/verify-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, code })
    });

    const data = await response.json();

    if (data.success) {
      // Complete login
      router.push('/dashboard');
    } else {
      alert('Código inválido');
    }

    setLoading(false);
  };

  return (
    <div>
      <h1>Verificação 2FA</h1>
      <p>Digite o código enviado para seu e-mail</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="000000"
        />
        <button type="submit" disabled={loading}>
          Verificar
        </button>
      </form>
      <p>Código master de emergência: 865911</p>
    </div>
  );
}
```

### 8. Criar página `/app/auth/verify-email/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (token) {
      // Token verification is done by the API route
      // This page just shows the result
      const verified = searchParams.get('verified');
      const error = searchParams.get('error');

      if (verified) {
        setStatus('success');
      } else if (error) {
        setStatus('error');
      }
    }
  }, [token, searchParams]);

  return (
    <div>
      {status === 'loading' && <p>Verificando seu e-mail...</p>}
      {status === 'success' && <p>✅ E-mail verificado com sucesso!</p>}
      {status === 'error' && <p>❌ Erro ao verificar e-mail</p>}
    </div>
  );
}
```

## 🧪 Como testar

1. **Registro:**
   - Criar nova conta
   - Verificar e-mail recebido
   - Clicar no link de verificação

2. **2FA:**
   - Fazer login com conta verificada
   - Receber código por e-mail
   - Inserir código (ou usar 865911)

3. **Aprovação:**
   - Admin aprovar seller PENDING
   - Seller recebe e-mail de aprovação

## 📋 Checklist de Deploy

- [ ] Criar conta no Resend (https://resend.com)
- [ ] Configurar domínio no Resend
- [ ] Adicionar RESEND_API_KEY no .env
- [ ] Aplicar migration no banco (local e produção)
- [ ] Testar envio de e-mails em desenvolvimento
- [ ] Criar rotas de API
- [ ] Criar páginas de UI
- [ ] Testar fluxo completo
- [ ] Deploy na VM

## 🔒 Segurança

- Tokens expiram em 24h
- Códigos 2FA expiram em 10min
- Código master 865911 deve ser removido em produção
- Todos os e-mails usam templates profissionais
- 2FA é obrigatório para todos os usuários
