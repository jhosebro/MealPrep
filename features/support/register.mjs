// Redirige services/supabase.ts (que carga módulos nativos) al Supabase falso.
import { registerHooks } from 'node:module';

const fake = new URL('./fake-supabase.ts', import.meta.url).href;
registerHooks({
  resolve(specifier, context, next) {
    const r = next(specifier, context);
    return r.url.endsWith('/services/supabase.ts') ? { ...r, url: fake } : r;
  },
});
