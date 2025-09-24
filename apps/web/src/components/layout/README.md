# Sistema de Layout Reutilizável

Este sistema permite usar header e footer consistentes em todas as páginas da aplicação.

## Componentes Disponíveis

### 1. Header (`components/layout/Header.tsx`)
Header reutilizável com logo, menu de perfil e logout.

**Props:**
- `userType`: `'operator' | 'admin' | 'user'` - Define o tipo de usuário
- `showProfileMenu`: `boolean` - Exibe/oculta menu de perfil

### 2. Footer (`components/layout/Footer.tsx`)
Footer reutilizável com logo e links opcionais.

**Props:**
- `variant`: `'dark' | 'light'` - Tema do footer
- `showLinks`: `boolean` - Exibe/oculta links adicionais
- `compactMode`: `boolean` - Modo compacto (uma linha)

### 3. BaseLayout (`components/layout/BaseLayout.tsx`)
Layout base que combina Header + Footer + FloatingNav.

**Props:**
- Todas as props do Header e Footer
- `showFloatingNav`: `boolean` - Exibe/oculta navegação flutuante
- `maxWidth`: `string` - Largura máxima do conteúdo
- `className`: `string` - Classes CSS adicionais

## Layouts Pré-configurados

### DashboardLayout
Para páginas internas do dashboard.

```tsx
import { DashboardLayout } from '@/components/layout/BaseLayout';

export default function MyPage() {
  return (
    <DashboardLayout userType="operator">
      <h1>Minha Página</h1>
      <p>Conteúdo da página...</p>
    </DashboardLayout>
  );
}
```

### PublicLayout
Para páginas públicas (landing, login, etc).

```tsx
import { PublicLayout } from '@/components/layout/BaseLayout';

export default function HomePage() {
  return (
    <PublicLayout>
      <h1>Página Pública</h1>
      <p>Sem autenticação necessária...</p>
    </PublicLayout>
  );
}
```

### AdminLayout
Para páginas administrativas.

```tsx
import { AdminLayout } from '@/components/layout/BaseLayout';

export default function AdminPage() {
  return (
    <AdminLayout>
      <h1>Painel Admin</h1>
      <p>Funcionalidades administrativas...</p>
    </AdminLayout>
  );
}
```

### CompactLayout
Para páginas simples com footer compacto.

```tsx
import { CompactLayout } from '@/components/layout/BaseLayout';

export default function SettingsPage() {
  return (
    <CompactLayout userType="operator">
      <h1>Configurações</h1>
      <p>Página de configurações...</p>
    </CompactLayout>
  );
}
```

## Layout Customizado

Para casos específicos, use o `BaseLayout` diretamente:

```tsx
import { BaseLayout } from '@/components/layout/BaseLayout';

export default function CustomPage() {
  return (
    <BaseLayout
      userType="admin"
      showProfileMenu={true}
      footerVariant="light"
      showFooterLinks={true}
      compactFooter={false}
      showFloatingNav={false}
      maxWidth="max-w-4xl"
      className="custom-page"
    >
      <div className="space-y-8">
        <h1>Página Customizada</h1>
        <p>Layout totalmente personalizado...</p>
      </div>
    </BaseLayout>
  );
}
```

## Exemplos de Uso por Tipo de Página

### Dashboard Principal
```tsx
// src/app/dashboard/page.tsx
<DashboardLayout userType="operator">
  {/* Conteúdo do dashboard */}
</DashboardLayout>
```

### Configurações
```tsx
// src/app/dashboard/settings/page.tsx
<CompactLayout userType="operator">
  {/* Formulários de configuração */}
</CompactLayout>
```

### API Keys
```tsx
// src/app/dashboard/api-keys/page.tsx
<DashboardLayout userType="operator">
  {/* Tabela de API keys */}
</DashboardLayout>
```

### Painel Admin
```tsx
// src/app/admin/page.tsx
<AdminLayout>
  {/* Dashboard administrativo */}
</AdminLayout>
```

### Landing Page
```tsx
// src/app/page.tsx
<PublicLayout>
  {/* Hero section, features, etc */}
</PublicLayout>
```

### Login
```tsx
// src/app/login/page.tsx
<BaseLayout 
  showProfileMenu={false}
  footerVariant="light"
  showFooterLinks={false}
  compactFooter={true}
  showFloatingNav={false}
  maxWidth="max-w-md"
>
  {/* Formulário de login */}
</BaseLayout>
```

## Benefícios

✅ **Consistência**: Header e footer iguais em todas as páginas  
✅ **Reutilização**: Não precisa repetir código de layout  
✅ **Manutenibilidade**: Alterações em um local afetam todo o sistema  
✅ **Flexibilidade**: Diferentes configurações para diferentes tipos de página  
✅ **TypeScript**: Tipagem completa para todas as props  

## Migração de Páginas Existentes

1. **Remover** imports antigos: `FloatingNav`, código de header/footer
2. **Adicionar** import do layout: `import { DashboardLayout } from '@/components/layout/BaseLayout'`
3. **Envolver** conteúdo: `<DashboardLayout>{/* conteúdo */}</DashboardLayout>`
4. **Remover** estrutura antiga de layout
5. **Testar** a página

Exemplo de migração:

```tsx
// ANTES
export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <FloatingNav userType="operator" />
      <header>...</header>
      <main>
        <h1>Minha Página</h1>
      </main>
      <footer>...</footer>
    </div>
  );
}

// DEPOIS
export default function Page() {
  return (
    <DashboardLayout userType="operator">
      <h1>Minha Página</h1>
    </DashboardLayout>
  );
}
```

## Próximos Passos

1. Migrar todas as páginas existentes para usar os layouts
2. Criar páginas de exemplo para cada layout
3. Adicionar temas e customização avançada
4. Implementar breadcrumbs no header
5. Adicionar suporte a múltiplos idiomas