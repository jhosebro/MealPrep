// Redirige services/supabase.ts y AsyncStorage (módulos nativos) a dobles en memoria.
import { registerHooks } from 'node:module';

const fake = new URL('./fake-supabase.ts', import.meta.url).href;
const fakeStorage = new URL('./fake-async-storage.ts', import.meta.url).href;
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: fakeStorage, shortCircuit: true };
    const r = next(specifier, context);
    return r.url.endsWith('/services/supabase.ts') ? { ...r, url: fake } : r;
  },
});
