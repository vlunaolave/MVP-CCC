# Plataforma Integral de Inteligencia Empresarial - MVP

Consulta, seguimiento y visualización de información empresarial de referencia para la Cámara de Comercio de Cali. Este repositorio es un MVP demostrable: los datos son simulados y cubren Registro Mercantil y ESAL. No es la plataforma productiva de la Cámara.

## Objetivo

Ofrecer un recorrido completo para consultar una empresa, leer su ficha, seguirla, revisar alertas, ver su historia y sus relaciones, mirar el tablero y administrar usuarios. La interfaz habla con Route Handlers; la persistencia está detrás de repositorios, de modo que más adelante se pueda cambiar SQLite por otra fuente sin reescribir las pantallas.

## Funcionalidades

- Ingreso local con tres roles: administrador, analista y consultor.
- Buscador de empresas por NIT, razón social o nombre comercial, con filtros de registro, matrícula, municipio, actividad y tamaño.
- Perfil con resumen determinístico, información registral, relaciones, línea de tiempo y alertas, según el rol.
- Monitoreo por usuario, con alta y baja.
- Centro de alertas generado por reglas demostrativas, con lectura y contador en el encabezado.
- Tablero con cinco indicadores y seis gráficos.
- Grafo de relaciones ya registradas y línea de tiempo filtrable, dentro del perfil.
- Administración de usuarios, consulta de roles y tres parámetros de configuración.
- Auditoría de ingreso, salida, consulta, monitoreo, lectura de alertas y cambios administrativos.

## Arquitectura

`src/app` solo enruta. La interfaz vive en `src/features/<dominio>` y lo compartido en `src/shared`. Un feature no importa carpetas internas de otro: usa el `index.ts` público.

La lectura y la escritura pasan por `src/server/services`, que dependen de interfaces en `src/server/repositories`. La implementación de este MVP es SQLite (`Sqlite*Repository`). `ApiCompanyRepository` existe como contrato y no está conectada.

La carga inicial del padrón usa `DataSourceAdapter`. `DemoDataSourceAdapter` lee `prisma/data`. `ApiDataSourceAdapter` y `FileDataSourceAdapter` cumplen el mismo contrato y responden que aún no están habilitadas.

La sesión es una cookie httpOnly (`ccc_session`) con el identificador de la sesión. `src/middleware.ts` distingue rutas públicas, autenticadas y restringidas por rol. Cada Route Handler vuelve a comprobar el permiso contra la base.

El cliente pide datos con TanStack Query y Axios. Zustand guarda la sesión en memoria y el estado del menú. Los formularios se validan con Zod.

## Stack tecnológico

- Next.js (App Router y Route Handlers), React 19, TypeScript estricto
- Tailwind CSS 4 y shadcn/ui (Radix)
- Prisma y SQLite
- TanStack Query, Axios, Zustand, Zod, React Hook Form
- Recharts y React Flow (`@xyflow/react`)
- Vitest y Testing Library

`itc-frontend-base` no está en el registro público de npm, así que los primitivos de interfaz son los de shadcn/ui.

## Instalación

Requiere Node.js 20.9 o superior.

```bash
npm install
cp .env.example .env
```

El archivo `.env` de ejemplo trae valores solo para esta demostración:

```bash
DATABASE_URL="file:./dev.db"
AUTH_SECRET="ccc-demo-auth-secret-local-only"
AUTH_PROVIDER="local"
```

`AUTH_SECRET` no es un secreto de la Cámara. Si faltan las variables, la aplicación sigue usando esta base local y el proveedor `local`.

## Ejecución

```bash
npm run db:setup
npm run dev
```

La aplicación queda en [http://localhost:43123](http://localhost:43123).

`db:setup` aplica la migración y siembra los datos. Si la base ya existe y solo quieres volver a cargarla:

```bash
npm run db:seed
```

Pruebas:

```bash
npm test
```

## Base de datos

Prisma con provider `sqlite`. El archivo queda en `prisma/dev.db` y no se versiona. Los identificadores son texto, las fechas `DateTime`, el dinero `Decimal` y los metadatos `Json`: los mismos tipos sirven en PostgreSQL. Cambiar de motor, más adelante, es ajustar `provider` y `DATABASE_URL` y volver a migrar. Los servicios no conocen el motor.

## Seed

`npx prisma db seed` vacía las tablas de negocio y las vuelve a cargar desde `prisma/data`. El resultado de referencia es 22 empresas, 13 personas, 6 reglas demostrativas, 36 eventos o más y 16 alertas o más. El aviso visible en la aplicación recuerda que los datos no identifican personas ni empresas reales.

## Usuarios de prueba

La contraseña es la misma para las tres cuentas: `CccDemo.2026`.

| Correo | Rol |
| --- | --- |
| admin@demo.ccc | Administrador |
| analista@demo.ccc | Analista |
| consultor@demo.ccc | Consultor |

Una clave incorrecta responde «Correo o contraseña incorrectos.» Una cuenta inactiva responde «Esta cuenta está desactivada.» y no abre sesión.

## Caso principal de demostración

**INNOVA VALLE S.A.S.**, NIT `901847263-1`. Matrícula mercantil activa `543210-1` en la Cámara de Comercio de Cali, constituida el 2018-02-20, renovada el 2026-03-02. Actividad CIIU 6201, tamaño mediano, 48 empleados, domicilio en Cali. Representante legal Mariana Restrepo Quintero. Socios Mariana (60 %) y Andrés Felipe Caicedo Ríos (40 %). Establecimiento Innova Valle Lab. Empresa relacionada: Nube del Pacífico S.A.S. Helena Suárez Patiño fue representante hasta el 2024-01-16. El perfil muestra alertas de domicilio, actividad, representante y la renovación de 2026. El analista y el administrador ya la tienen en monitoreo.

**Fundación Horizonte del Pacífico**, NIT `900554812-4`, es la ESAL completa. Registro activo, representante Lucía Elena Vargas Mora, miembro fundador Camilo Andrés Muñoz Díaz y sede en Cali. Capital y activos no están informados: la ficha dice «Sin información financiera disponible».

## Flujo de demostración

1. Abrir la plataforma.
2. Entrar como analista (`analista@demo.ccc`).
3. Ver el inicio.
4. Buscar «INNOVA VALLE».
5. Abrir el perfil.
6. Ver la información consolidada.
7. Agregar a monitoreo, o comprobar que ya está en seguimiento y retirarla si se quiere ver el alta de nuevo.
8. Consultar alertas.
9. Abrir el timeline.
10. Ver la evolución histórica.
11. Abrir el grafo y las relaciones.
12. Volver al dashboard.
13. Ver los indicadores consolidados.
14. Entrar como administrador (`admin@demo.ccc`) a Administración.
15. Ver usuarios y roles.

El consultor ve inicio, empresas, el resumen registral y el dashboard. No ve monitoreo, alertas, relaciones, timeline ni administración. Escribir esas rutas lo lleva a acceso denegado.

## Limitaciones del MVP

- No hay un proveedor de identidad real. OIDC, OAuth 2.0 y SAML están declarados y rechazan la autenticación.
- No hay conexión con Registro Mercantil, ESAL ni fuentes comerciales. El padrón es ficticio.
- No hay score, inteligencia artificial, importación de Excel ni editor de permisos.
- Las reglas de alerta son demostrativas y se evalúan al sembrar, no en un proceso continuo.
- No se puede dejar la plataforma sin un administrador activo ni desactivar la sesión propia.
- SQLite es local. PostgreSQL no está levantado.
- No incluye multiempresa de la Cámara, nube, observabilidad ni un portal de desarrolladores.

## Evolución futura

Un proveedor de identidad se registraría junto a `LocalCredentialsProvider` y crearía la misma sesión. Una fuente real implementaría `DataSourceAdapter` o un `CompanyRepository` nuevo y se conectaría en el contenedor de servicios, sin cambiar las pantallas. Las reglas oficiales de la Cámara reemplazarían las filas `AlertRule` y la función `evaluateDemoRules`. El paso a PostgreSQL es de configuración y migración, no de interfaz.
