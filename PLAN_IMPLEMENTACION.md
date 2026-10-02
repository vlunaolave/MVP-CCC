# Plan de implementación — MVP CCC

Plataforma Integral de Inteligencia Empresarial para la Cámara de Comercio de Cali.

Este documento es solo el análisis y el plan. No hay aplicación, no hay dependencias instaladas y la fase 1 no está empezada.

Fuente del producto: brief del MVP (consulta, perfil, monitoreo, alertas, dashboard, grafo, timeline, administración). Datos simulados. Solo Registro Mercantil y ESAL.

Fuente de ingeniería: skills del usuario en el paquete `skills_39bc.zip` (arquitectura por features, Zustand, TanStack Query, Zod, Vitest, accesibilidad, React 19, Tailwind 4). Donde una skill cambia el brief, la decisión queda escrita en la sección siguiente.

---

## Decisiones por las skills (cambian arquitectura, stack, UI o calidad)

1. **Carpetas.** El brief propone `src/modules/`. Las skills exigen arquitectura por features: `src/app/` solo enruta, la UI vive en `src/features/<dominio>/` con barrel `index.ts`, y lo compartido vive en `src/shared/`. Un feature no importa carpetas internas de otro feature. Se adopta ese corte. La capa de servidor del brief (`services`, `repositories`, adaptadores) se conserva, porque las skills no cubren persistencia y el brief exige poder cambiar SQLite por una API sin tocar pantallas. Esa capa queda en `src/server/`, fuera de los features.

2. **Estado y datos.** Zustand solo para estado de cliente (sidebar, espejo de sesión). TanStack Query para todo fetch y mutación en Client Components. Prohibido `useEffect` para pedir datos. Los Server Components no usan TanStack Query: llaman servicios en el servidor. El cliente habla con los Route Handlers mediante Axios. Al mutar (monitorear, marcar leída, guardar usuario) se invalidan las query keys afectadas.

3. **Formularios.** Zod es la única librería de validación. Esquemas fuera del componente. El tipo del formulario sale de `z.infer`. No Yup, no Joi, no validación artesanal.

4. **Autorización de rutas.** En Next.js App Router la protección es `src/middleware.ts` con la cookie de sesión, no un guard solo de cliente. Un `RoleGuard` de cliente (Zustand) oculta bloques de UI. La API repite la misma matriz: ocultar un botón no es el control de acceso.

5. **Calidad.** TypeScript estricto, sin `any`. Componentes funcionales. Lógica de pantalla en hooks `use<Feature>`. `'use client'` solo en hojas interactivas. Imports en el orden de la skill (React, terceros, UI, `@/`, relativos, tipos). `data-testid` en nodos interactivos. Pruebas con Vitest y React Testing Library (rol accesible primero, AAA, estados loading / error / vacío). WCAG 2.1 AA: HTML semántico, `aria-label` en iconos, foco visible, foco atrapado en diálogos. No se generan README dentro de features.

6. **UI y la librería ITC.** Las skills exigen `itc-frontend-base` (`ItcButton`, `ItcInput`, `ItcForm`, `ItcTable`, `ItcTabs`, `ItcModal`, `ItcMenu`, `ItcBanner`, `ItcDateRangePicker`, `ItcGovcoBar`, `ItcAccessibilityToolbar`, etc.) y prohíben el HTML nativo si existe equivalente. El 2026-10-02 ese paquete responde **404** en el registro público de npm: no se puede instalar y el MVP debe quedar instalable solo con el README. **Decisión:** los primitivos instalables son los de **shadcn/ui** que pide el brief (Button, Input, Form, Table, Tabs, Dialog, Sheet, Select, Dropdown Menu, Tooltip, Badge, Card, Skeleton, Sonner). Se respetan las reglas de la skill que no dependen del paquete privado: labels, errores de Zod en el campo, `data-testid`, teclado, loading / empty / error, y nada de `<div onClick>`. Recharts y React Flow se mantienen: la librería ITC no trae gráfico ni grafo, y el brief los pide. No se copia la API de componentes ITC.

7. **README raíz.** La skill prohíbe README al crear un feature. El brief exige un README de producto con secciones fijas. Se escribe solo el README de la raíz, en la fase 9, cuando el flujo ya se puede describir con verdad.

8. **Versiones que fija la skill.** React 19 y Tailwind CSS 4. Next.js: App Router estable compatible con React 19 (el scaffold oficial, sin fijar un parche inventado).

---

## 1. Estructura encontrada

Repositorio git en `/workspace`, rama `main`, al día con `origin/main`.

| Hecho | Detalle |
| --- | --- |
| Único commit | `9ff7cdb` — «Initialize project» |
| Árbol de ese commit | Vacío. Cero archivos. |
| Working tree | Limpio antes de este plan. |
| `README.md` | No existe. |
| `package.json` | No existe. |
| Código, Prisma, tests, CI | No existen. |
| Lo único en disco | `.git/` y, a partir de este entregable, este archivo. |

No hay convenciones previas que preservar en código. El producto se crea desde cero siguiendo este plan.

---

## 2. Qué se mantiene

- Este archivo, `PLAN_IMPLEMENTACION.md`, en la raíz.
- La rama `main` y el commit vacío. No se reescribe la historia.
- El alcance del brief: MVP demostrable, no plataforma final.
- El stack de producto que las skills no sustituyen: Next.js (App Router, Route Handlers), TypeScript, Tailwind, shadcn/ui, Prisma, SQLite local con camino a PostgreSQL, Recharts, React Flow, autenticación local.
- Los dominios de negocio: auth, empresas, monitoreo, alertas, dashboard, grafo, timeline, administración.
- La separación UI / servicios / repositorios / adaptador de datos.
- Los tres roles, los tres usuarios demo, el caso INNOVA VALLE S.A.S. y una ESAL completa.
- Lo que el brief deja fuera (sección 11 de este plan).

No hay componentes, esquemas ni dependencias que «mantener»: no existen.

---

## 3. Qué se crea

### Árbol objetivo

```text
/workspace
├── PLAN_IMPLEMENTACION.md          # este plan; no es código de la app
├── README.md                       # fase 9; secciones del brief, sección 25
├── package.json
├── tsconfig.json                   # "strict": true
├── next.config.ts
├── postcss.config.mjs
├── components.json                 # shadcn/ui
├── eslint.config.mjs
├── vitest.config.ts
├── .env.example                    # DATABASE_URL y AUTH_SECRET locales
├── .gitignore                      # node_modules, .next, prisma/dev.db, .env
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                     # orquesta; no contiene el dataset
│   └── data/                       # dataset ficticio, único lugar de los datos demo
│       ├── companies.ts
│       ├── people.ts
│       ├── relations.ts
│       ├── establishments.ts
│       ├── events.ts
│       ├── alert-rules.ts
│       └── users.ts
└── src/
    ├── middleware.ts               # cookie + rol antes de renderizar
    ├── app/
    │   ├── globals.css             # tokens: fondo claro, azul institucional
    │   ├── layout.tsx              # fuentes, QueryClient, toasts, skip link
    │   ├── login/page.tsx
    │   ├── acceso-denegado/page.tsx
    │   ├── (app)/
    │   │   ├── layout.tsx          # shell: sidebar + header; solo compone features
    │   │   ├── page.tsx            # inicio
    │   │   ├── empresas/page.tsx
    │   │   ├── empresas/[id]/page.tsx
    │   │   ├── monitoreo/page.tsx
    │   │   ├── alertas/page.tsx
    │   │   ├── dashboard/page.tsx
    │   │   └── administracion/page.tsx
    │   └── api/
    │       ├── auth/login/route.ts
    │       ├── auth/logout/route.ts
    │       ├── auth/session/route.ts
    │       ├── empresas/route.ts
    │       ├── empresas/[id]/route.ts
    │       ├── empresas/[id]/grafo/route.ts
    │       ├── monitoreo/route.ts
    │       ├── monitoreo/[companyId]/route.ts
    │       ├── alertas/route.ts
    │       ├── alertas/[id]/route.ts
    │       ├── dashboard/route.ts
    │       ├── admin/usuarios/route.ts
    │       ├── admin/usuarios/[id]/route.ts
    │       ├── admin/roles/route.ts
    │       └── admin/configuracion/route.ts
    ├── features/
    │   ├── auth/                   # api, components, hooks, store, types, index.ts
    │   ├── home/
    │   ├── companies/
    │   ├── monitoring/
    │   ├── alerts/
    │   ├── dashboard/
    │   ├── graph/
    │   ├── timeline/
    │   └── administration/
    ├── server/
    │   ├── auth/                   # proveedores local / oidc / oauth2 / saml
    │   ├── services/
    │   ├── repositories/           # interfaces + Sqlite* + stub Api*
    │   └── adapters/               # DataSourceAdapter y tres implementaciones
    ├── shared/
    │   ├── components/             # AppShell, RoleGuard, estados, ui/ de shadcn
    │   ├── hooks/
    │   ├── lib/                    # prisma, axios, query-client, cn, permissions
    │   ├── types/
    │   └── utils/                  # fechas, NIT, antigüedad, resumen determinístico
    └── assets/
```

Cada `page.tsx` exporta metadata y renderiza un componente de feature. No contiene consultas ni JSX de negocio.

Cada feature expone solo su `index.ts`. Ejemplo: `@/features/companies`, nunca `@/features/companies/components/...`.

### Convenciones que nacen con el árbol

- Identificadores de prueba: `login-submit`, `company-search`, `company-row`, `company-monitor`, `alert-mark-read`, `dashboard-filter-municipio`.
- Query keys: `['companies', filters]`, `['company', id]`, `['monitoring', userId]`, `['alerts', filters]`, `['dashboard', filters]`, `['admin', 'users']`.
- Copy de interfaz en español. Nombres de código en inglés (`Company`, `monitoredCompany`), como los campos del brief.
- Puerto de desarrollo previsto: `43123` (`next dev --port 43123`), para no chocar con 3000.

---

## 4. Dependencias

Solo lo que el MVP usa. No hay base de datos externa, ni proveedor de identidad, ni SDK de nube.

### Runtime

| Paquete | Para qué |
| --- | --- |
| `next` | App Router, Server Components y Route Handlers |
| `react`, `react-dom` | UI. React 19, como pide la skill |
| `typescript` | Tipado estricto |
| `@prisma/client` | Acceso a SQLite desde servicios y repositorios |
| `zod` | Única validación: login, filtros, formularios de admin, bodies de API |
| `bcryptjs` | Hash de la contraseña local. Sin módulo nativo |
| `axios` | Cliente HTTP de los features hacia `/api`. Instancia con `withCredentials` |
| `@tanstack/react-query` | Caché, mutaciones e invalidación en el cliente |
| `zustand` | Sidebar y espejo de la sesión. La cookie sigue siendo la fuente de verdad |
| `lucide-react` | Iconos únicos en sidebar, estados y acciones |
| `recharts` | Seis gráficos del dashboard |
| `@xyflow/react` | Grafo (paquete actual de React Flow) |
| `date-fns` | Fechas visibles, antigüedad y eje temporal |
| `sonner` | Toast. Texto fijo al monitorear |
| `clsx`, `tailwind-merge`, `class-variance-authority` | `cn()` y variantes, acompañan a shadcn |
| `tailwindcss` 4 y `@tailwindcss/postcss` | Estilos utility-first |
| Radix que instale shadcn (`@radix-ui/react-dialog`, `tabs`, `select`, `dropdown-menu`, `tooltip`, `label`, `slot`, `separator`, `popover`) | Comportamiento accesible de diálogos, pestañas y menús |
| `react-hook-form`, `@hookform/resolvers` | Enlace de shadcn Form con el esquema Zod. No valida por su cuenta: el esquema es Zod. Existe porque `ItcForm` no se puede instalar |

### Desarrollo

| Paquete | Para qué |
| --- | --- |
| `prisma` | Migraciones y seed |
| `tsx` | Ejecutar `prisma/seed.ts` |
| `@types/node`, `@types/bcryptjs`, `@types/react`, `@types/react-dom` | Tipos |
| `eslint`, `eslint-config-next` | Lint del App Router |
| `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` | Pruebas de la skill, fase 9 |

### Componentes shadcn a añadir (no son dependencias sueltas)

Button, Input, Label, Form, Table, Tabs, Dialog, Sheet, Select, Dropdown Menu, Tooltip, Badge, Card, Separator, Skeleton, Sonner, Popover.

### No se instala

`itc-frontend-base` (no está en npm), NextAuth, Redux, Yup, Jest, una segunda librería de iconos, drivers de PostgreSQL en el MVP (el cambio de provider queda documentado, no cableado), librerías de Excel, AWS, OpenTelemetry.

### Variables locales (`.env.example`)

- `DATABASE_URL="file:./dev.db"`
- `AUTH_SECRET` con un valor de desarrollo generado en el README, no un secreto real de la Cámara.
- `AUTH_PROVIDER="local"`.

Si faltan, la app no llama a ningún servicio externo: el fallback es esta base local.

---

## 5. Modelo de datos

Prisma, provider `sqlite`. Identificadores `String @id @default(uuid())`. Fechas `DateTime`. Dinero `Decimal`. `metadata` como `Json`. Esos tipos existen en PostgreSQL: el cambio futuro es `provider = "postgresql"` y `DATABASE_URL`, sin tocar servicios.

`estadoMatricula` es la situación de la matrícula (lo que ve la tabla). `estado` es la situación jurídica de la persona jurídica. No se usan como sinónimos.

### Enums

| Enum | Valores |
| --- | --- |
| `TipoRegistro` | `MERCANTIL`, `ESAL` |
| `EstadoMatricula` | `ACTIVA`, `SUSPENDIDA`, `CANCELADA`, `INACTIVA` |
| `EstadoJuridico` | `VIGENTE`, `EN_LIQUIDACION`, `DISUELTA`, `INACTIVA` |
| `TamanoEmpresa` | `MICRO`, `PEQUENA`, `MEDIANA`, `GRANDE` |
| `RolCodigo` | `ADMINISTRADOR`, `ANALISTA`, `CONSULTOR` |
| `Severidad` | `INFORMATIVA`, `ATENCION`, `IMPORTANTE` |
| `TipoRelacion` | `REPRESENTANTE_LEGAL`, `SOCIO`, `ESTABLECIMIENTO`, `PERSONA_OTRA_EMPRESA`, `EMPRESA_RELACIONADA` |
| `TipoEvento` | `CONSTITUCION`, `MATRICULA`, `RENOVACION`, `CAMBIO_REPRESENTANTE`, `CAMBIO_DOMICILIO`, `MODIFICACION_ACTIVIDAD`, `CAMBIO_ESTADO_MATRICULA`, `CAMBIO_TIPO_ORGANIZACION`, `APERTURA_ESTABLECIMIENTO`, `OTRO_REGISTRAL` |
| `CondicionRegla` | `CAMBIO`, `IGUAL_A`, `DISTINTO_DE` |
| `AccionAuditoria` | `LOGIN`, `LOGOUT`, `CONSULTA_EMPRESA`, `INICIO_MONITOREO`, `FIN_MONITOREO`, `LECTURA_ALERTA`, `CAMBIO_ADMINISTRATIVO` |
| `ProveedorAuth` | `LOCAL`, `OIDC`, `OAUTH2`, `SAML` |

`tipoOrganizacion` es `String` (S.A.S., LTDA, S.A., Fundación, Asociación, Corporación). No es enum para no migrar cada variante del seed.

### Entidades

**User** — quien entra.

`id`, `email` único, `nombre`, `passwordHash`, `rol` (`RolCodigo`), `activo`, `createdAt`, `updatedAt`.

Relaciones: sesiones, identidades, monitoreos, auditoría.

**AuthIdentity** — deja el usuario listo para un IdP sin rehacer `User`.

`id`, `userId`, `proveedor` (`ProveedorAuth`), `subject` (en local = `userId`), `createdAt`.

Único `(proveedor, subject)`. En el MVP solo filas `LOCAL`.

**Session** — sesión opaca. La cookie guarda el id, no el usuario.

`id`, `userId`, `proveedor`, `expiresAt`, `createdAt`.

**Role** — fila de catálogo para la pantalla Administración. No es un editor de políticas.

`id`, `codigo` (`RolCodigo` único), `nombre`, `descripcion`.

**Permission** — `id`, `codigo` único, `descripcion`, `modulo`.

Códigos: `inicio.ver`, `empresas.consultar`, `empresas.perfil`, `empresas.relaciones`, `empresas.timeline`, `empresas.grafo`, `empresas.monitorear`, `monitoreo.ver`, `alertas.ver`, `alertas.marcar_leida`, `dashboard.ver`, `admin.usuarios`, `admin.roles`, `admin.configuracion`.

**RolePermission** — `roleId`, `permissionId`. Clave primaria compuesta. Sembrada, no editable en el MVP. El middleware y los servicios leen el mismo mapa en `src/shared/lib/permissions.ts` (mismos códigos). La pantalla de roles solo muestra esta tabla.

**Company** — ficha de referencia. Campos del brief, sin recortar.

`id`, `nit` único, `razonSocial`, `nombreComercial`, `tipoOrganizacion`, `tipoRegistro`, `estadoMatricula`, `numeroMatricula`, `fechaMatricula`, `fechaRenovacion`, `camaraComercio`, `municipio`, `departamento`, `direccion`, `telefono`, `email`, `sitioWeb`, `actividadEconomicaCodigo`, `actividadEconomicaDescripcion`, `tamanoEmpresa`, `numeroEmpleados` (Int, opcional), `capital` (Decimal, opcional), `activos` (Decimal, opcional), `fechaConstitucion`, `estado` (`EstadoJuridico`), `representanteLegal` (texto de la ficha, coherente con la relación vigente), `fechaUltimaActualizacion`.

Índices: `nit`, `razonSocial`, `nombreComercial`, `tipoRegistro`, `estadoMatricula`, `municipio`, `actividadEconomicaCodigo`, `tamanoEmpresa`.

**Person** — solo personas ficticias ligadas a empresas. No es un directorio de ciudadanos.

`id`, `nombre`, `tipoDocumento` (`CC` ficticio), `numeroDocumento` ficticio.

**Establishment**

`id`, `companyId`, `nombre`, `direccion`, `municipio`, `departamento`, `estado` (`String`: `ABIERTO` o `CERRADO`).

**CompanyRelation** — única fuente del grafo y de la pestaña Relaciones. No se infieren aristas.

`id`, `companyId` (empresa origen), `tipo` (`TipoRelacion`), `personId` opcional, `relatedCompanyId` opcional, `establishmentId` opcional, `descripcion`, `porcentajeParticipacion` (Decimal, opcional), `fechaInicio`, `fechaFin` opcional, `vigente`.

Regla de integridad en el servicio (Zod + comprobación): `REPRESENTANTE_LEGAL` y `SOCIO` exigen `personId`; `ESTABLECIMIENTO` exige `establishmentId`; `EMPRESA_RELACIONADA` exige `relatedCompanyId`; `PERSONA_OTRA_EMPRESA` exige `personId` y esa persona ya está ligada a otra empresa. El grafo dibuja solo estas filas.

**TimelineEvent**

`id`, `companyId`, `tipo` (`TipoEvento`), `fecha`, `titulo`, `descripcion`, `fuente` (`REGISTRO_MERCANTIL` o `ESAL`), `metadata` (`valorAnterior`, `valorNuevo` cuando aplica).

**AlertRule** — reglas demo, desacopladas de una normativa CCC.

`id`, `nombre`, `descripcion`, `tipoEvento`, `campoObservado`, `condicion`, `valorReferencia` opcional, `severidad`, `activa`, `esDemostrativa` (siempre `true` en el seed).

Las seis reglas:

| Nombre | tipoEvento | campoObservado | condicion | severidad |
| --- | --- | --- | --- | --- |
| Cambio de representante legal | `CAMBIO_REPRESENTANTE` | `representanteLegal` | `CAMBIO` | `IMPORTANTE` |
| Cambio del estado de matrícula | `CAMBIO_ESTADO_MATRICULA` | `estadoMatricula` | `CAMBIO` | `IMPORTANTE` |
| Nueva renovación | `RENOVACION` | `fechaRenovacion` | `CAMBIO` | `INFORMATIVA` |
| Cambio de dirección | `CAMBIO_DOMICILIO` | `direccion` | `CAMBIO` | `ATENCION` |
| Cambio de actividad económica | `MODIFICACION_ACTIVIDAD` | `actividadEconomicaCodigo` | `CAMBIO` | `ATENCION` |
| Modificación del tipo de organización | `CAMBIO_TIPO_ORGANIZACION` | `tipoOrganizacion` | `CAMBIO` | `ATENCION` |

`valorReferencia` queda en null mientras la condición sea `CAMBIO`. El campo existe para una regla oficial futura (`IGUAL_A` / `DISTINTO_DE`).

**Alert**

`id`, `companyId`, `ruleId`, `tipo` (copia del `tipoEvento`), `titulo`, `descripcion`, `severidad`, `fecha`, `leida` (Boolean, default false), `metadata` Json.

Índice `(leida, fecha)` y `(companyId, fecha)`.

**MonitoredCompany** — seguimiento por usuario, no global.

`id`, `userId`, `companyId`, `fechaInicio`. Único `(userId, companyId)`.

**AuditLog**

`id`, `userId`, `accion`, `entidad`, `entidadId` opcional, `fecha`, `metadata` Json.

La home «consultadas recientemente» lee `CONSULTA_EMPRESA` de este log. No hay otra tabla de recientes.

**AppSetting** — pantalla Configuración.

`id`, `clave` única, `valor`, `descripcion`.

Claves del seed: `plataforma.nombre`, `camara.nombre`, `demo.aviso` (texto de que los datos son simulados).

### Relaciones (resumen)

- User 1—N Session, AuthIdentity, MonitoredCompany, AuditLog.
- Role 1—N User (por `rol` / `codigo`) y N—N Permission vía RolePermission.
- Company 1—N Establishment, CompanyRelation, TimelineEvent, Alert, MonitoredCompany.
- Company N—1 Company a través de `CompanyRelation.relatedCompanyId` (empresa relacionada).
- Person 1—N CompanyRelation.
- AlertRule 1—N Alert.
- Establishment 1—N CompanyRelation cuando el tipo es establecimiento.

### Motor de alertas (simple, en el seed y reutilizable)

`evaluateDemoRules(event, rules)` vive en `src/server/services/alert-rules.ts`. Si el `tipoEvento` del evento coincide con una regla `activa` y la condición `CAMBIO` ve `valorAnterior !== valorNuevo` en metadata, produce una alerta. El seed recorre los eventos y persiste el resultado. No hay job ni tiempo real. Sustituir las reglas oficiales es cambiar filas `AlertRule` y esta función, no las pantallas.

Severidad visible, con esas palabras: Informativa, Atención, Importante.

---

## 6. Rutas y quién las ve

La sesión ausente en una ruta de la app redirige a `/login`. Un rol sin permiso redirige a `/acceso-denegado`. El consultor no ve en el sidebar lo que no puede abrir.

| Ruta | Qué es | Administrador | Analista | Consultor | Anónimo |
| --- | --- | --- | --- | --- | --- |
| `/login` | Credenciales locales | si ya hay sesión, va a `/` | igual | igual | sí |
| `/acceso-denegado` | Explicación corta y vuelta al inicio | sí | sí | sí | redirige a login |
| `/` | Inicio post-login | sí | sí | sí, sin bloques de monitoreo ni alertas | no |
| `/empresas` | Buscador | sí | sí | sí | no |
| `/empresas/[id]` | Perfil | todas las pestañas | todas las pestañas | solo Resumen e Información registral | no |
| `/monitoreo` | Lista de seguimiento del usuario | sí | sí | no | no |
| `/alertas` | Centro de alertas | sí | sí | no | no |
| `/dashboard` | KPIs y gráficos | sí | sí | sí, solo lectura | no |
| `/administracion` | Usuarios, roles, configuración | sí | no | no | no |

Pestañas del perfil (misma ruta, no hay URL aparte para grafo ni timeline):

| Pestaña | Administrador y analista | Consultor |
| --- | --- | --- |
| Resumen | sí | sí |
| Información registral | sí | sí |
| Relaciones | sí, y desde ahí el grafo | oculta |
| Timeline | sí | oculta |
| Alertas | sí | oculta |

El botón Monitorear existe para administrador y analista. En el consultor no se renderiza.

### Route Handlers

Misma matriz, comprobada en el servidor. Respuesta `401` sin sesión y `403` sin permiso.

| Método y ruta | Uso | Roles |
| --- | --- | --- |
| `POST /api/auth/login` | Email, contraseña, crea Session y cookie | público |
| `POST /api/auth/logout` | Cierra sesión y escribe auditoría | autenticado |
| `GET /api/auth/session` | Usuario, rol y permisos para el espejo Zustand | autenticado |
| `GET /api/empresas` | Búsqueda y filtros | los tres |
| `GET /api/empresas/[id]` | Ficha, relaciones y timeline según permiso | ficha: los tres; relaciones y timeline: admin y analista |
| `GET /api/empresas/[id]/grafo` | Nodos y aristas ya persistidos | admin y analista |
| `GET /api/monitoreo` | Seguimiento del usuario en sesión | admin y analista |
| `POST /api/monitoreo` | Agregar `{ companyId }` | admin y analista |
| `DELETE /api/monitoreo/[companyId]` | Quitar | admin y analista |
| `GET /api/alertas` | Filtros y contador de no leídas | admin y analista |
| `PATCH /api/alertas/[id]` | `{ leida: true }` | admin y analista |
| `GET /api/dashboard` | KPIs y series ya agregadas | los tres |
| `GET/POST /api/admin/usuarios` | Listar y crear | administrador |
| `PATCH /api/admin/usuarios/[id]` | Editar, activar, desactivar | administrador |
| `GET /api/admin/roles` | Roles y permisos de solo lectura | administrador |
| `GET/PATCH /api/admin/configuracion` | `AppSetting` | administrador |

No hay ruta de grafo ni de timeline en el sidebar.

---

## 7. Autenticación local, lista para OIDC, OAuth y SAML

Contrato en `src/server/auth/auth-provider.ts`:

```ts
interface AuthProvider {
  readonly id: 'local' | 'oidc' | 'oauth2' | 'saml';
  authenticate(input: unknown): Promise<{ userId: string }>;
}
```

- `LocalCredentialsProvider` — el único que funciona. Compara email y `bcryptjs`. Escribe `Session` con `proveedor = LOCAL` y `AuthIdentity` local.
- `OidcAuthProvider`, `OAuth2AuthProvider`, `SamlAuthProvider` — clases que implementan el contrato y lanzan un error tipado `AuthProviderNotEnabled`. No hay endpoints, certificados ni redirects. Existen para que el día del IdP se registre otro proveedor y se cree la misma `Session`.
- Un registro `getAuthProvider(id)` lee `AUTH_PROVIDER`. El valor de este MVP es `local`.

Cookie `ccc_session`: httpOnly, `SameSite=Lax`, `Path=/`, caduca con `Session.expiresAt` (12 horas). No va en `localStorage`. Zustand se llena con `GET /api/auth/session` al montar el shell.

Login fallido: mensaje único «Correo o contraseña incorrectos.» Sin decir cuál falló. Usuario `activo = false`: «Esta cuenta está desactivada.» y no abre sesión.

Cada login y logout escribe `AuditLog`.

Contraseña de demostración, igual para las tres cuentas y solo en el README: `CccDemo.2026`. En la base va el hash.

| Correo | Rol |
| --- | --- |
| `admin@demo.ccc` | Administrador |
| `analista@demo.ccc` | Analista |
| `consultor@demo.ccc` | Consultor |

---

## 8. DataSourceAdapter y repositorios intercambiables

Dos capas, a propósito.

**Entrada de la referencia** (cómo llegan empresas, personas, relaciones y eventos):

```ts
interface DataSourceAdapter {
  loadReferenceData(): Promise<ReferenceDataset>;
}
```

- `DemoDataSourceAdapter` — lee `prisma/data/*` y devuelve el dataset ficticio. El seed es su único llamador: borra tablas de negocio en orden seguro y persiste con Prisma. También ejecuta `evaluateDemoRules` y deja monitoreos, usuarios y auditoría inicial.
- `ApiDataSourceAdapter` — mismo contrato, método que lanza `DataSourceNotImplemented`. Comentario de una línea: aquí entraría Registro Mercantil o ESAL reales.
- `FileDataSourceAdapter` — igual, sin parser. El comentario nombra JSON, Excel, archivo y portal como orígenes futuros, no como formatos implementados.

**Lectura y escritura de la app** (lo que usan los servicios):

Interfaces: `CompanyRepository`, `RelationRepository`, `TimelineRepository`, `MonitoringRepository`, `AlertRepository`, `DashboardRepository`, `UserRepository`, `AuditRepository`, `SettingsRepository`.

Cada una tiene `Sqlite*Repository` (Prisma). `ApiCompanyRepository` implementa `CompanyRepository` y lanza `RepositoryNotImplemented`. No está registrada en el contenedor de servicios. El servicio recibe la interfaz; cambiar de SQLite a API es registrar otra clase, no editar páginas.

Los features no importan Prisma ni los adaptadores.

`DashboardRepository` devuelve agregados (conteos y series), no filas crudas para que el gráfico las calcule mal en el cliente.

---

## 9. Seed

Comando previsto: `npx prisma db seed`. Idempotente: vacía y vuelve a cargar. Aviso visible en la app (`AppSetting.demo.aviso`): los datos son simulados y no identifican personas ni empresas reales.

Volúmenes: 22 empresas, 13 personas, relaciones de todas las que tengan vínculo, 36 eventos o más, 16 alertas o más, monitoreos, 3 usuarios, 6 reglas, roles y permisos, 3 ajustes.

### Caso principal — INNOVA VALLE S.A.S.

| Campo | Valor |
| --- | --- |
| NIT | `901847263-1` |
| Razón social | INNOVA VALLE S.A.S. |
| Nombre comercial | Innova Valle |
| Organización / registro | S.A.S. / `MERCANTIL` |
| Matrícula | `543210-1`, estado `ACTIVA`, cámara Cámara de Comercio de Cali |
| Matrícula / renovación | 2018-03-12 / 2026-03-02 |
| Constitución | 2018-02-20 |
| Lugar | Carrera 100 # 16-20, Oficina 804, Cali, Valle del Cauca |
| Contacto ficticio | `6025550190`, `contacto@innovavalle.demo`, `https://innovavalle.demo` |
| Actividad | CIIU `6201`, desarrollo de sistemas informáticos |
| Tamaño | `MEDIANA`, 48 empleados |
| Capital / activos | 180000000 / 940000000 |
| Estado jurídico | `VIGENTE` |
| Representante legal | Mariana Restrepo Quintero |
| Actualización | fecha del evento más reciente |

Relaciones vigentes, solo las sembradas:

- Representante legal: Mariana Restrepo Quintero.
- Socios: Mariana Restrepo Quintero 60 %, Andrés Felipe Caicedo Ríos 40 %.
- Establecimiento: Innova Valle Lab, Calle 64N # 5B-20, Cali, abierto.
- Empresa relacionada: Nube del Pacífico S.A.S.
- Histórica, no vigente: Helena Suárez Patiño fue representante hasta 2024-01-16.

Eventos, en este orden: constitución, matrícula, renovaciones anuales 2019–2022, cambio de domicilio (2022-11-03, de Carrera 5 # 12-40 a la dirección actual), renovación 2023, cambio de actividad (2023-08-21, `6202` a `6201`), cambio de representante (2024-01-16, Helena a Mariana), renovaciones 2024, 2025 y 2026, apertura del establecimiento (2024-06-01).

Alertas que salen de esas reglas (mínimo tres; aquí cuatro): cambio de domicilio (Atención), cambio de actividad (Atención), cambio de representante (Importante), renovación 2026 (Informativa). Monitoreo activo para el analista y para el administrador.

El resumen empresarial solo arma frases con campos presentes: matrícula activa, renovada en 2026, antigüedad desde 2018-02-20, S.A.S., CIIU 6201, Cali, mediana, 48 empleados. Si un campo viniera nulo, esa frase no aparece. No se redacta análisis de crédito ni proyecciones.

### ESAL completa — Fundación Horizonte del Pacífico

| Campo | Valor |
| --- | --- |
| NIT | `900554812-4` |
| Organización / registro | Fundación / `ESAL` |
| Matrícula | `887711-2`, `ACTIVA`, misma cámara |
| Constitución / matrícula / renovación | 2015-06-08 / 2015-07-01 / 2026-02-18 |
| Lugar | Calle 9 # 44-18, Cali, Valle del Cauca |
| Actividad | CIIU `8559`, otros tipos de educación |
| Tamaño | `PEQUENA`, 16 personas |
| Estado jurídico | `VIGENTE` |
| Representante | Lucía Elena Vargas Mora |
| Capital / activos | null / null (el perfil muestra «Sin información financiera disponible», no ceros inventados) |

Relaciones: representante Lucía Elena Vargas Mora; miembro fundador Camilo Andrés Muñoz Díaz; establecimiento Sede Horizonte, misma dirección. Eventos: constitución, registro ESAL, renovaciones, cambio de domicilio (2021-09-14), cambio de representante (2023-04-02, de un nombre anterior del seed a Lucía). Alertas: domicilio (Atención) y renovación 2026 (Informativa). El analista la tiene en monitoreo.

### Resto del padrón (20 empresas además de las dos anteriores suman 22)

Todas ficticias, actividades y ciudades distintas, mezcla de estados. Nombres:

1. Nube del Pacífico S.A.S. — mercantil, Cali, pequeña, activa. Relacionada con Innova.
2. Andes Logística del Valle S.A.S. — Yumbo, mediana, activa.
3. Café de Ladera LTDA — Palmira, micro, activa.
4. Taller Brío Industrial S.A. — Yumbo, grande, activa.
5. Mercado Verde del Pacífico S.A.S. — Cali, pequeña, matrícula suspendida.
6. Rutas del Río Transportes S.A.S. — Buenaventura, mediana, activa.
7. Bienestar Limonar S.A.S. — Cali, pequeña, activa.
8. Editorial Marea Alta S.A.S. — Jamundí, micro, matrícula cancelada.
9. AgroSiembra del Cauca S.A.S. — Puerto Tejada, pequeña, activa.
10. Constructora Ladrillo Norte LTDA — Cali, mediana, activa.
11. Asociación de Recicladores Nueva Vida — ESAL, Cali, micro, activa.
12. Corporación Cultural Faro del Valle — ESAL, Buga, pequeña, activa.
13. Textiles Alma de Caña S.A.S. — Palmira, mediana, matrícula inactiva.
14. Instalaciones Barrio Norte S.A.S. — Cali, pequeña, activa. Incluye un evento de cambio de tipo de organización (LTDA a S.A.S.) para que esa regla tenga alerta.
15. Panadería Horno de La Merced S.A.S. — Cali, micro, activa.
16. Consultores Punto Fijo LTDA — Tuluá, pequeña, activa.
17. FríoAndino Alimentos S.A.S. — Cartago, mediana, activa.
18. Fundación Semilla Educativa — ESAL, Jamundí, micro, activa.
19. Metalforma Occidente S.A. — Yumbo, grande, activa. Incluye cambio de estado de matrícula para cubrir esa regla.
20. Servicios Portuarios Bahía Demo S.A.S. — Buenaventura, pequeña, matrícula suspendida.

Personas adicionales hasta 13, todas ficticias, repartidas como representantes o socios de estas empresas. Ningún NIT, cédula, teléfono o correo corresponde a un dato real a propósito: dominios `.demo` y números `602555xxxx`.

Monitoreo del analista: Innova, Fundación Horizonte, Nube del Pacífico, Metalforma Occidente, Rutas del Río. Administrador: Innova y Fundación Horizonte. Consultor: ninguno, para que su home no finja un seguimiento.

Auditoría inicial: el analista ya consultó Innova y la fundación, así el bloque «consultadas recientemente» no nace vacío.

---

## 10. UX y criterio de terminación

### Interfaz

Fondo blanco y grises muy claros. Un azul institucional como color de acción y de ítem activo (token `--primary` en `globals.css`, cercano a un azul de confianza, sin copiar la marca de un producto Microsoft). Ámbar solo para Atención, un azul más oscuro para Importante, verde contenido para matrícula activa. Nada de paleta arcoíris ni de modo oscuro.

Sidebar: Inicio, Empresas, Monitoreo, Alertas, Dashboard, Administración. Ítems filtrados por permiso. En viewport estrecho, el sidebar pasa a un Sheet y el botón que lo abre tiene `aria-label`.

Header: buscador «Busca una empresa por NIT o razón social» (lleva a `/empresas?q=`), campana con el número de alertas no leídas (oculta para el consultor), nombre y rol.

Tarjetas con borde suave, radio moderado y sombra ligera. Tablas con las columnas pedidas, no un volcado de todos los campos. Iconos Lucide, un mismo tamaño.

Inicio: saludo con el nombre («Buenos días, Ana López» según la hora y el `nombre` del usuario). KPIs: empresas disponibles, monitoreadas (del usuario), alertas no leídas recientes. Tres bloques: consultadas recientemente, alertas recientes, bajo monitoreo. El consultor ve disponibles y consultadas; los otros dos bloques se reemplazan por una frase de alcance («Tu rol no incluye monitoreo ni alertas.»), no por controles muertos.

Buscador: NIT, razón social o nombre comercial, más filtros de tipo de registro, estado de matrícula, municipio, actividad y tamaño. Columnas: Empresa, NIT, Tipo, Actividad, Ciudad, Estado, Última actualización. Acciones: Ver perfil y, si hay permiso, Monitorear. Vacío de verdad: «Ninguna empresa coincide con la búsqueda.» Error con botón Reintentar.

Perfil: encabezado con razón social, NIT, estado, tipo de registro, actividad, ciudad y la acción de monitoreo. Resumen con las tarjetas del brief más el párrafo determinístico. Registral en grupos: Identificación, Registro, Ubicación, Actividad económica, Información financiera disponible, Representación legal. Relaciones: lista de las filas existentes y el lienzo del grafo. Timeline: línea vertical, fecha, tipo, descripción, fuente y filtro por tipo.

Grafo: nodos con forma o etiqueta distinta para Empresa, Persona, Representante legal, Socio, Establecimiento y Empresa relacionada. Zoom, arrastre, selección y panel lateral con el detalle de ese nodo. Sin métricas de red.

Monitoreo: empresa, NIT, fecha de inicio, última actualización, cantidad de alertas, estado. Acciones reales: abrir, ver alertas, quitar (diálogo de confirmación). Filtros por texto y estado.

Alertas: filtros de fecha, empresa, tipo, severidad y leída. Columnas Empresa, Evento, Descripción, Fecha, Severidad. Acciones: marcar leída, abrir perfil, ver detalle en diálogo. La campana baja al marcar.

Dashboard: cinco KPI (consultadas, monitoreadas, alertas generadas, mercantil, ESAL) y seis gráficos Recharts (por tipo, por estado, por actividad, alertas por tipo, alertas en el tiempo, monitoreadas por municipio). Filtros globales: fecha, tipo de registro, municipio, estado. Un filtro vacío muestra el empty state del gráfico, no un eje inventado.

Administración: tabla de usuarios (crear, editar, activar o desactivar; no se borra al administrador semilla si es el único activo). Roles en solo lectura. Configuración edita las tres claves de `AppSetting`.

Toast exacto al monitorear: «Empresa agregada al monitoreo correctamente.» Al quitar: «Empresa retirada del monitoreo.» Los demás toasts son frases cortas del mismo tono. Ningún botón principal sin efecto. Los estados de carga usan Skeleton, no una pantalla en blanco.

Responsive: las tablas pasan a tarjetas bajo `md`. Los gráficos mantienen altura legible. El grafo ocupa el ancho disponible y el detalle lateral cae debajo en móvil.

### Criterio de terminación

No se declara listo porque compile. Tiene que cumplirse todo esto, con la base sembrada y el servidor en marcha:

1. Login de los tres usuarios y rechazo de una clave mala.
2. Cada rol ve solo su sidebar y recibe denegación al escribir la URL prohibida.
3. Buscar «INNOVA VALLE» abre la ficha correcta, mercantil.
4. La ESAL Fundación Horizonte del Pacífico abre una ficha igual de completa, con financiero vacío honesto.
5. Monitorear muestra el toast y la empresa aparece en `/monitoreo`. Quitar la saca.
6. Las alertas de Innova se leen, se marcan y el contador del header cambia.
7. Timeline con los eventos de la sección 9, en orden, filtrable.
8. Grafo con representante, socios, establecimiento y Nube del Pacífico; el panel lateral corresponde al nodo elegido.
9. Dashboard con los cinco KPI y los seis gráficos, y los filtros cambian las series.
10. Administración crea un usuario, lo desactiva y ese usuario ya no entra. Roles se ven y no se editan.
11. Recorrido de demo del brief, de punta a punta, sin error de consola: abrir, login, inicio, buscar Innova, perfil, monitorear, alertas, timeline, grafo, dashboard, administración.
12. Vacío, error y carga cubiertos en buscador, monitoreo, alertas y dashboard.
13. Botones principales con efecto real.
14. Desktop y un ancho móvil (sidebar en sheet, ficha usable).
15. README con las secciones del brief: Objetivo, Funcionalidades, Arquitectura, Stack, Instalación, Ejecución, Base de datos, Seed, Usuarios de prueba, Caso principal, Flujo de demostración, Limitaciones, Evolución futura. Una persona que solo lea el README instala, migra, siembra y entra.
16. Pruebas Vitest del flujo crítico (login, denegación del consultor a administración, búsqueda de Innova, toast de monitoreo, empty state) en verde.

---

## 11. Fuera del MVP

No se construye, ni como esqueleto «por si acaso» más allá de las interfaces ya nombradas:

Multi-tenant, white label, nube de la Cámara, AWS, Azure, GCP, Kubernetes, BCP, DRP, RTO, RPO, observabilidad completa, OpenTelemetry, infraestructura como código, pipelines empresariales, portal de desarrolladores, SDK.

Tampoco: SSO real (OIDC, OAuth 2.0 o SAML funcionando), integraciones de Registro Mercantil, ESAL, Experian, TransUnion o Informa, score, IA, importación Excel, editor dinámico de permisos, `ApiDataSourceAdapter` y `FileDataSourceAdapter` más allá del contrato, `ApiCompanyRepository` cableado, PostgreSQL levantado, ni la librería `itc-frontend-base`.

La evolución futura se explica en el README, en prosa, no en código muerto que parezca operativo.

---

## Fases

Cada fase deja la aplicación anterior funcionando. No se adelantan pantallas de una fase posterior.

### Fase 1 — Arquitectura y estructura

Scaffold oficial de Next.js (TypeScript, App Router, Tailwind 4, React 19) en un directorio temporal y subida a la raíz, sin borrar este plan. `strict: true`. ESLint. Carpetas del árbol. shadcn init y los primitivos de la sección 4. Providers de Query y Zustand. `cn()`, cliente Axios, cliente Prisma singleton. Interfaces de repositorios y de `DataSourceAdapter`, con las clases stub que lanzan «no implementado». `LocalCredentialsProvider` y los tres proveedores vacíos. `permissions.ts` con la matriz. `middleware.ts` que solo distingue público / autenticado (el rol fino entra en la fase 3). `.env.example`, `.gitignore`, script de puerto `43123`. Todavía sin pantallas de negocio y sin README largo.

### Fase 2 — Base de datos y seed

`schema.prisma` como en la sección 5. Migración inicial. `prisma/data/*` con el padrón de la sección 9. `DemoDataSourceAdapter` + `seed.ts` + `evaluateDemoRules`. Repositorios SQLite implementados y usados por servicios. Comprobación manual: conteos (22 empresas, 13 personas, 6 reglas, alertas de Innova ≥ 3, ESAL presente) vía un script o un test de repositorio, no vía UI.

### Fase 3 — Autenticación y layout

Login, logout, cookie, sesión, auditoría de acceso, usuario inactivo. Shell con sidebar y header. `RoleGuard` y middleware por rol. Página de acceso denegado. Inicio mínimo: saludo y buscador que navega a `/empresas` (la página de empresas puede estar vacía hasta la fase 4, con empty state real, no un enlace roto). Los tres usuarios entran y cada uno ve su menú.

### Fase 4 — Empresas y perfil

`GET /api/empresas` y detalle. Buscador con filtros y columnas. Perfil: encabezado, Resumen determinístico, Información registral. Consulta escribe `AuditLog`. Pestañas Relaciones, Timeline y Alertas presentes para admin y analista, con empty state «Disponible en la fase siguiente» solo si esa fase aún no existe; al cerrar la fase 6 esas pestañas ya tienen datos y ese texto no puede quedar. El consultor no ve esas tres pestañas. Acción Monitorear visible pero, hasta la fase 5, no se pinta un botón que no haga nada: el botón llega en la fase 5 junto con el endpoint.

### Fase 5 — Monitoreo y alertas

Alta y baja de `MonitoredCompany`, toast con la frase exacta, confirmación al quitar. Lista `/monitoreo`. Centro `/alertas` con filtros, detalle, marcar leída y contador del header. Pestaña Alertas del perfil. Auditoría de inicio, fin y lectura. Reglas solo se consultan; no hay pantalla para editarlas.

### Fase 6 — Timeline y grafo

Pestaña Timeline (línea, filtro por tipo, fuente). Pestaña Relaciones con la lista y `@xyflow/react`: tipos de nodo distintos, zoom, mover, seleccionar, panel lateral. `GET .../grafo` no inventa nodos. Caso Innova verificable de un vistazo.

### Fase 7 — Dashboard

`GET /api/dashboard` con agregados. Cinco KPI y seis gráficos. Filtros globales de fecha, tipo, municipio y estado. Home completa: KPIs y tres bloques, con el recorte del consultor. Click en un KPI de alertas lleva a `/alertas` solo si el rol tiene permiso.

### Fase 8 — Administración

Usuarios: listar, crear, editar, activar y desactivar, con Zod. No se puede desactivar la propia sesión en uso ni dejar cero administradores activos. Roles de solo lectura desde `Role` + `Permission`. Configuración de las tres claves. Todo cambio administrativo queda en `AuditLog`.

### Fase 9 — Pruebas y estabilización

Vitest + Testing Library de los casos del criterio (login, rol, Innova, monitoreo, vacío). Arreglo de consola, 401/403 y estados. README de la raíz con las secciones obligadas, credenciales y el flujo de demostración numerado del brief. Recorrido manual de los 15 pasos del brief con los tres roles. `npm install`, migración y seed siguiendo solo el README, en limpio.

### Fase 10 — Ajustes visuales para la demostración

Recorrido pensando en quien evalúa: jerarquía del inicio, ficha de Innova sin scroll confuso, gráficos con ejes legibles, grafo que cabe, sidebar estable, vacíos con la misma voz. Revisión en ancho de escritorio y en ancho móvil. No se añaden módulos. Si un pulido pone en riesgo el flujo, se deja el flujo.

---

## Orden de la demo (debe quedar intacto al cerrar la fase 9)

1. Abrir la plataforma.
2. Entrar como analista.
3. Ver el inicio.
4. Buscar «INNOVA VALLE».
5. Abrir el perfil.
6. Ver la información consolidada.
7. Agregar a monitoreo.
8. Consultar alertas.
9. Abrir el timeline.
10. Ver la evolución histórica.
11. Abrir el grafo y las relaciones.
12. Volver al dashboard.
13. Ver indicadores consolidados.
14. Entrar como administrador a Administración.
15. Ver usuarios y roles.
