# SaborExpress · panel web

Autor y propietario: [yersonct](https://github.com/yersonct).

Panel administrativo con Next.js, React, TypeScript y cuatro idiomas: español, inglés, portugués y francés.

## Inicio local

Requiere Node.js 20.19 o superior y el backend de SaborExpress.

1. Instalar dependencias: `npm ci`.
2. Copiar `.env.example` a `.env.local`.
3. Ajustar `NEXT_PUBLIC_API_URL` al origen del backend, por ejemplo `http://localhost:5000`. Las variables `NEXT_PUBLIC_*` son visibles en el navegador; no incluir credenciales.
4. Ejecutar `npm run dev` y abrir `http://localhost:3000`.

En un teléfono físico, usar la IP del servidor accesible desde la misma red. Configurar el origen web permitido y cookies HTTPS en backend para producción.

## Verificación

```sh
npm run lint
npm run typecheck
npm test
npm run i18n:audit -- --strict-untranslated
npm run build
```

`npm run start` sirve producción. Configurar la API **antes** del build. Las solicitudes fallan con un error de configuración si la URL falta o es inválida; no se envían a `undefined/api`.

CI ejecuta instalación reproducible, lint, tipos, pruebas, auditoría y build. Ver `docs/QA_I18N_RESPONSIVE.md` para la matriz visual. No versionar credenciales, cachés, IDE o registros de depuración.
