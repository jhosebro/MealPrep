// Supabase en memoria para los tests BDD (register.mjs redirige services/supabase.ts aquí).
type Row = Record<string, any>;

export const db = {
  tables: {} as Record<string, Row[]>,
  fail: false,
  seq: 0,
  reset() {
    this.tables = {};
    this.fail = false;
  },
};

const table = (name: string) => (db.tables[name] ??= []);

class Query implements PromiseLike<{ data: any; error: Error | null }> {
  private filters: [string, any][] = [];
  private op: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: any;
  private mode: 'many' | 'single' | 'maybe' = 'many';
  constructor(private name: string) {}

  select() { return this; }
  order() { return this; }
  or() { return this; }
  insert(v: any) { this.op = 'insert'; this.payload = v; return this; }
  update(v: any) { this.op = 'update'; this.payload = v; return this; }
  delete() { this.op = 'delete'; return this; }
  eq(col: string, val: any) { this.filters.push([col, val]); return this; }
  single() { this.mode = 'single'; return this; }
  maybeSingle() { this.mode = 'maybe'; return this; }

  private run(): { data: any; error: Error | null } {
    if (db.fail) return { data: null, error: new Error('Servidor no disponible') };
    const rows = table(this.name);
    const match = (r: Row) => this.filters.every(([c, v]) => r[c] === v);
    let out: Row[];
    if (this.op === 'insert') {
      out = [].concat(this.payload).map((r: Row) => ({
        id: `id${++db.seq}`, created_at: new Date().toISOString(), ...r,
      }));
      rows.push(...out);
    } else if (this.op === 'update') {
      out = rows.filter(match);
      out.forEach((r) => Object.assign(r, this.payload));
    } else if (this.op === 'delete') {
      out = rows.filter(match);
      db.tables[this.name] = rows.filter((r) => !match(r));
    } else {
      out = rows.filter(match);
    }
    out = out.map((r) => ({ ...r }));
    if (this.mode === 'many') return { data: out, error: null };
    if (this.mode === 'single' && out.length !== 1) return { data: null, error: new Error('No rows') };
    return { data: out[0] ?? null, error: null };
  }

  then<A = any, B = never>(ok?: ((v: any) => A | PromiseLike<A>) | null, ko?: ((e: any) => B | PromiseLike<B>) | null) {
    return Promise.resolve(this.run()).then(ok, ko);
  }
}

export const supabase = {
  from: (name: string) => new Query(name),
  rpc: async () => ({ data: null, error: null }),
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signOut: async () => ({ error: null }),
  },
};

export const secureSessionStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};
