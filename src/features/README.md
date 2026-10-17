# Features del frontend web

La organización por feature mantiene cada dominio aislado y evita mezclar lógica de negocio en componentes.

## Bloques recomendados por feature

- components/
- hooks/
- services/
- utils/
- types/
- constants/

## Principios

- la pantalla solo recibe eventos y dispara acciones
- los servicios encapsulan llamadas HTTP y transformación de datos
- los hooks centralizan estado y lógica reutilizable
- el realtime queda separado del render visual
