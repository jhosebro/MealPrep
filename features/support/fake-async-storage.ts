// AsyncStorage en memoria para los tests BDD (register.mjs redirige el paquete aquí).
const mem = new Map<string, string>();
export default {
  getItem: async (k: string) => mem.get(k) ?? null,
  setItem: async (k: string, v: string) => void mem.set(k, v),
  removeItem: async (k: string) => void mem.delete(k),
};
