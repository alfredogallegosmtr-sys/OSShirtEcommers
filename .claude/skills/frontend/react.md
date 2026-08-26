# React - Modern UI Development

**Scope:** frontend
**Trigger:** cuando se trabaje con React, se creen componentes, se use hooks, o se mencione desarrollo de UI con React
**Tools:** view, file_create, str_replace, bash_tool
**Version:** 1.0.0

> Nota: guía general (algunos ejemplos usan Vite / `import.meta.env`). Este repo (`ecommerce-app/`)
> usa Create React App y axios vía `apiClient`. Para la convención real ver `../../code-patterns.md`.

---

## Propósito

Esta skill te guía para crear aplicaciones React modernas usando las últimas versiones y mejores prácticas. Cubre desde setup hasta patrones avanzados de componentes, hooks, y optimización.

## Cuándo Usar Esta Skill

- Crear proyectos React desde cero
- Desarrollar componentes reutilizables
- Implementar hooks (useState, useEffect, customs)
- Configurar routing con React Router
- Manejar estado con Context API
- Optimizar performance de aplicaciones React
- Refactorizar componentes existentes
- Integrar con APIs backend

## Setup

```bash
# Vite (recomendado, más rápido)
npm create vite@latest my-app -- --template react

# Create React App (estable)
npx create-react-app my-app
```

### Estructura Recomendada

```
src/
├── components/   # common/ (Button, Input, Card, Modal), layout/, features/
├── pages/        # Home, About, Dashboard, Login
├── hooks/        # useAuth, useFetch, useForm
├── context/      # AuthContext, ThemeContext
├── services/     # api.js, authService.js
├── utils/        # helpers, formatters, validators
├── assets/
├── styles/
├── App.jsx
└── main.jsx
```

## Estructura de Componentes

### Componente Funcional Básico

```jsx
const Button = ({ children, onClick, variant = 'primary', disabled = false }) => {
  const baseStyles = 'px-4 py-2 rounded font-medium transition-colors';
  const variants = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {children}
    </button>
  );
};
export default Button;
```

### Componente con Estado

```jsx
import { useState, useEffect } from 'react';

const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch user');
        setUser(await response.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user found</div>;

  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
};
export default UserProfile;
```

## Hooks Esenciales

### useState

```jsx
const [count, setCount] = useState(0);
setCount(prev => prev + 1);                       // basarse en valor previo
setUser(prev => ({ ...prev, name: 'John' }));     // objeto
setItems(prev => [...prev, newItem]);             // array
```

### useEffect

```jsx
useEffect(() => { /* mount */ }, []);
useEffect(() => { fetchData(userId); }, [userId]); // al cambiar dependencia
useEffect(() => {
  const sub = subscribeToData();
  return () => sub.unsubscribe();                  // cleanup
}, []);
```

### Custom Hooks

```jsx
// useAuth
import { useState, useContext, createContext } from 'react';
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    setUser(data.user);
    localStorage.setItem('token', data.token);
  };
  const logout = () => { setUser(null); localStorage.removeItem('token'); };

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

```jsx
// useFetch
const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        setData(await response.json());
        setError(null);
      } catch (err) { setError(err.message); setData(null); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [url]);
  return { data, loading, error };
};
```

```jsx
// useForm
const useForm = (initialValues, validate) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => setValues(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleBlur = (e) => {
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
    if (validate) setErrors(validate(values));
  };
  const handleSubmit = (callback) => (e) => {
    e.preventDefault();
    const v = validate ? validate(values) : {};
    setErrors(v);
    if (Object.keys(v).length === 0) callback(values);
  };
  return { values, errors, touched, handleChange, handleBlur, handleSubmit };
};
```

## React Router

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

```jsx
// ProtectedRoute
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
};
export default ProtectedRoute;
```

## Optimización de Performance

```jsx
import { memo, useMemo, useCallback } from 'react';

// React.memo
const ExpensiveComponent = memo(({ data, onAction }) => { /* ... */ });

// useMemo
const filteredProducts = useMemo(() => products.filter(p => p.category === filter), [products, filter]);

// useCallback
const handleAddItem = useCallback((item) => setItems(prev => [...prev, item]), []);
```

## Patrones Comunes

### Compound Components

```jsx
const Tabs = ({ children, defaultActive = 0 }) => {
  const [activeIndex, setActiveIndex] = useState(defaultActive);
  return (
    <div className="tabs">
      {React.Children.map(children, (child, index) =>
        React.cloneElement(child, { isActive: index === activeIndex, onActivate: () => setActiveIndex(index) })
      )}
    </div>
  );
};
```

### Render Props

```jsx
const DataFetcher = ({ url, render }) => {
  const { data, loading, error } = useFetch(url);
  return render({ data, loading, error });
};

<DataFetcher url="/api/users" render={({ data, loading, error }) => {
  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;
  return <UserList users={data} />;
}} />
```

## Integración con APIs — `services/api.js`

```jsx
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Something went wrong');
  }
  return response.json();
};

export const api = {
  get: (endpoint) => fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
  }).then(handleResponse),
  post: (endpoint, data) => fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    body: JSON.stringify(data),
  }).then(handleResponse),
  put: (endpoint, data) => fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    body: JSON.stringify(data),
  }).then(handleResponse),
  delete: (endpoint) => fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
  }).then(handleResponse),
};
```

## Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| Infinite re-renders | useEffect sin dependencies | Agregar array de dependencias `[]` |
| State no actualiza | Mutación directa del estado | Spread operator: `{ ...state }` |
| Memory leak | useEffect sin cleanup | Retornar función de cleanup |
| Stale closure | Variables capturadas en closure | Usar refs o dependencies correctas |
| Props drilling | Pasar props por muchos niveles | Context API o state management |
| Key warnings | Missing/duplicate keys | IDs únicos, no índices |

## Checklist de Validación

- [ ] Nombre del componente en PascalCase
- [ ] Props desestructuradas con valores por defecto
- [ ] Estado sin mutación
- [ ] useEffect con array de dependencias correcto
- [ ] Funciones pesadas memoizadas (useMemo/useCallback)
- [ ] Manejo de estados: loading, error, success
- [ ] Keys únicas en listas
- [ ] No hay console.log en producción
- [ ] Componente reutilizable
- [ ] Responsive design (mobile-first)

## Best Practices

1. Componentes pequeños y enfocados (una responsabilidad)
2. Props bien tipadas (PropTypes o TypeScript)
3. Composición sobre herencia
4. Custom hooks para lógica compartida (DRY)
5. Lazy loading para rutas
6. Error boundaries
7. Accessibility (semantic HTML, ARIA)
8. Testing (hooks y componentes)
