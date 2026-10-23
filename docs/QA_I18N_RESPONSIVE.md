# QA de idiomas y diseño adaptable — Web

## Alcance

Revisar login y recuperación de acceso, panel general, pedidos, caja/pagos y recibos, domicilios y ajustes operativos en español (`es`), inglés (`en`), portugués (`pt`) y francés (`fr`). Incluir estados vacíos, carga, errores de API, validación de formularios, alertas, diálogos y textos largos.

## Comprobación automatizada

Desde `admin-web`:

```bash
npm run i18n:audit
npm test
npm run lint
npm run typecheck
npm run build
```

`i18n:audit` carga los recursos reales de `src/config/i18n.ts`, compara claves anidadas de los cuatro idiomas y reporta claves faltantes, vacías y textos posiblemente sin traducir. `--strict-untranslated` hace fallar también los candidatos sin traducir. Las frases compartidas válidas de portugués y las unidades/variables se documentan como excepciones revisadas; cualquier excepción nueva requiere revisión manual.

## Matriz de revisión visual

Usar datos sintéticos y sesión de QA. En cada combinación, cambiar idioma, volver a cargar la pantalla y abrir los estados de éxito, validación y error aplicables.

| Viewport CSS | Clase | Idiomas | Estado |
| --- | --- | --- | --- |
| 360 × 800 | Teléfono | es, en, pt, fr | Pendiente de recorrido visual |
| 768 × 1024 | Tableta | es, en, pt, fr | Pendiente de recorrido visual |
| 1366 × 768 | Escritorio | es, en, pt, fr | Pendiente de recorrido visual |

Revisar desbordamiento horizontal, texto cortado, botones y diálogos, navegación, foco, campos, contraste, tamaño de fuente y recibo completo. Registrar el zoom del navegador y el navegador/versión utilizados. La matriz se considera aprobada solo al adjuntar capturas reales de cada viewport e idioma probado.

## Registro de ejecución y defectos

Ejecución local en la rama QA (2026-10-22): auditoría de **136 claves**, 0 faltantes, 0 vacías y 0 candidatos sin revisar; `npm test` pasó (3 pruebas). El recorrido visual real sigue pendiente; no se registran capturas ni resultados de navegador que no se hayan ejecutado.

Hallazgos de calidad reproducidos en archivos sin cambios de esta HU:

| ID | Verificación | Resultado observado | Estado |
| --- | --- | --- | --- |
| WEB-QA-04-01 | `npm run lint` | Falla en `src/features/auth/context/auth-context.tsx:58` por `react-hooks/set-state-in-effect`. | Defecto preexistente en `qa` |
| WEB-QA-04-02 | `npm run typecheck` | Falla en `src/features/auth/views/login-view.tsx:16`: no resuelve `@/assets/img/logo.png`. | Defecto preexistente en `qa` |

`npm run i18n:audit` y ESLint sobre el auditor añadido pasan. No se ejecutó build ni un navegador real en esta revisión.

Por cada ejecución, guardar:

| Fecha/hora | Commit/versión | Idioma | Navegador/OS | Viewport/zoom | Pantalla/flujo | Resultado | Captura |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | No ejecutado | — |

Para cada defecto: ID, severidad, idioma, viewport, navegador/OS, pantalla y estado, pasos para reproducir, resultado esperado/observado, ruta de captura y estado de corrección. Guardar capturas sin credenciales, tokens ni datos personales.
