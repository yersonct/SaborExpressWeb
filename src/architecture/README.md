# Estructura limpia de frontend web

Esta carpeta marca la organización objetivo sin romper la app actual.

## Bloque objetivo

admin-web/src/
├── app/
│ ├── (auth)
│ ├── (dashboard)
│ └── layout.tsx
├── architecture/
├── components/
│ ├── ui/
│ ├── layout/
│ └── feedback/
├── config/
│ ├── api.ts
│ ├── i18n.ts
│ └── env.ts
├── features/
│ ├── auth/
│ ├── dashboard/
│ ├── orders/
│ ├── products/
│ ├── notifications/
│ └── settings/
├── hooks/
├── providers/
├── store/
├── types/
├── utils/
└── styles/

## Mapeo con el proyecto actual

- [admin-web/src/app](../app) -> rutas y layout
- [admin-web/src/features](../features) -> módulos funcionales
- [admin-web/src/config](../config) -> configuración global e i18n
- [admin-web/src/providers](../providers) -> providers del sistema

## Principios

- Las pantallas no hacen lógica de negocio.
- Cada feature tiene componentes, hooks, services y tipos.
- La API se centraliza en services por feature.
- Los websockets y realtime se mantienen en hooks/services dedicados.
- La migración se hace por feature, sin alterar el flujo actual.
