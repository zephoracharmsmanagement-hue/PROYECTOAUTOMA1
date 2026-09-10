# Entrega y protección de video

## Proveedor: Bunny Stream

Elegido por relación coste/protección: almacenamiento y tráfico baratos, CDN
global, y tokens de reproducción firmados sin necesidad de DRM de pago.

## Cómo se protege el contenido

```
Navegador                 Servidor Next.js                  Bunny
    │                            │                            │
    ├─ GET /api/lessons/:id/playback                          │
    │                            ├─ ¿is_preview? → permitir   │
    │                            ├─ ¿sesión válida?           │
    │                            ├─ RPC has_package_access()  │
    │                            ├─ token = sha256(key+id+exp)│
    │◀── { embedUrl, expiresAt } ┤                            │
    ├─ <iframe src=embedUrl> ────────────────────────────────▶│
    │                                                    valida token
```

Propiedades:

- La **clave de la librería nunca sale del servidor**. El navegador solo recibe
  un hash ya calculado.
- El token **caduca** (`BUNNY_TOKEN_TTL_MINUTES`, por defecto 180). Un enlace
  compartido en un grupo deja de funcionar solo.
- `video_asset_id` está protegido por RLS: quien no tiene acceso no puede leerlo
  ni siquiera consultando la tabla directamente. El temario público viaja por la
  vista `lesson_outline`, que no incluye esa columna.
- La respuesta lleva `Cache-Control: private, no-store`: ningún proxy la guarda.

## Lo que esto NO impide

Ninguna protección sin DRM evita la grabación de pantalla. El objetivo realista
es **elevar el coste de la piratería casual** (compartir un enlace), no hacerla
imposible. Si en algún momento el contenido lo justifica, las siguientes palancas
son, por orden de coste/beneficio:

1. Marca de agua dinámica con el email del usuario (Bunny lo soporta).
2. Límite de reproducciones simultáneas por cuenta.
3. DRM real (Widevine/FairPlay) — requiere Mux u otro proveedor con DRM.

## Subir un video

1. Bunny Dashboard → Stream → tu librería → Upload.
2. Copia el **GUID** del video.
3. Guárdalo en la lección:

```sql
update public.lessons
   set video_asset_id = 'a1b2c3d4-...', duration_seconds = 1320, provider = 'bunny'
 where id = '...';
```

## Cambiar de proveedor

Toda la app consume `signPlayback()` (`src/lib/video/index.ts`), nunca un SDK
concreto. Para añadir Mux:

1. `src/lib/video/mux.ts` implementando la interfaz `VideoProvider`.
2. Nuevo `case 'mux'` en el `switch` de `index.ts`.
3. El valor `mux` ya existe en el enum `video_provider`, así que ni siquiera hace
   falta migración.

Se pueden mezclar proveedores por lección: el campo `provider` es por fila.
