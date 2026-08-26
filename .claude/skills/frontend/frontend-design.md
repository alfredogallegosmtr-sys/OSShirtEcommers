# Frontend Design - UI/UX Patterns & Systems

**Scope:** frontend
**Trigger:** cuando se diseñen interfaces, se mencionen design systems, atomic design, Tailwind, Material UI, o patrones de UI/UX
**Tools:** view, file_create, str_replace, bash_tool
**Version:** 1.0.0

> Nota: guía general. Los ejemplos usan TypeScript + Tailwind/MUI; este repo usa JSX + CSS por
> componente. Para la convención real ver `../../code-patterns.md`.

---

## Propósito

Esta skill te guía para crear interfaces de usuario profesionales y consistentes usando design systems, atomic design, y frameworks de UI modernos. Cubre desde fundamentos de diseño hasta implementación práctica con Tailwind, Material UI, y patrones enterprise.

## Cuándo Usar Esta Skill

- Crear design system desde cero
- Implementar atomic design
- Configurar Tailwind CSS o Material UI
- Diseñar componentes reutilizables
- Mantener consistencia visual
- Implementar responsive design
- Crear layouts complejos
- Accessibility (a11y) implementation

## Principios Fundamentales de UI/UX

1. **Consistency** - Mismos colores, typography, spacing; comportamientos predecibles.
2. **Hierarchy** - Tamaños de texto claros, contraste apropiado, espaciado intencional.
3. **Accessibility** - Contraste mínimo 4.5:1, keyboard navigation, screen reader, ARIA labels.
4. **Feedback** - Loading states, success/error messages, hover/active states, transiciones suaves.

## Atomic Design

```
Atoms -> Molecules -> Organisms -> Templates -> Pages
```

### 1. Atoms - Componentes Básicos

```tsx
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', disabled = false, onClick }) => {
  const baseStyles = 'font-medium rounded transition-colors';
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-base', lg: 'px-6 py-3 text-lg' };
  return (
    <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
};
```

```tsx
interface InputProps {
  type?: string; placeholder?: string; value: string;
  onChange: (value: string) => void; error?: string; label?: string;
}

export const Input: React.FC<InputProps> = ({ type = 'text', placeholder, value, onChange, error, label }) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`} />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);
```

### 2. Molecules - Combinación de Átomos

```tsx
export const SearchBar: React.FC<{ onSearch: (q: string) => void }> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  return (
    <div className="flex gap-2">
      <Input value={query} onChange={setQuery} placeholder="Search..." />
      <Button onClick={() => onSearch(query)}>Search</Button>
    </div>
  );
};
```

### 3. Organisms - Estructuras Complejas

```tsx
export const LoginForm: React.FC<{ onSubmit: (e: string, p: string) => void }> = ({ onSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email) e.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email is invalid';
    if (!password) e.password = 'Password is required';
    if (password.length < 6) e.password = 'Password must be 6+ chars';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => { ev.preventDefault(); if (validate()) onSubmit(email, password); };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Login</h2>
      <FormField label="Email" value={email} onChange={setEmail} error={errors.email} required />
      <FormField label="Password" value={password} onChange={setPassword} error={errors.password} required />
      <Button type="submit" className="w-full">Sign In</Button>
    </form>
  );
};
```

## Tailwind CSS

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' },
        secondary: { 500: '#6b7280', 600: '#4b5563' },
      },
      spacing: { '18': '4.5rem', '112': '28rem' },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
```

### Utility Classes Comunes

```tsx
// Layout
<div className="container mx-auto px-4">
<div className="flex justify-between items-center">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Spacing / Typography / Colors
<div className="p-4 m-2 mt-8 space-y-4">
<h1 className="text-4xl font-bold text-gray-900">
<div className="bg-blue-500 text-white border border-gray-300">

// Responsive / States
<div className="w-full md:w-1/2 lg:w-1/3">
<button className="hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50">
<input className="focus:ring-2 focus:ring-blue-500">
```

## Material UI (MUI)

```bash
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
```

```tsx
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: { main: '#1976d2', light: '#42a5f5', dark: '#1565c0' },
    secondary: { main: '#9c27b0' },
    error: { main: '#d32f2f' },
    background: { default: '#f5f5f5', paper: '#ffffff' },
  },
  typography: { fontFamily: 'Inter, Roboto, sans-serif', h1: { fontSize: '2.5rem', fontWeight: 600 }, button: { textTransform: 'none' } },
  spacing: 8,
  shape: { borderRadius: 8 },
});
```

## Design Patterns

### Card

```tsx
export const Card: React.FC<CardProps> = ({ title, subtitle, children, footer, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
    <div className="p-6 border-b border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
    </div>
    <div className="p-6">{children}</div>
    {footer && <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">{footer}</div>}
  </div>
);
```

### Modal

```tsx
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-xl font-semibold">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">X</button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};
```

### Toast / Notification

```tsx
export const Toast: React.FC<ToastProps> = ({ type, message, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
  const styles = { success: 'bg-green-500', error: 'bg-red-500', warning: 'bg-yellow-500', info: 'bg-blue-500' };
  return (
    <div className={`${styles[type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center justify-between`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 font-bold">X</button>
    </div>
  );
};
```

## Accessibility (a11y)

### Semantic HTML

```tsx
// BIEN
<nav><ul><li><a href="/">Home</a></li></ul></nav>
<main><article><h1>Page Title</h1><p>Content...</p></article></main>

// MAL - div soup
<div><div><div>Home</div></div></div>
```

### ARIA Labels

```tsx
<button aria-label="Close modal" onClick={onClose}>X</button>
<img src={user.avatar} alt={`${user.name}'s profile picture`} />
<input type="text" aria-describedby="email-error" aria-invalid={!!error} />
{error && <span id="email-error" role="alert">{error}</span>}
```

### Keyboard Navigation

```tsx
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') onClick();
  if (e.key === 'Escape') onClose();
};
<div role="button" tabIndex={0} onKeyDown={handleKeyDown} onClick={onClick}>Click me</div>
```

## Responsive Design

```tsx
// Mobile-first
<div className="w-full md:w-1/2 lg:w-1/3">
<p className="text-sm md:text-base lg:text-lg">
// Breakpoints Tailwind: sm 640px, md 768px, lg 1024px, xl 1280px, 2xl 1536px
```

## Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| Inconsistent spacing | Valores hardcoded | Usar design tokens |
| Poor contrast | Colores sin validar | WCAG checker (4.5:1 mínimo) |
| No keyboard access | Solo onClick | Agregar onKeyDown y tabIndex |
| Missing alt text | Olvidar accessibility | Siempre incluir alt |
| Div soup | No semantic HTML | Usar tags semánticos |

## Checklist de Validación

- [ ] Design tokens definidos (colors, spacing, typography)
- [ ] Componentes siguen atomic design
- [ ] Responsive en mobile, tablet, desktop
- [ ] Accessibility verificada (WAVE, aXe)
- [ ] Contrast ratio > 4.5:1
- [ ] Keyboard navigation funciona
- [ ] Alt text en todas las imágenes
- [ ] ARIA labels donde corresponde
- [ ] Loading/error states
- [ ] Focus states visibles

## Best Practices

1. Design tokens (centralizar valores)
2. Atomic design (componentes pequeños y reutilizables)
3. Mobile-first
4. Semantic HTML
5. Accessibility first
6. Consistent spacing (escala 8px, 16px, 24px...)
7. Typography scale coherente
8. Color system limitado y consistente
