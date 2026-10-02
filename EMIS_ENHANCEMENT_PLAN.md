# Plan de mejora — perfil de inteligencia sobre el MVP actual

Documento de implementación. No copia diseño, marca, colores ni textos de EMIS. Complementa la app que ya corre en este worktree (`mvp-inteligencia-empresarial`). No se reconstruye el proyecto.

<<<<<<< HEAD
Revisión hecha sobre el código de este worktree el 2026-10-02. La fase 1 no está empezada.
=======
Revisión hecha sobre el código de este worktree el 2026-10-02. La implementación de este documento vive en la misma rama y conserva las pantallas que ya existían.
>>>>>>> cursor/emis-intelligence-profile-f906

`itc-frontend-base` sigue sin existir en el registro público: `npm view itc-frontend-base` contra `https://registry.npmjs.org` responde **404** (`itc-frontend-base@* is not in this registry`). No hay `.npmrc`. No se instala, no se declara en `package.json` y no se reescribe la UI para perseguir ese paquete. Los primitivos siguen siendo los de shadcn/ui que ya están en `src/components/ui` (Button, Input, Card, Tabs, Table, Select, Dialog, Sheet, Badge, Skeleton, Sonner). Recharts y `@xyflow/react` se quedan.

---

## Decisiones que este plan cierra

1. **Misma arquitectura.** `src/app` solo enruta. La lógica vive en `src/features/<dominio>` y sale por `index.ts`. Un feature no importa carpetas internas de otro. TanStack Query para datos de servidor. Zustand solo para UI (bandeja del comparador y diálogos). Prisma + SQLite. Servicios y repositorios en `src/server`. El stub `ApiCompanyRepository` sigue lanzando `RepositoryNotImplemented`; cada método nuevo de la interfaz se añade ahí igual, sin implementarlo.
2. **No big-bang.** Cada fase migra solo el esquema que esa fase usa (`prisma migrate dev` con nombre descriptivo) y actualiza el seed y el test de volúmenes en el mismo cambio. No hay un SQL de migración en este documento: el esquema de abajo es el contrato de `schema.prisma`.
3. **Datos de demostración.** Todo lo nuevo es ficticio. La etiqueta visible es siempre «Datos de demostración». El aviso `demo.aviso` y los tres usuarios demo no se tocan.
4. **Indicadores no se persisten.** Se calculan en `src/server/services/financial-indicators.ts`. Si falta un dato o el denominador es 0, el resultado es `null` y la UI muestra `N/D`. Nunca `NaN` ni `Infinity` (`Number.isFinite` antes de formatear).
5. **Razón corriente.** El periodo que pide el brief no trae activo ni pasivo corriente. Se añaden dos campos opcionales, `currentAssets` y `currentLiabilities`. Si uno es null, la razón corriente es `N/D`. El resto de indicadores sale de los campos obligatorios del periodo.
6. **Activo registral y activo de estados no se mezclan.** `Company.activos` y `Company.capital` siguen siendo la cifra registral (Innova conserva activos `940000000` y capital `180000000`). Los estados viven en `CompanyFinancialPeriod.totalAssets`. El perfil etiqueta «Activos registrales» y «Activos (estados {año})».
7. **Promedio sectorial no se calcula sobre las 50 empresas.** Va en `SectorBenchmark`, cifras ficticias publicadas. Así la comparación no es un ranking del padrón demo. No hay puntajes, estrellas ni «top».
8. **Un solo departamento.** Todas las empresas, nuevas y viejas, siguen en Valle del Cauca y en la Cámara de Comercio de Cali. El filtro y el gráfico «por departamento» existen y muestran el valor que haya en los datos (hoy, uno). No se inventan otros departamentos.
9. **Consultor.** Sigue sin relaciones, grafo, timeline, alertas, monitoreo ni listas. Sí ve resumen, datos registrales, finanzas, comparación (empresa vs sector y similares), sectores, comparador, dashboard e inicio.
10. **Exportar no abre endpoint.** Arma un CSV en el cliente con las secciones que el rol ya cargó. Primera fila: `Datos de demostración`.

---

## 1. Qué ya existe

App Next.js 16, React 19, TypeScript, Tailwind 4, shadcn/ui, TanStack Query, Zustand, Prisma SQLite, Recharts, React Flow (`@xyflow/react`), Zod, Vitest. Puerto de desarrollo `43123`.

### Rutas de página

| Ruta | Qué hace |
| --- | --- |
| `/login` | Login local |
| `/` | Inicio: saludo, tres KPI, consultadas recientes (auditoría), alertas, monitoreo |
| `/empresas` | Buscador y filtros |
| `/empresas/[id]` | Perfil con pestañas |
| `/monitoreo` | Empresas que el usuario sigue para detectar cambios |
| `/alertas` | Centro de alertas |
| `/dashboard` | KPI y seis gráficos |
| `/administracion` | Usuarios, roles, configuración |
| `/acceso-denegado` | Rol insuficiente |

No existen `/comparador`, `/sectores`, `/sectores/[id]` ni `/listas`.

### Endpoints

`POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/session`, `GET /api/empresas`, `GET /api/empresas/[id]`, `GET /api/empresas/[id]/grafo`, `GET|POST /api/monitoreo`, `DELETE /api/monitoreo/[companyId]`, `GET /api/alertas`, `PATCH /api/alertas/[id]`, `GET /api/dashboard`, `GET|POST /api/admin/usuarios`, `PATCH /api/admin/usuarios/[id]`, `GET /api/admin/roles`, `GET|PATCH /api/admin/configuracion`.

El middleware exige cookie de sesión fuera de `/login` y `/api/auth/login`. `route-access.ts` limita administración al administrador; monitoreo, alertas y grafo al administrador y al analista.

### Perfil actual (`CompanyProfileScreen`)

Cabecera: nombre comercial, razón social, NIT, matrícula, tipo de registro, CIIU, municipio, botón Monitorear. No hay sector, ni Comparar, ni Exportar.

Pestañas: Resumen, Información registral, Relaciones (si el rol puede), Timeline, Alertas. El resumen son ocho fichas registrales más un párrafo de `buildCompanySummary`. Lo financiero del perfil es solo capital y activos registrales, o el texto «Sin información financiera disponible».

El grafo está dentro de Relaciones: nodos `empresa`, `representante`, `socio`, `persona`, `establecimiento`, `relacionada`, layout radial, panel lateral con campos. El panel no tiene «Ver perfil» aunque la tarjeta de relación sí enlaza la empresa relacionada.

El timeline filtra por `TipoEvento`, no por categoría (registral, corporativo, financiero, alerta, noticia).

### Explorador

Filtros: texto (NIT, razón social, nombre comercial), tipo de registro, estado de matrícula, municipio, actividad, tamaño. La búsqueda no mira sector (no existe) y el texto ya es insensible a tildes (`includesText`).

Tabla de escritorio: Empresa, NIT, Tipo, Actividad, Ciudad, Estado, Última actualización, Acciones (Ver perfil, Monitorear). No ordena por columna. En móvil, tarjetas.

### Inicio

No tiene buscador principal. Reutiliza `GET /api/empresas` (recientes por `AuditLog` de `CONSULTA_EMPRESA`, máximo 5), `GET /api/monitoreo` y `GET /api/alertas`.

### Dashboard

KPI: consultadas, monitoreadas, alertas generadas, mercantil, ESAL. Series: por tipo de registro, por estado de matrícula, por actividad, alertas por tipo, alertas en el tiempo, monitoreadas por municipio. Filtros: desde, hasta, tipo de registro, municipio, estado. No hay sector, departamento, tamaño, ingresos agregados ni crecimiento.

### Modelo Prisma (lo que se conserva)

`User`, `AuthIdentity`, `Session`, `Role`, `Permission`, `RolePermission`, `Company`, `Person`, `Establishment`, `CompanyRelation`, `TimelineEvent`, `AlertRule`, `Alert`, `MonitoredCompany`, `AuditLog`, `AppSetting`.

`Company` ya trae identificación, matrícula, cámara, municipio, departamento, dirección, contacto, CIIU, tamaño, empleados, capital, activos, constitución, estado jurídico, representante legal en texto y `fechaUltimaActualizacion`. No hay sector, ni periodos, ni fuente de datos.

`TipoRelacion`: `REPRESENTANTE_LEGAL`, `SOCIO`, `ESTABLECIMIENTO`, `PERSONA_OTRA_EMPRESA`, `EMPRESA_RELACIONADA`.

`TipoEvento`: solo actos registrales (`CONSTITUCION` … `OTRO_REGISTRAL`). `TimelineEvent.fuente` es `REGISTRO_MERCANTIL` o `ESAL`.

`MonitoredCompany` es el monitoreo de cambios (único por usuario y empresa). No hay listas de organización ni búsquedas guardadas.

### Seed actual (`prisma/data`, orquestado por `prisma/seed.ts`)

| Dato | Hoy |
| --- | --- |
| Empresas | 22, todas Valle del Cauca, Cámara de Comercio de Cali |
| Personas | 13 |
| Establecimientos | 7 |
| Reglas de alerta | 6, demostrativas |
| Eventos | ≥ 36 |
| Usuarios | `admin@demo.ccc` (Ana López), `analista@demo.ccc` (Julián Herrera Mejía), `consultor@demo.ccc` (Sofía Delgado Ríos). Contraseña `CccDemo.2026` |

El test `src/server/services/alert-rules.test.ts` fija 22 empresas, 13 personas, 6 reglas, ≥ 3 alertas de Innova y ≥ 16 en el padrón. Cada fase que cambie esos números actualiza ese test en el mismo cambio. `assertRelationIntegrity` exige persona en representante y socio, establecimiento en establecimiento, empresa en empresa relacionada, y que `PERSONA_OTRA_EMPRESA` exista también en otra compañía.

Municipios ya sembrados: Cali, Yumbo, Palmira, Buenaventura, Jamundí, Puerto Tejada, Buga, Tuluá, Cartago.

### Servicios que se extienden, no se reemplazan

`companyService`, `monitoringService`, `alertService`, `dashboardService`, `adminService` en `src/server/services/container.ts`. `redactProfile` ya anula relaciones, timeline y alertas según el rol. `SqliteCompanyRepository.search` filtra en memoria. `evaluateDemoRules` genera alertas solo si el evento trae `metadata.valorAnterior` y `valorNuevo` distintos (condición `CAMBIO`).

---

## 2. Qué se reutiliza

- Login, sesión, cookie, middleware, `RoleGuard`, administración, marcar alerta leída, alta y baja de monitoreo, auditoría `CONSULTA_EMPRESA` / `INICIO_MONITOREO` / `FIN_MONITOREO` / `LECTURA_ALERTA`.
- `MonitorButton`, badges de matrícula y severidad, `EmptyState`, `ErrorState`, `LoadingBlock`, `AppShell`, `formatMoney`, `formatDisplayDate`, `formatAntiguedad`, `includesText`, `buildCompanySummary` (se le suman campos opcionales; los tests actuales siguen pasando).
- `GET /api/empresas` y `GET /api/empresas/[id]` como contrato base. Los campos nuevos son aditivos.
- Grafo React Flow (`CompanyGraph`): mismos nodos actuales, más tipos. Panel lateral actual, más el enlace.
- Timeline visual (línea vertical). Cambia el filtro, no el componente de cero.
- Dashboard: se conservan KPI y gráficos actuales y se agregan los nuevos. Recharts ya está.
- Seed por archivos en `prisma/data` y borrado ordenado en `prisma/seed.ts`. Horizonte del Pacífico sigue ESAL, con `capital` y `activos` null y sin periodos financieros, para que el vacío financiero siga siendo real.
- Los 22 id estables (`co-innova`, `co-horizonte`, `co-nube`, …). No se renombran.
- Query keys existentes: `['companies', filters]`, `['company', id]`, `['company', id, 'graph']`, `['monitoring', userId, filters]`, `['alerts', filters]`, `['dashboard', filters]`.

---

## 3. Qué se modifica

| Archivo | Cambio |
| --- | --- |
| `prisma/schema.prisma` | Campos y modelos de la sección 5, por fase |
| `prisma/data/types.ts` | Tipos de seed nuevos |
| `prisma/data/companies.ts` | `sector` en las 22; empresas nuevas hasta 50 |
| `prisma/data/people.ts` | Hasta 50 personas |
| `prisma/data/relations.ts` | Cargos, tercer accionista, subsidiaria, matriz, representantes de las empresas nuevas |
| `prisma/data/establishments.ts` | Segundo establecimiento de Innova |
| `prisma/data/events.ts` | Categoría; noticias de Innova; metadata de la renovación 2025 |
| `prisma/seed.ts` | Orden de borrado de las tablas nuevas; inserción de periodos, benchmarks, listas |
| `src/shared/types/domain.ts` | Sector, periodo, indicadores, cobertura, nodos nuevos, payloads nuevos |
| `src/shared/types/filters.ts` | Filtros de explorador, dashboard y orden |
| `src/shared/lib/permissions.ts` y `prisma/data/users.ts` | Permisos nuevos |
| `src/shared/lib/route-access.ts` | `/listas` y `/api/listas` igual que monitoreo |
| `src/shared/utils/labels.ts` | Etiquetas de sector, cargos, categorías, nodos |
| `src/shared/utils/company-summary.ts` | Frases opcionales de sector y de ingresos del último año, solo si el dato existe |
| `src/server/validation.ts` | Query y bodies nuevos con Zod |
| `src/server/services/relation-integrity.ts` | Los cargos nuevos exigen `personId`. `MATRIZ` y `SUBSIDIARIA` exigen `relatedCompanyId`. `SOCIO` sigue exigiendo persona |
| `src/server/services/container.ts` | Servicios nuevos y redacción: finanzas y comparación no se anulan al consultor; directivos sí, porque cuelgan de `empresas.relaciones` |
| `src/server/repositories/interfaces.ts` y `sqlite.ts` | Consultas nuevas. `ApiCompanyRepository` declara los métodos y sigue sin implementarlos |
| `src/server/repositories/sqlite.ts` `toListItem` / `matchesCompany` / `toProfile` / `relationNode` | Sector, último periodo, orden, cobertura, tipos de nodo |
| `src/features/companies/components/company-profile-screen.tsx` | Cabecera, pestañas y resumen de la sección 8. No se tira el layout registral |
| `src/features/companies/components/companies-screen.tsx` | Filtros, columnas y orden |
| `src/features/home/components/home-screen.tsx` | Buscador como primer bloque; sectores y búsquedas guardadas |
| `src/features/graph/components/company-graph.tsx` | Tipos de nodo y «Ver perfil» |
| `src/features/timeline/components/company-timeline.tsx` | Filtro por categoría |
| `src/features/dashboard/components/dashboard-screen.tsx` | KPI y series nuevas; filtros nuevos |
| `src/shared/components/app-shell.tsx` | Ítems Sectores, Comparador y Listas |
| `src/server/services/alert-rules.test.ts` | Volúmenes finales de la sección 7 |

---

## 4. Qué se crea

```text
src/server/services/financial-indicators.ts    # funciones puras, sin Prisma
src/server/services/similar-companies.ts       # reglas de la sección 6
src/server/services/financial-indicators.test.ts
src/server/services/similar-companies.test.ts
src/features/comparison/                      # pantalla, store Zustand, index.ts
src/features/sectors/                         # lista y detalle, index.ts
src/features/lists/                           # watchlists, index.ts
src/shared/components/data-source-badge.tsx   # DataSourceBadge
src/shared/components/last-updated-label.tsx  # LastUpdatedLabel
src/shared/components/coverage-list.tsx       # hechos, sin puntaje
prisma/data/financials.ts
prisma/data/benchmarks.ts
prisma/data/watchlists.ts
src/app/(app)/comparador/page.tsx
src/app/(app)/sectores/page.tsx
src/app/(app)/sectores/[codigo]/page.tsx
src/app/(app)/listas/page.tsx
src/app/api/empresas/[id]/finanzas/route.ts
src/app/api/empresas/[id]/similares/route.ts
src/app/api/empresas/[id]/sector/route.ts
src/app/api/comparador/route.ts
src/app/api/sectores/route.ts
src/app/api/sectores/[codigo]/route.ts
src/app/api/listas/route.ts
src/app/api/listas/[id]/empresas/route.ts
src/app/api/listas/[id]/empresas/[companyId]/route.ts
src/app/api/busquedas/route.ts
src/app/api/busquedas/[id]/route.ts
```

Cada `page.tsx` solo exporta metadata y renderiza el componente del feature. Los features nuevos se importan por el barrel (`@/features/comparison`, `@/features/sectors`, `@/features/lists`).

Componentes compartidos:

- `DataSourceBadge` pinta únicamente «Datos de demostración». En este MVP no hay otra fuente.
- `LastUpdatedLabel` recibe un ISO y usa `formatDisplayDate`. Si no hay fecha: «Sin fecha de actualización».
- `CoverageList` lista seis hechos (sección 6). No calcula un score.

Store Zustand `comparisonStore`: `ids: string[]` (máximo 4), `add`, `remove`, `clear`. Persiste en `sessionStorage` bajo la clave `comparador-ids`. No guarda fichas de empresa: esas las pide TanStack Query.

---

## 5. Cambios de base de datos

SQLite vía Prisma. Nombres de campo en inglés, como el resto del esquema. Sin SQL ejecutable aquí.

### 5.1 Enums nuevos

```prisma
enum SectorCodigo {
  TECNOLOGIA
  COMERCIO
  CONSTRUCCION
  SERVICIOS
  INDUSTRIA
  TRANSPORTE
  SALUD
}

enum CategoriaEvento {
  REGISTRAL
  CORPORATIVO
  FINANCIERO
  NOTICIA
}

enum TipoLista {
  CLIENTES_ESTRATEGICOS
  PROSPECTOS
  PROVEEDORES
  TECNOLOGIA
  PERSONAL
}
```

`TipoRelacion` suma: `SUPLENTE`, `MIEMBRO_JUNTA`, `REVISOR_FISCAL`, `OTRO_CARGO`, `MATRIZ`, `SUBSIDIARIA`.

`TipoEvento` suma: `NOTICIA`, `NOMBRAMIENTO`, `CAMBIO_PARTICIPACION`. No se agrega un tipo financiero persistido: el hito financiero del timeline se arma al leer los periodos.

Categoría de los tipos que ya existen:

| Tipos | Categoría |
| --- | --- |
| `CONSTITUCION`, `MATRICULA`, `RENOVACION`, `CAMBIO_DOMICILIO`, `MODIFICACION_ACTIVIDAD`, `CAMBIO_ESTADO_MATRICULA`, `CAMBIO_TIPO_ORGANIZACION`, `APERTURA_ESTABLECIMIENTO`, `OTRO_REGISTRAL` | `REGISTRAL` |
| `CAMBIO_REPRESENTANTE`, `NOMBRAMIENTO`, `CAMBIO_PARTICIPACION` | `CORPORATIVO` |
| `NOTICIA` | `NOTICIA` |

### 5.2 `Company`

- `sector SectorCodigo` obligatorio después de rellenar las 22.
- `fuenteDatos String @default("DEMO")`.
- Índice `@@index([sector])` y `@@index([departamento])`.

### 5.3 `CompanyFinancialPeriod`

| Campo | Tipo |
| --- | --- |
| `id` | uuid |
| `companyId` | FK Company, `onDelete: Cascade` |
| `year` | Int |
| `revenue` | Decimal |
| `ebitda` | Decimal |
| `netProfit` | Decimal |
| `totalAssets` | Decimal |
| `totalLiabilities` | Decimal |
| `equity` | Decimal |
| `employees` | Int |
| `currentAssets` | Decimal opcional |
| `currentLiabilities` | Decimal opcional |
| `fuenteDatos` | String, default `"DEMO"` |

`@@unique([companyId, year])`.

### 5.4 `SectorBenchmark`

Una fila por sector y año. Años 2022, 2023, 2024 y 2025 para los 7 sectores (28 filas).

Campos: `sector`, `year`, `avgRevenue`, `avgEbitda`, `avgNetProfit`, `avgAssets`, `avgLiabilities`, `avgEquity`, `avgEmployees` (Decimal, empleados también Decimal para permitir promedio), `avgRevenueGrowth`, `avgAssetGrowth` (Decimal, fracción: `0.08` es 8 %). `fuenteDatos` default `"DEMO"`. `@@unique([sector, year])`.

Los márgenes, ROA, ROE y deuda/patrimonio del sector se calculan con las mismas funciones de indicadores a partir de esos promedios. No se guardan.

Referencia del benchmark de Tecnología 2025 (Innova queda por encima en ingresos, sin decir «mejor»):

| Campo | Valor |
| --- | --- |
| avgRevenue | 3100000000 |
| avgEbitda | 480000000 |
| avgNetProfit | 290000000 |
| avgAssets | 1500000000 |
| avgLiabilities | 600000000 |
| avgEquity | 900000000 |
| avgEmployees | 36 |
| avgRevenueGrowth | 0.09 |
| avgAssetGrowth | 0.07 |

El resto de sectores y años: cifras ficticias coherentes (el año siguiente no es menor que el 70 % del anterior en ingresos). Distintas de cualquier empresa concreta del padrón.

### 5.5 `CompanyRelation`

- `cargo String?` para el texto de `OTRO_CARGO` y de la junta («Presidenta de junta»). El enum sigue siendo el tipo.

### 5.6 `TimelineEvent`

- `categoria CategoriaEvento`.
- `fuente` admite también el literal `"DEMO"` además de `REGISTRO_MERCANTIL` y `ESAL` (sigue siendo `String`, no hace falta enum).

### 5.7 `Watchlist` y `WatchlistItem`

`Watchlist`: `id`, `userId`, `nombre`, `tipo TipoLista`, `createdAt`. `@@unique([userId, tipo])` solo para los cuatro tipos de organización. `PERSONAL` puede repetirse por usuario: ese unique se aplica en el servicio (rechazo 409 si el tipo no es `PERSONAL` y ya existe), no como unique de Prisma que bloquee varias listas personales. Índice `@@index([userId])`.

`WatchlistItem`: `id`, `watchlistId`, `companyId`, `createdAt`. `@@unique([watchlistId, companyId])`. Borrar la lista borra los ítems (`onDelete: Cascade`). `MonitoredCompany` no se fusiona con esto.

### 5.8 `SavedSearch`

`id`, `userId`, `nombre`, `filtros Json` (mismo objeto que `CompanyFilters`), `createdAt`. Índice `@@index([userId])`.

### 5.9 Orden de borrado en el seed

Antes de `company.deleteMany()`: `watchlistItem`, `watchlist`, `savedSearch`, `companyFinancialPeriod`, `sectorBenchmark`. El resto del orden actual se mantiene.

### 5.10 Mapa de sector de las 22 empresas actuales

| Id | Sector | CIIU |
| --- | --- | --- |
| `co-innova`, `co-nube` | TECNOLOGIA | 6201, 6311 |
| `co-cafe`, `co-mercado` | COMERCIO | 4631, 4711 |
| `co-ladrillo`, `co-barrio` | CONSTRUCCION | 4111, 4321 |
| `co-horizonte`, `co-punto`, `co-semilla`, `co-faro`, `co-recicladores`, `co-marea` | SERVICIOS | 8559, 7020, 8551, 9007, 3811, 5811 |
| `co-brio`, `co-textiles`, `co-horno`, `co-frio`, `co-metal`, `co-agro` | INDUSTRIA | 2599, 1410, 1071, 1011, 2410, 0113 |
| `co-andes`, `co-rutas`, `co-bahia` | TRANSPORTE | 4923, 4921, 5222 |
| `co-bienestar` | SALUD | 8699 |

AgroSiembra queda en Industria (producción). Editorial Marea queda en Servicios. No se crea un octavo sector.

---

## 6. Reglas de cálculo y de producto

### Indicadores (último periodo, y el anterior solo para crecimientos)

| Indicador | Fórmula | Formato |
| --- | --- | --- |
| Margen neto | `netProfit / revenue` | por ciento, 1 decimal, `es-CO` |
| Margen operativo | `ebitda / revenue` | por ciento |
| ROA | `netProfit / totalAssets` | por ciento |
| ROE | `netProfit / equity` | por ciento |
| Razón corriente | `currentAssets / currentLiabilities` | veces, 1 decimal (`1,5`). `N/D` si falta un corriente |
| Deuda / patrimonio | `totalLiabilities / equity` | veces, 1 decimal |
| Crecimiento de ingresos | `(revenue - revenueAnterior) / revenueAnterior` | por ciento |
| Crecimiento de activos | `(totalAssets - activosAnteriores) / activosAnteriores` | por ciento |

Año anterior = el periodo con `year` inmediatamente menor, no «año calendario − 1» si ese año no existe. Si no hay anterior, ambos crecimientos son `N/D`.

Variación del resumen = mismo crecimiento, mostrado como «+13,5 % vs 2024» o «N/D» si no hay año previo. Empleados del KPI de resumen: `employees` del último periodo; si no hay periodo, `Company.numeroEmpleados` sin variación.

### Empresas similares

1. Candidatas: mismo `sector`, distinto `id`.
2. Puntaje: +4 mismo CIIU, +3 mismo `tamanoEmpresa`, +3 si ambas tienen ingresos del último año y `|a-b| / max(a,b) <= 0.40`, +1 mismo municipio.
3. Orden: puntaje descendente, luego `razonSocial` ascendente con `localeCompare` `es`.
4. Máximo 5. Si hay menos de 5 con puntaje > 0, se rellena con el resto del mismo sector (puntaje 0) hasta 5.
5. Sin modelo, sin embeddings, sin orden «de calidad».

Para que Innova no caiga en el relleno vacío, el seed de la fase 7 incluye tres medianas CIIU 6201 con ingresos 2025 dentro del 40 % de 4 200 000 000 (banda 2 520 000 000 a 5 880 000 000):

| Id | Razón social | Ciudad | Ingresos 2025 |
| --- | --- | --- | --- |
| `co-andina-soft` | Andina Software del Valle S.A.S. | Cali | 3800000000 |
| `co-codigo-sur` | Código Sur Sistemas S.A.S. | Palmira | 4600000000 |
| `co-nodo-cali` | Nodo Cali Digital S.A.S. | Cali | 3100000000 |

Esas tres también llevan periodos 2022–2025, tamaño `MEDIANA`, sector `TECNOLOGIA`, CIIU 6201. NIT `901900002-1`, `901900003-1`, `901900004-1`.

### Cobertura (sin score)

| Hecho | Texto |
| --- | --- |
| Registral | «Completa» si hay NIT, razón social, matrícula, municipio, CIIU y estado de matrícula. Si faltara alguno: «Incompleta». |
| Financiera | «{n} años» o «Sin periodos» |
| Directivos | «{n} cargos vigentes» contando relaciones vigentes de tipo representante, suplente, junta, revisor u otro cargo |
| Propiedad | «{n} accionistas vigentes» contando `SOCIO` vigente |
| Relaciones | «{n} vínculos vigentes» contando establecimiento, empresa relacionada, matriz y subsidiaria vigentes |
| Última actualización | fecha de `fechaUltimaActualizacion` |

### Timeline unificado (al leer, no al sembrar alertas ni periodos)

Tres orígenes, ordenados por fecha descendente:

1. `TimelineEvent`.
2. Cada `Alert` de la empresa, categoría visible «Alertas», id de UI `alert-{id}`. No se copia a `TimelineEvent` (marcar leída sigue en el modelo `Alert`).
3. Cada `CompanyFinancialPeriod`, título «Estados de {year}», categoría «Financieros», fuente «Datos de demostración», id de UI `fin-{companyId}-{year}`.

Filtros de la pestaña: Todos, Registrales, Corporativos, Financieros, Alertas, Noticias. El consultor no recibe alertas ni el timeline (la pestaña sigue oculta).

### Explorador: filtros y orden

Query nuevas, todas opcionales, validadas con Zod:

`departamento`, `sector` (`SectorCodigo`), `empleadosMin`, `empleadosMax`, `ingresosMin`, `ingresosMax`, `activosMin`, `activosMax`, `sort`, `dir` (`asc`|`desc`).

El texto `q` además acierta si contiene el nombre del sector («tecnologia» encuentra Tecnología) o el CIIU, cosa que la actividad ya hace.

Empleados del filtro: `numeroEmpleados` de la empresa; si es null, `employees` del último periodo. Ingresos y activos del filtro: último periodo (`revenue`, `totalAssets`). Si el filtro numérico está puesto y la empresa no tiene periodo, queda fuera. No se usa `Company.activos` para el filtro de activos de estados.

`sort`: `razonSocial` (default), `nit`, `sector`, `municipio`, `revenue`, `totalAssets`, `employees`, `estadoMatricula`. `dir` default `asc`. Los null van al final.

Columnas de la tabla, en este orden: Empresa, NIT, Sector, Ciudad, Ingresos, Activos, Empleados, Estado. Se conservan las acciones Ver perfil y Monitorear (no están en la lista del brief y ya funcionan). Tipo de registro y actividad siguen como filtros, no como columnas. Ingresos y activos de la celda son del último periodo, o «Sin información». La lista móvil muestra los mismos datos.

### Comparador

Máximo 4 ids. `GET /api/comparador?ids=a,b,c` responde 400 si llegan más de 4. Un id desconocido no tumba la respuesta: va en `ausentes: string[]` y se omite. Filas: Sector, Ciudad, Antigüedad, Empleados, Ingresos, EBITDA, Utilidad, Activos, Patrimonio, Margen neto, ROE, Crecimiento de ingresos. Valores del último periodo. Gráficos de barras agrupadas (Recharts, el mismo criterio visual del dashboard): ingresos, utilidad y activos de ese año. Menos de 2 empresas: tabla igual, gráfico con el estado vacío «Agrega al menos dos empresas para ver el gráfico».

Botón Comparar del perfil: si no está, `add` y toast «Agregada al comparador». Si está, «Quitar del comparador». Si la bandeja ya tiene 4 distintas: toast «El comparador admite máximo 4 empresas» y no agrega. Al abrir `/comparador` se escriben los ids en `?ids=`.

### Empresa vs sector

Último periodo de la empresa contra `SectorBenchmark` del mismo sector y el mismo `year`. Si ese año no está, el benchmark del año más reciente anterior. Si no hay periodo: «Sin información financiera para comparar con el sector.» Cada fila muestra valor de la empresa, promedio del sector y diferencia (absoluta y porcentual). Diferencia porcentual `N/D` si el promedio es 0. Copy: «Promedios de demostración del sector.» Sin puesto ni adjetivos de calidad.

### Sectores

Los 7 códigos existen siempre en la lista, aunque el conteo sea 0.

- Número de empresas: conteo por `sector`.
- Ingresos agregados: suma de `revenue` del último periodo de cada empresa. Quien no tiene periodo no suma.
- Empleados: suma de `numeroEmpleados`; si es null, `employees` del último periodo.
- Crecimiento promedio: media aritmética simple del crecimiento de ingresos de quienes tienen dos periodos. Si nadie: `N/D`.

Detalle `/sectores/{codigo}` con `codigo` en minúsculas sin tilde: `tecnologia`, `comercio`, `construccion`, `servicios`, `industria`, `transporte`, `salud`. Un código desconocido es 404.

- Resumen: una frase determinística (conteo, municipio más frecuente, CIIU más frecuente). Sin texto generado por modelo.
- Principales empresas: hasta 5, ordenadas por `revenue` del último año descendente y, si no hay ingreso, por razón social. Es un orden de un dato, no un ranking de calidad. Enlace al perfil.
- Distribución por tamaño y por municipio: conteos.
- Evolución de ingresos: suma de `revenue` por año.
- Indicadores promedio: los del benchmark del año más reciente de ese sector, pasados por `financial-indicators`. Etiqueta «Promedios de demostración del sector».

### Listas

Cuatro listas de organización por usuario que puede monitorear, creadas en el seed para el analista y el administrador, y creadas perezosamente en el primer `GET /api/listas` si faltan:

| Tipo | Nombre visible |
| --- | --- |
| `CLIENTES_ESTRATEGICOS` | Clientes estratégicos |
| `PROSPECTOS` | Prospectos |
| `PROVEEDORES` | Proveedores |
| `TECNOLOGIA` | Empresas de tecnología |

Una empresa puede estar en varias. Ponerla en una lista no la monitorea, y monitorearla no la mete en una lista. En el perfil, un diálogo «Agregar a lista» con las listas del usuario y el estado de cada una.

Seed del analista: Innova en Clientes estratégicos y en Empresas de tecnología. Horizonte en Prospectos. Nube en Proveedores.

### Búsquedas guardadas

En `/empresas`, botón «Guardar búsqueda» abre un Dialog, pide nombre (Zod, 3 a 80 caracteres) y hace `POST /api/busquedas` con los filtros activos. El inicio lista las del usuario y enlaza a `/empresas?{query}`. `DELETE` quita una. Tope de servicio: 20 por usuario; la 21 responde 400 «Puedes guardar hasta 20 búsquedas».

### Permisos nuevos

| Código | Roles |
| --- | --- |
| `sectores.ver` | los tres |
| `listas.ver`, `listas.gestionar` | administrador y analista |
| `busquedas.guardar` | los tres |

Finanzas, similares, empresa vs sector y exportar usan `empresas.perfil`. El comparador usa `empresas.consultar`. Directivos y el grafo siguen en `empresas.relaciones` y `empresas.grafo`. No se abre el grafo al consultor.

`route-access`: `/listas` y `/api/listas` con los mismos roles que `/monitoreo`. Sectores y comparador no llevan restricción extra (cualquier sesión).

Nav del shell, en este orden: Inicio, Empresas, Sectores, Comparador, Monitoreo, Listas, Alertas, Dashboard, Administración. Cada ítem sigue filtrado por permiso. Comparador muestra la cantidad de ids del store.

### Formato de dinero y de variación

`formatMoney` existente. Variación positiva con `+`, negativa con el signo de `es-CO`. Cero: `0,0 %`.

---

## 7. Cómo queda INNOVA VALLE S.A.S.

Se conserva la ficha registral. Id `co-innova`, NIT `901847263-1`, razón social `INNOVA VALLE S.A.S.`, nombre comercial Innova Valle, S.A.S., matrícula mercantil `543210-1` activa, cámara de Cali, Cali, Valle del Cauca, Carrera 100 # 16-20, Oficina 804, CIIU 6201, tamaño mediana, 48 empleados, constituida 2018-02-20, estado jurídico vigente, representante en texto Mariana Restrepo Quintero. Capital registral `180000000` y activos registrales `940000000` no se reemplazan con los estados.

Sector: `TECNOLOGIA`. `fuenteDatos`: `DEMO`.

### Directivos vigentes (4)

| Relación | Persona | Desde |
| --- | --- | --- |
| Representante legal (ya existe) | Mariana Restrepo Quintero `per-mariana` | 2024-01-16 |
| Suplente | Tomás Herrera Beltrán `per-tomas` (nueva, CC `1098001114`) | 2024-01-16 |
| Junta, cargo «Presidenta de junta» | Isabel Cruz Londoño `per-isabel` (nueva, CC `1098001115`) | 2021-03-01 |
| Revisor fiscal | Jorge Emilio Navia `per-jorge` (nueva, CC `1098001116`) | 2023-04-01 |

Helena Suárez Patiño sigue como representante histórica no vigente y no cuenta entre los cuatro.

### Accionistas vigentes (3, suman 100)

| Persona | Participación | Nota |
| --- | --- | --- |
| Mariana Restrepo Quintero | 50 % | hoy está en 60 |
| Andrés Felipe Caicedo Ríos | 35 % | hoy está en 40 |
| Sara Isabel Londoño Vélez `per-sara` (nueva, CC `1098001117`) | 15 % | desde 2022-06-01 |

### Establecimientos

- `est-innova` Innova Valle Lab, Calle 64N # 5B-20, Cali, abierto (ya existe).
- `est-innova-norte` Innova Valle Norte, Calle 70 # 4-12, Cali, abierto, relación `ESTABLECIMIENTO` desde 2025-02-01.

### Relaciones societarias

- `co-nube` sigue como `EMPRESA_RELACIONADA`, «Aliado tecnológico de infraestructura». No pasa a ser subsidiaria.
- Subsidiaria nueva `co-innova-labs`, NIT `901900001-1`, razón social `INNOVA LABS DEL VALLE S.A.S.`, nombre comercial Innova Labs, S.A.S., mercantil activa, Cali, CIIU 6201, sector Tecnología, tamaño pequeña, 14 empleados, constituida 2024-05-20, representante Tomás Herrera Beltrán.
- Desde Innova: `SUBSIDIARIA` hacia `co-innova-labs`, «Subsidiaria de desarrollo de producto.», desde 2024-06-01, vigente.
- Desde la subsidiaria: `MATRIZ` hacia `co-innova`, «Matriz: INNOVA VALLE S.A.S.», misma fecha. Las dos filas se siembran; el grafo no infiere la inversa.

La subsidiaria tiene periodos solo 2024 y 2025 (es reciente). No entra en el cálculo de similares de Innova como par mediana: es `PEQUENA`, así que queda por debajo de las tres medianas 6201.

### Finanzas (5 años, COP enteros)

| Año | Ingresos | EBITDA | Utilidad | Activos | Pasivos | Patrimonio | Empleados | Activo corriente | Pasivo corriente |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2021 | 2100000000 | 320000000 | 180000000 | 980000000 | 410000000 | 570000000 | 28 | 420000000 | 210000000 |
| 2022 | 2600000000 | 410000000 | 240000000 | 1200000000 | 480000000 | 720000000 | 33 | 510000000 | 240000000 |
| 2023 | 3100000000 | 520000000 | 310000000 | 1450000000 | 520000000 | 930000000 | 39 | 640000000 | 260000000 |
| 2024 | 3700000000 | 640000000 | 390000000 | 1720000000 | 590000000 | 1130000000 | 44 | 760000000 | 300000000 |
| 2025 | 4200000000 | 760000000 | 470000000 | 1980000000 | 640000000 | 1340000000 | 48 | 890000000 | 320000000 |

El KPI de resumen usa 2025 contra 2024. Crecimiento de ingresos: `(4200000000-3700000000)/3700000000` = 13,5 %. Empleados del periodo 2025 coinciden con `numeroEmpleados` (48). Los activos de estados 2025 (`1980000000`) no sustituyen el activo registral.

### Eventos y alertas

Ya hay 14 eventos registrales (constitución, matrícula, renovaciones 2019–2026, domicilio, actividad, cambio de representante, apertura de Innova Valle Lab). Se suman, sin borrar los actuales:

- `ev-innova-junta`, `NOMBRAMIENTO`, categoría corporativo, 2021-03-01, «Nombramiento de presidenta de junta», fuente `DEMO`.
- `ev-innova-noticia-producto`, `NOTICIA`, 2025-09-12, «Innova Valle abre línea de producto con su subsidiaria», fuente `DEMO`.
- `ev-innova-noticia-rueda`, `NOTICIA`, 2026-01-20, «Participación en rueda de negocios de software del Valle», fuente `DEMO`.

Quinta alerta, sin regla nueva: la renovación del 2025-03-04 (`ev-innova-ren-2024` en el mapa actual) recibe metadata `valorAnterior: "2024-03-04"` y `valorNuevo: "2025-03-04"`. `rule-renovacion` dispara. Con las cuatro que ya salen (dirección, actividad, representante, renovación 2026) quedan 5 alertas. El test pasa de «al menos 3» a «al menos 5» y sigue exigiendo esos cuatro títulos.

Cobertura esperada en la demo: registral completa, financiera 5 años, 4 cargos vigentes, 3 accionistas, vínculos vigentes (2 establecimientos + Nube + subsidiaria = 4), fecha de última actualización = la fecha máxima de sus eventos.

Similares esperadas en las tres primeras posiciones: Andina Software, Código Sur y Nodo Cali (CIIU y tamaño). Nube puede aparecer después por sector, con menos puntaje.

Benchmark: Tecnología, y la fila 2025 de la sección 5.4.

Comparable: cabe en el comparador junto con Andes Logística, Metalforma y Constructora Ladrillo Norte, que tienen 4 años de estados (sección 8, fase 2).

---

## 8. Padrón que completa el seed

Meta al cerrar la fase 8, no antes: 50 empresas, 7 sectores, 50 personas, varias ciudades de las que ya existen, directivos, accionistas, relaciones, eventos, alertas, finanzas y benchmarks. Todo ficticio.

Personas nuevas de Innova en la fase 3: `per-tomas`, `per-isabel`, `per-jorge`, `per-sara`. El resto, hasta 50, en la fase 8: ids `per-018` … `per-050`, CC `1098001118` en adelante, nombres ficticios distintos de los 13 actuales. Toda empresa nueva tiene fila en `currentRepresentative` (puede reutilizar persona). `assertRelationIntegrity` no puede fallar.

Empresas con 4 años de estados (2022–2025), además de Innova (5) y de las tres similares de tecnología: `co-mercado` (comercio), `co-ladrillo` (construcción), `co-punto` (servicios), `co-metal` (industria), `co-andes` (transporte), `co-bienestar` (salud). Cifras crecientes y distintas de las de Innova. El resto de las 50 lleva un solo año (2025) salvo estas ocho, que no llevan ningún periodo para conservar el vacío: `co-horizonte`, `co-faro`, `co-semilla`, `co-recicladores`, `co-horno`, `co-cafe`, `co-marea` y `co-vitrina`.

### Empresas de las fases 4 y 7

| Id | NIT | Rol en la demo |
| --- | --- | --- |
| `co-innova-labs` | 901900001-1 | Subsidiaria. Fase 4 |
| `co-andina-soft` | 901900002-1 | Similar. Fase 7 |
| `co-codigo-sur` | 901900003-1 | Similar. Fase 7 |
| `co-nodo-cali` | 901900004-1 | Similar. Fase 7 |

### 24 empresas de la fase 8 (NIT `901900005-1` … `901900028-1`, en este orden)

Todas: Valle del Cauca, Cámara de Comercio de Cali, matrícula mercantil activa, estado jurídico vigente, organización S.A.S. salvo donde dice LTDA. Dirección ficticia en el municipio. `fuenteDatos` DEMO.

| Id | Razón social | Sector | CIIU | Tamaño | Municipio | Organización |
| --- | --- | --- | --- | --- | --- | --- |
| `co-bitacora` | Bitácora Cloud S.A.S. | TECNOLOGIA | 6311 | PEQUENA | Jamundí | S.A.S. |
| `co-puente-api` | Puente API del Valle S.A.S. | TECNOLOGIA | 6201 | MICRO | Buga | S.A.S. |
| `co-despensa` | Despensa del Río S.A.S. | COMERCIO | 4711 | PEQUENA | Cali | S.A.S. |
| `co-granel` | Granel Palmira LTDA | COMERCIO | 4631 | MEDIANA | Palmira | LTDA |
| `co-vitrina` | Vitrina Norte S.A.S. | COMERCIO | 4711 | MICRO | Cali | S.A.S. |
| `co-abasto` | Abasto Caña S.A.S. | COMERCIO | 4631 | PEQUENA | Tuluá | S.A.S. |
| `co-mercado-yumbo` | Mercado de la 47 S.A.S. | COMERCIO | 4711 | MICRO | Yumbo | S.A.S. |
| `co-cimbra` | Cimbra del Pacífico S.A.S. | CONSTRUCCION | 4111 | MEDIANA | Cali | S.A.S. |
| `co-losa` | Losa Blanca Constructores S.A.S. | CONSTRUCCION | 4111 | GRANDE | Cali | S.A.S. |
| `co-cableado` | Cableado del Valle S.A.S. | CONSTRUCCION | 4321 | PEQUENA | Yumbo | S.A.S. |
| `co-acabados` | Acabados La Flora S.A.S. | CONSTRUCCION | 4111 | MICRO | Palmira | S.A.S. |
| `co-aula` | Aula Abierta del Valle S.A.S. | SERVICIOS | 8559 | PEQUENA | Cali | S.A.S. |
| `co-gestion` | Gestión Ladera LTDA | SERVICIOS | 7020 | MICRO | Buga | LTDA |
| `co-molde` | Molde Valle S.A.S. | INDUSTRIA | 2599 | PEQUENA | Cartago | S.A.S. |
| `co-hilaza` | Hilaza del Sur S.A.S. | INDUSTRIA | 1410 | MEDIANA | Palmira | S.A.S. |
| `co-corredor` | Corredor Pacífico Carga S.A.S. | TRANSPORTE | 4923 | MEDIANA | Yumbo | S.A.S. |
| `co-lastre` | Lastre Buenaventura S.A.S. | TRANSPORTE | 5222 | PEQUENA | Buenaventura | S.A.S. |
| `co-colectivo` | Colectivo Rural del Centro S.A.S. | TRANSPORTE | 4921 | MICRO | Tuluá | S.A.S. |
| `co-patio` | Patio Logístico del Sur S.A.S. | TRANSPORTE | 4923 | PEQUENA | Palmira | S.A.S. |
| `co-clinica-rio` | Clínica del Río Demo S.A.S. | SALUD | 8610 | MEDIANA | Cali | S.A.S. |
| `co-laboratorio` | Laboratorio Limonar S.A.S. | SALUD | 8699 | PEQUENA | Cali | S.A.S. |
| `co-opticas` | Ópticas del Valle S.A.S. | SALUD | 8699 | MICRO | Palmira | S.A.S. |
| `co-cuidado` | Cuidado en Casa S.A.S. | SALUD | 8699 | PEQUENA | Buga | S.A.S. |
| `co-imagen` | Imagen Diagnóstica Sur S.A.S. | SALUD | 8699 | PEQUENA | Jamundí | S.A.S. |

Conteo final por sector: Tecnología 8, Comercio 7, Construcción 6, Servicios 8, Industria 8, Transporte 7, Salud 6. Total 50.

Cada empresa nueva lleva al menos constitución y matrícula en `events.ts` (categoría registral, fuente `REGISTRO_MERCANTIL`) para que `fechaUltimaActualizacion` no quede vacía. No hace falta un juego de alertas propio: las reglas actuales alcanzan si el evento trae metadata de cambio. No es obligatorio que todas alerten.

Aserciones finales del test de dataset: 50 empresas, 50 personas, 6 reglas (no se agregan reglas), eventos de Innova ≥ 10, alertas de Innova ≥ 5, cinco años financieros de `co-innova`, cuatro directivos vigentes, tres socios vigentes que suman 100, una subsidiaria, siete sectores presentes, benchmarks 28 filas.

---

## 9. Rutas nuevas

| Ruta | Permiso | Página |
| --- | --- | --- |
| `/comparador` | sesión + `empresas.consultar` | `ComparadorScreen` |
| `/sectores` | sesión + `sectores.ver` | `SectorsScreen` |
| `/sectores/[codigo]` | sesión + `sectores.ver` | `SectorDetailScreen` |
| `/listas` | administrador y analista | `ListsScreen` |

Las rutas actuales no se renombran. `/empresas/[id]` sigue siendo la ficha.

## 10. Endpoints nuevos

Todos exigen sesión. Cuerpos y queries con Zod. Errores con `AppError` y `toErrorResponse`, igual que el resto.

| Método y ruta | Permiso | Respuesta |
| --- | --- | --- |
| `GET /api/empresas/[id]/finanzas` | `empresas.perfil` | `{ periodos, indicadores, fuente: "DEMO" }`. Periodos ascendentes por año. Indicadores del último. 404 si la empresa no existe. Lista vacía si no hay periodos |
| `GET /api/empresas/[id]/similares` | `empresas.perfil` | `{ items: SimilarItem[] }` máximo 5. Cada ítem: id, razón social, NIT, sector, ciudad, tamaño, ingresos del último año, puntaje (solo para ordenar; la UI no lo muestra como ranking) |
| `GET /api/empresas/[id]/sector` | `empresas.perfil` | `{ anio, empresa, promedio, diferencias }` o `{ vacio: true }` si no hay periodo |
| `GET /api/comparador?ids=` | `empresas.consultar` | `{ columnas, ausentes }`. 400 si hay más de 4 ids |
| `GET /api/sectores` | `sectores.ver` | `{ items: SectorResumen[] }` siempre 7 |
| `GET /api/sectores/[codigo]` | `sectores.ver` | detalle de la sección 6. 404 si el código no está en el mapa |
| `GET /api/listas` | `listas.ver` | listas del usuario con sus empresas (id, razón social, NIT, sector) |
| `POST /api/listas/[id]/empresas` | `listas.gestionar` | body `{ companyId }`. 404 si la lista no es del usuario o la empresa no existe. 200 si ya estaba (`exists`) o si se creó |
| `DELETE /api/listas/[id]/empresas/[companyId]` | `listas.gestionar` | 404 si no estaba |
| `GET /api/busquedas` | `empresas.consultar` | búsquedas del usuario |
| `POST /api/busquedas` | `busquedas.guardar` | body `{ nombre, filtros }`. 400 si supera 20 |
| `DELETE /api/busquedas/[id]` | `busquedas.guardar` | solo las propias |

### Endpoints que cambian de forma y siguen en la misma URL

`GET /api/empresas` acepta los filtros y el orden de la sección 6. Cada `CompanyListItem` suma `sector`, `numeroEmpleados`, `ingresos` y `activosEstados` (último periodo o null). `opciones` suma `departamentos` y `sectores`.

`GET /api/empresas/[id]` suma `sector`, `fuenteDatos`, `cobertura`, `ultimoPeriodo` (año, ingresos, activos, patrimonio, utilidad, empleados, variaciones) y mantiene relaciones, timeline y alertas con la misma redacción por rol. El timeline del perfil pasa a ser el unificado. El consultor sigue recibiendo `relaciones`, `timeline` y `alertas` en `null`.

`GET /api/empresas/[id]/grafo`: `GraphNode.type` suma `suplente`, `junta`, `revisor`, `accionista`, `matriz`, `subsidiaria`. `SOCIO` con `porcentajeParticipacion` distinto de null se dibuja `accionista`; sin porcentaje, `socio`. `data.empresaId` es el id cuando el nodo es empresa relacionada, matriz o subsidiaria; si no, null. El panel, si `empresaId` viene, muestra el botón «Ver perfil» hacia `/empresas/{empresaId}`.

`GET /api/dashboard` acepta además `sector`, `departamento`, `tamanoEmpresa`. KPI suma `disponibles` (empresas del padrón ya filtrado). Series nuevas: `empresasPorSector`, `empresasPorDepartamento`, `empresasPorTamano`, `ingresosAgregados` (número), `crecimientoPromedio` (número o null), `alertasPorCategoria`. Las series viejas se quedan. `opciones` suma departamentos, sectores y tamaños.

Query keys nuevas: `['company', id, 'finanzas']`, `['company', id, 'similares']`, `['company', id, 'sector']`, `['comparador', ids]`, `['sectores']`, `['sector', codigo]`, `['listas', userId]`, `['busquedas', userId]`. Al mutar una lista o una búsqueda se invalida esa key. Agregar al comparador no invalida queries: es estado de UI.

---

## 11. Pantalla del perfil 360

Cabecera, de arriba abajo: `DataSourceBadge`, razón social, NIT, estado de matrícula, ciudad, sector, actividad (código y descripción), `LastUpdatedLabel`. Acciones: Monitorear (el botón actual), Comparar, Exportar, y «Agregar a lista» solo si el rol tiene `listas.gestionar`.

Pestañas, en este orden, ocultando las que el rol no puede ver:

1. **Resumen.** Cinco KPI (ingresos, activos de estados, patrimonio, utilidad, empleados) con variación. Párrafo de `buildCompanySummary` ampliado. Bloque «Datos clave» (matrícula, actividad, tamaño, ciudad, antigüedad). Gráfico de evolución de ingresos. Cuatro eventos recientes. Tres alertas recientes, si el rol ve alertas. Hasta cinco similares, cada una con «Ver perfil» y «Comparar». `CoverageList`.
2. **Datos registrales.** Los grupos que ya existen (identificación, registro, ubicación, actividad, representación). Capital y activos se titulan «Información financiera registral». Si ambos son null, se mantiene «Sin información financiera disponible».
3. **Finanzas.** KPI ingresos, EBITDA, utilidad, activos, patrimonio. Gráficos: evolución de ingresos, evolución de utilidad, activos vs pasivos (dos series). Tabla anual con todos los campos del periodo y los ocho indicadores. `DataSourceBadge` y año de corte.
4. **Directivos y propiedad.** Dos listas. Directivos: nombre, cargo, vigencia, desde. Accionistas: nombre y participación. Vacío: «Esta empresa no tiene directivos registrados.» / «Esta empresa no tiene accionistas registrados.»
5. **Relaciones.** La lista actual, más la tabla de empresas relacionadas (columnas Empresa, NIT, Tipo de vínculo, Participación, Vigencia, Ver perfil) con tipos empresa relacionada, matriz y subsidiaria. El grafo debajo, con el panel nuevo.
6. **Comparación.** Bloque empresa vs sector y, debajo, las mismas similares del resumen, para no obligar a volver a la primera pestaña. Enlace «Abrir comparador».
7. **Timeline.** Filtro por las seis categorías.
8. **Alertas.** La lista actual. No se rediseña el flujo de marcar leída (eso sigue en `/alertas`).

Estados de carga, error y vacío en cada bloque que pide su propio query, con los componentes que ya existen.

---

## 12. Orden de las 10 fases

Cada fase deja la demo anterior andando. El test de volúmenes se actualiza cuando el seed cambia. No se reescribe login, administración ni el motor de reglas.

### Fase 1 — Perfil 360

Esquema: `SectorCodigo`, `Company.sector`, `Company.fuenteDatos`, `CategoriaEvento`, `TimelineEvent.categoria`, `TipoEvento.NOTICIA` y `NOMBRAMIENTO`. Seed: sector de las 22 según la tabla, categoría de los eventos actuales, las dos noticias y el nombramiento de Innova. Permiso `sectores.ver` ya creado, aunque la página de sectores llegue en la fase 8.

UI: cabecera nueva, pestañas (Finanzas, Directivos, Comparación y Relaciones enriquecida pueden renderizar vacío «Disponible en la siguiente entrega» solo si la fase aún no tiene datos; al terminar la fase 3 esas frases ya no existen). Resumen con cobertura, badge y fecha. El gráfico de evolución y los KPI financieros muestran el vacío financiero hasta la fase 2. Exportar CSV de lo que ya está cargado. `DataSourceBadge` y `LastUpdatedLabel` nacen aquí y se reutilizan después.

El buscador de inicio y las columnas nuevas del explorador esperan a la fase 10 y a la fase 2. Buscar «INNOVA VALLE» en `/empresas` sigue funcionando.

### Fase 2 — Finanzas

Modelo `CompanyFinancialPeriod`. Seed: cinco años de Innova (tabla de la sección 7), cuatro años de las seis principales, metadata de la renovación 2025. Servicio de indicadores con tests de división por cero, corriente ausente y crecimiento sin año previo. Endpoint de finanzas. Pestaña Finanzas completa. Los KPI y el gráfico del resumen leen ese endpoint. Celdas de ingresos, activos y empleados del explorador (aún sin el resto de columnas nuevas) pueden esperar a la fase 10; el dato ya viaja en el list item desde esta fase para no hacer dos viajes al contrato.

### Fase 3 — Directivos y propiedad

Enums de cargo y campo `cargo`. Cuatro personas nuevas, porcentajes 50/35/15, suplente, junta, revisor, segundo establecimiento. Integridad de relaciones actualizada. Pestaña Directivos y propiedad. La cobertura ya cuenta 4 y 3 en Innova.

### Fase 4 — Grafo

Enums `MATRIZ` y `SUBSIDIARIA`. Empresa `co-innova-labs` con las dos relaciones y sus eventos mínimos de constitución y matrícula. Tipos de nodo, `empresaId`, botón «Ver perfil», tabla de empresas relacionadas. Tests del grafo no son obligatorios si no existen hoy; sí un test de integridad que exija `relatedCompanyId` en matriz y subsidiaria.

### Fase 5 — Comparador

Store, ruta, endpoint, nav, botón del perfil, tope de 4, gráficos. Sin empresas nuevas.

### Fase 6 — Empresa vs sector

Modelo `SectorBenchmark`, 28 filas, endpoint, pestaña Comparación con el bloque de diferencias. Similares todavía no; el bloque de similares de esa pestaña queda vacío hasta la fase 7, con el texto «Aún no hay empresas similares calculadas» reemplazado en la fase 7 por las tarjetas. Mejor: la fase 6 no pinta el hueco de similares; la fase 7 lo agrega. La pestaña en la fase 6 es solo empresa vs sector más el enlace al comparador.

### Fase 7 — Empresas similares

`similar-companies.ts` con tests del puntaje (mismo CIIU y tamaño por encima de solo sector; tope 5; la propia empresa excluida; denominador de ingresos 0 no revienta). Seed de las tres medianas 6201 con cuatro años. Endpoint. Bloque en Resumen y en Comparación. Botón Comparar en cada tarjeta.

### Fase 8 — Sectores

Las 24 empresas, personas hasta 50, representantes, eventos mínimos, un año financiero salvo la lista de ocho sin periodos. Rutas y endpoints de sectores. Nav Sectores. Resumen determinístico, cinco empresas por ingresos, distribuciones, evolución, promedios del benchmark.

### Fase 9 — Dashboard

`disponibles`, por sector, por departamento, por tamaño, ingresos agregados, crecimiento promedio, alertas por categoría. Filtros de periodo (ya existen), sector, departamento y tamaño, sumados a los filtros actuales. Los gráficos viejos siguen. Empty state actual cuando una serie queda vacía.

### Fase 10 — Mejora visual

Sin cambiar de librería y sin imitar la referencia.

- Inicio: el primer bloque es el buscador a ancho completo, placeholder exacto «Buscar empresa por nombre, NIT, actividad o sector». Enviar lleva a `/empresas?q=`. Debajo, en grilla: consultadas recientes, monitoreadas, alertas recientes, accesos a los 7 sectores, búsquedas guardadas. El saludo puede quedar encima, en una línea, más chico que el buscador.
- Explorador: filtros de departamento, sector, empleados, ingresos y activos; tabla con las ocho columnas y orden por encabezado (`button` con `aria-sort`, no un `div` clickeable). Móvil con los mismos campos.
- Búsquedas guardadas (modelo, endpoints, dialog).
- Listas (modelo, ruta, nav, diálogo del perfil, seed del analista y del administrador).
- Timeline: los seis filtros como grupo de botones, además del select si hace falta en móvil; el select solo puede sustituirse si el grupo es usable con teclado.
- Densidad, foco visible y vacíos de las pantallas nuevas. El aviso ámbar de datos simulados se queda.
- No se mueve el shell a otra librería. No se cambian colores de marca.

### Flujo de demo al cerrar la fase 10

Con `analista@demo.ccc` / `CccDemo.2026`, sin errores de consola ni estados de error de red:

1. Login.
2. Inicio, buscar «Innova Valle».
3. Abrir el perfil 360: cabecera, generales registrales, finanzas, evolución de ingresos 2021–2025, directivos y tres accionistas, grafo con panel y «Ver perfil» hacia Innova Labs y hacia Nube, tabla de relaciones, timeline con los seis filtros, cinco alertas.
4. Empresa vs sector (Tecnología 2025) y similares (las tres medianas).
5. Agregar Innova al comparador, agregar otras dos con estados, abrir `/comparador`.
6. Sector Tecnología: conteo, ingresos, evolución, promedios de demostración.
7. Dashboard con filtro de sector Tecnología.
8. Badge «Datos de demostración» visible en el perfil, en finanzas y en el sector.

---

## 13. Fuera de este plan

Microservicios, Kubernetes, Kafka, Neo4j, PostgreSQL en esta entrega, proveedor OIDC real, datos reales de la cámara, puntajes de calidad, rankings, modelos de similitud, reescritura de la UI por `itc-frontend-base`, y cualquier cambio en `main`. Este archivo vive solo en el worktree del MVP.
