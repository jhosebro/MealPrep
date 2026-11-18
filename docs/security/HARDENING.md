# Hardening de MealPrep: SOC 2 · ISO/IEC 27001:2022 · ISO/IEC 27701

Fecha: 2026-11-18. Alcance: app Expo (iOS/Android/web), base de datos Supabase y repositorio público de GitHub.
Referencias: SOC 2 Trust Services Criteria (2017, rev. 2022), anexo A de ISO 27001:2022 y cláusulas 7 (responsable del tratamiento) de ISO 27701:2019.

## 1. Modelo de amenazas (resumen)

| Activo | Frontera de confianza | Amenaza principal (STRIDE) |
|---|---|---|
| Tokens de sesión (access/refresh) | Almacenamiento del dispositivo | Divulgación (dispositivo con root o backup) |
| Datos del usuario (nevera, recetas, presupuesto, email) | API REST de Supabase con la clave publicable | Elevación de privilegios / IDOR si falla RLS |
| Cuenta | Login con contraseña / Google / biometría local | Suplantación |
| App web | Navegador | XSS, clickjacking, inyección de scripts de terceros |
| Código y secretos | Repositorio **público** | Divulgación de secretos, dependencias vulnerables |

## 2. Controles implementados en este cambio

| # | Control | Dónde | SOC 2 | ISO 27001 | ISO 27701 |
|---|---|---|---|---|---|
| 1 | Tokens de sesión cifrados en Keychain/Keystore (`expo-secure-store`), con migración automática desde AsyncStorage | `services/supabase.ts` | CC6.1, CC6.7 | A.8.24, A.5.17 | 6.7.1 |
| 2 | Se elimina la copia duplicada en texto plano de la sesión (`app_session`) y se purga la existente | `stores/authStore.ts`, `app/_layout.tsx` | CC6.1 | A.8.12 | 7.4.1 |
| 3 | El fallo biométrico → "Usar contraseña" ahora cierra la sesión (antes la dejaba activa: bypass) | `app/index.tsx` | CC6.1 | A.8.5 | — |
| 4 | Minimización del scope de Google: sin `offlineAccess` (no se usaba) | `services/googleAuth.ts` | CC6.3 | A.5.15 | 7.4.1 |
| 5 | RLS garantizado y versionado en `fridge_items` y `saved_recipes` (antes no estaba en el repo) | `migrations/006_security_hardening.sql` | CC6.1, CC6.3 | A.8.3, A.5.15 | — |
| 6 | Una compra solo puede referenciar alimentos propios (cierra la referencia cruzada entre usuarios) | migración 006 | CC6.1 | A.8.3 | — |
| 7 | **Derecho de supresión**: `delete_my_account()` borra la cuenta y todos sus datos + botón en Configuración | migración 006, `services/accountService.ts`, `app/(tabs)/home.tsx` | P4.3 | A.8.10 | 7.3.6, 7.4.5 |
| 8 | **Derecho de acceso/portabilidad**: "Exportar mis datos" (JSON) | `services/accountService.ts` | P5.1 | A.5.34 | 7.3.8, 7.3.9 |
| 9 | Cabeceras de seguridad web: CSP estricta (scripts por hash, sin `unsafe-inline`), HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` | `netlify.toml` | CC6.6, CC6.7 | A.8.23, A.8.26 | — |
| 10 | Dependencias: `npm audit fix` (sin `--force`): de 51 a 39 vulnerabilidades, 0 críticas | `package-lock.json` | CC7.1 | A.8.8 | — |
| 11 | Dependabot semanal | `.github/dependabot.yml` | CC7.1, CC8.1 | A.8.8 | — |
| 12 | Política de divulgación de vulnerabilidades | `SECURITY.md` | CC2.3, CC7.3 | A.5.24, A.6.8 | — |

Controles que ya existían y se verificaron: PKCE en OAuth, RLS en `budget_*`, `.env` ignorado en git, `.env.example` con placeholders.
El historial de git contiene un `.env` antiguo, pero **solo con la clave publicable y el Client ID de Google**: no son secretos y no hay que rotarlos. La `SUPABASE_SECRET_KEY` nunca se commiteó.

## 3. Acciones manuales pendientes (no se pueden hacer desde el código)

**Bloqueantes (hazlas antes del siguiente despliegue):**

1. **Ejecutar `migrations/006_security_hardening.sql`** en Supabase → SQL Editor y luego las consultas de verificación del final del archivo. Si alguna política existente tiene `qual = true`, elimínala: las políticas permisivas se suman con OR.
2. **Publicar la app web** después de aplicar la migración: los botones de exportar y eliminar llaman a la función nueva.

**Supabase (Auth y plataforma):**

3. Authentication → Policies: contraseña mínima de 10 a 12 caracteres con letras y números; activar *Leaked password protection* (HIBP).
4. Confirmación de email activada y límites de tasa de Auth revisados (Auth → Rate Limits).
5. JWT expiry ≤ 3600 s (así el token de una cuenta borrada caduca pronto).
6. Settings → Database: *Enforce SSL*. Revisar retención de backups/PITR: los datos borrados persisten en los backups hasta que caducan; documéntalo en la política de privacidad.
7. Mantener `SUPABASE_SECRET_KEY` fuera del `.env` de la app: el cliente no la usa. Guárdala en un gestor de secretos.

**GitHub (repo público):**

8. Settings → Code security: *Secret scanning* + *Push protection*, *Private vulnerability reporting* (lo pide `SECURITY.md`) y *Dependabot alerts*.
9. Protección de la rama `master` (PR obligatorio, sin force-push) y 2FA en la cuenta. (SOC 2 CC8.1, ISO A.8.4/A.8.32)

**Privacidad / gobierno (ISO 27701, Ley 1581 de 2012 en Colombia):**

10. Política de tratamiento de datos publicada (también la exigen App Store y Play Store): datos recolectados (email, inventario, recetas, gastos), finalidad, base legal, plazo de retención, encargados (Supabase, Google, Netlify) y canal para ejercer derechos.
11. Definir la retención de cuentas inactivas (por ejemplo, borrar a los 24 meses de inactividad) e implementarla con `pg_cron`.
12. Registro de actividades de tratamiento y DPA firmado con Supabase. (27701 7.2.8, 7.5.1)

## 4. Riesgos residuales aceptados (con fecha de revisión: 2027-02-18)

| Riesgo | Motivo | Mitigación futura |
|---|---|---|
| 39 vulnerabilidades (31 altas) en dependencias | Todas exigen saltos mayores de Expo/React Native y están en tooling de build (metro, jest, cli), no en el bundle de runtime | Actualizar el SDK de Expo con el skill `expo-upgrade` |
| El bloqueo biométrico se puede saltar con un deep link a una ruta interna | La biometría es un bloqueo local de conveniencia; los datos siguen protegidos por la sesión y RLS | Guardia `unlocked` en los layouts protegidos |
| El indicador `biometric_enabled` está en AsyncStorage | Manipularlo exige un dispositivo con root, y solo desactiva el bloqueo local | Moverlo a SecureStore |
| El hash de la CSP depende del snippet inline de expo-router | Si cambia al actualizar Expo, la web queda en blanco | Recalcular el hash tras cada actualización de Expo (comentario en `netlify.toml`) |
| Mensajes de error de Supabase mostrados al usuario | Son mensajes de Auth, sin trazas internas | — |
| Terceros: Open Food Facts recibe códigos de barras y ChatGPT recibe la lista de ingredientes (iniciado por el usuario) | No son datos personales | Mencionarlo en la política de privacidad |
