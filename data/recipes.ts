export interface LocalRecipe {
  id: string;
  title: string;
  meal_type: 'desayuno' | 'almuerzo' | 'cena';
  servings: number;
  ingredients: string[];
  missing_ingredients?: string[];
  steps: string[];
}

export const localRecipes: LocalRecipe[] = [
  {
    id: '1',
    title: 'Huevos Revueltos',
    meal_type: 'desayuno',
    servings: 1,
    ingredients: ['huevos', 'mantequilla', 'sal', 'pan'],
    steps: [
      'Bate los huevos con una pizca de sal',
      'Derrite la mantequilla en un sartén a fuego medio',
      'Vierte los huevos y revuelve constantemente',
      'Cocina hasta que estén suaves pero no secos',
      'Sirve con pan tostado'
    ]
  },
  {
    id: '2',
    title: 'Avena con Frutas',
    meal_type: 'desayuno',
    servings: 1,
    ingredients: ['avena', 'leche', 'plátano', 'miel', 'canela'],
    steps: [
      'Hierve la leche en una olla',
      'Añade la avena y reduce el fuego',
      'Cocina por 5 minutos revolviendo',
      'Sirve y toppings con plátano en rodajas',
      'Añade miel y canela al gusto'
    ]
  },
  {
    id: '3',
    title: 'Tostada con Aguacate',
    meal_type: 'desayuno',
    servings: 1,
    ingredients: ['pan', 'aguacate', 'limón', 'sal', 'huevo'],
    steps: [
      'Tuesta el pan hasta que esté dorado',
      'Machaca el aguacate con limón y sal',
      'Unta la mezcla sobre el toast',
      'Opcional: añade un huevo frito encima',
      'Sazona con pimienta y sirve'
    ]
  },
  {
    id: '4',
    title: 'Ensalada Caesar',
    meal_type: 'almuerzo',
    servings: 2,
    ingredients: ['lechuga', 'pollo', 'queso', 'pan', 'mayonesa', 'limón'],
    steps: [
      'Lava y corta la lechuga en trozos',
      'Cocina el pollo a la plancha y córtalo en láminas',
      'Tuesta el pan y corta en cubitos (crutones)',
      'Mezcla mayonesa con limón para la salsa',
      'Combina todo y añade queso rallado'
    ]
  },
  {
    id: '5',
    title: 'Pasta con Tomate',
    meal_type: 'almuerzo',
    servings: 2,
    ingredients: ['pasta', 'tomate', 'ajo', 'aceite', 'albahaca', 'queso'],
    steps: [
      'Cocina la pasta según las instrucciones',
      'Sofríe ajo picado en aceite caliente',
      'Añade tomates picados y cocina 10 min',
      'Escurre la pasta y mézclala con la salsa',
      'Decora con albahaca y queso rallado'
    ]
  },
  {
    id: '6',
    title: 'Sándwich Mixto',
    meal_type: 'almuerzo',
    servings: 2,
    ingredients: ['pan', 'queso', 'jamón', 'mantequilla', 'lechuga'],
    steps: [
      'Unta mantequilla en las rebanadas de pan',
      'Coloca queso y jamón en una mitad',
      'Añade lechuga lavada',
      'Cierra el sándwich',
      'Dorarlo en sarté o simplemente sirve'
    ]
  },
  {
    id: '7',
    title: 'Pechuga a la Plancha',
    meal_type: 'almuerzo',
    servings: 2,
    ingredients: ['pollo', 'limón', 'ajo', 'sal', 'pimienta', 'arroz'],
    steps: [
      'Sazona la pechuga con sal, pimienta y ajo',
      'Cocina a fuego medio-alto 6 min por lado',
      'Exprime limón antes de servir',
      'Cocina arroz como acompañamiento',
      'Sirve la pechuga sobre el arroz'
    ]
  },
  {
    id: '8',
    title: 'Omelette de Queso',
    meal_type: 'desayuno',
    servings: 1,
    ingredients: ['huevos', 'queso', 'mantequilla', 'sal'],
    steps: [
      'Bate los huevos con sal',
      'Derrite mantequilla en un sartén',
      'Vierte los huevos y cocina a fuego bajo',
      'Añade queso rallado cuando esté casi listo',
      'Dobla el omelette y sirve caliente'
    ]
  },
  {
    id: '9',
    title: 'Arroz con Pollo',
    meal_type: 'almuerzo',
    servings: 2,
    ingredients: ['arroz', 'pollo', 'cebolla', 'ají', 'aceite', 'sal'],
    steps: [
      'Fría el pollo previamente sazonado',
      'Sofríe cebolla y ají picados',
      'Añade el arroz y mezcla bien',
      'Añade agua (doble cantidad del arroz)',
      'Cocina a fuego bajo hasta que el arroz esté listo'
    ]
  },
  {
    id: '10',
    title: 'Papas Fritas',
    meal_type: 'almuerzo',
    servings: 2,
    ingredients: ['papa', 'aceite', 'sal'],
    steps: [
      'Pela y corta las papas en tiras',
      'Lava y seca bien las papas',
      'Calienta aceite a temperatura media-alta',
      'Fríe las papas hasta que estén doradas',
      'Escurre el exceso de aceite y sazona con sal'
    ]
  },
  {
    id: '11',
    title: 'Filete de Pescado',
    meal_type: 'cena',
    servings: 2,
    ingredients: ['pescado', 'limón', 'ajo', 'sal', 'pimienta', 'aceite'],
    steps: [
      'Sazona el pescado con sal, pimienta y ajo',
      'Calienta aceite en un sartén',
      'Cocina el pescado 4 min por lado',
      'Exprime limón fresco antes de servir',
      'Acompaña con ensalada o arroz'
    ]
  },
  {
    id: '12',
    title: 'Pollo al Horno',
    meal_type: 'cena',
    servings: 2,
    ingredients: ['pollo', 'papa', 'cebolla', 'aceite', 'sal', 'romero'],
    steps: [
      'Precalienta el horno a 200°C',
      'Corta las papas y cebolla en trozos',
      'Coloca el pollo y vegetales en una bandeja',
      'Rocía con aceite y sazona con romero',
      'Hornea por 45 minutos hasta dorar'
    ]
  },
  {
    id: '13',
    title: 'Sopa de Verduras',
    meal_type: 'cena',
    servings: 2,
    ingredients: ['zanahoria', 'papa', 'cebolla', 'apio', 'caldo', 'sal'],
    steps: [
      'Pica todas las verduras en trozos pequeños',
      'Sofríe la cebolla hasta que esté transparente',
      'Añade las demás verduras y revolver',
      'Vierte el caldo y cocina 20 min',
      'Sazona con sal y sirvela caliente'
    ]
  },
  {
    id: '14',
    title: 'Carne con Papas',
    meal_type: 'cena',
    servings: 2,
    ingredients: ['carne', 'papa', 'cebolla', 'ajo', 'aceite', 'sal'],
    steps: [
      'Corta la carne en trozos y sazona con sal',
      'Fríe la carne en aceite caliente',
      'Añade cebolla y ajo picados',
      'Agrega las papas en cubos',
      'Cocina hasta que todo esté tierno'
    ]
  },
  {
    id: '15',
    title: 'Ensalada de Frutas',
    meal_type: 'desayuno',
    servings: 1,
    ingredients: ['manzana', 'plátano', 'uva', 'naranja', 'miel'],
    steps: [
      'Lava y corta todas las frutas',
      'Coloca en un bowl grande',
      'Añade miel y mezcla suavemente',
      'Refrigera 15 min antes de servir',
      'Opcional: añade granola crujiente'
    ]
  },
  {
    id: '16',
    title: 'Hot Cakes',
    meal_type: 'desayuno',
    servings: 1,
    ingredients: ['harina', 'huevo', 'leche', 'mantequilla', 'miel'],
    steps: [
      'Mezcla harina, huevo y leche hasta formar batter',
      'Calienta un sartén con mantequilla',
      'Vierte círculos de batter',
      'Cocina hasta que aparezcan burbujas',
      'Voltea y cocina el otro lado, sirve con miel'
    ]
  },
  {
    id: '17',
    title: 'Frijoles con Huevo',
    meal_type: 'desayuno',
    servings: 1,
    ingredients: ['frijoles', 'huevo', 'cebolla', 'chile', 'totopos'],
    steps: [
      'Calienta los frijoles en una olla',
      'Sofríe cebolla y chile picados',
      'Añade los frijoles y cocina junto',
      'Fríe o scalda un huevo y colócalo encima',
      'Sirve con totopos'
    ]
  },
  {
    id: '18',
    title: 'Verduras Salteadas',
    meal_type: 'cena',
    servings: 2,
    ingredients: ['brócoli', 'pimiento', 'zanahoria', 'ajo', 'aceite', 'soya'],
    steps: [
      'Corta todas las verduras en trozos',
      'Calienta aceite en un wok o sartén grande',
      'Saltear verduras a fuego alto por 5 min',
      'Añade ajo picado y salsa de soja',
      'Cocina 2 min más y sirve inmediatamente'
    ]
  },
  {
    id: '19',
    title: 'Pasta con Queso',
    meal_type: 'almuerzo',
    servings: 2,
    ingredients: ['pasta', 'queso', 'mantequilla', 'leche', 'sal'],
    steps: [
      'Cocina la pasta según las instrucciones',
      'En una olla, derrite mantequilla',
      'Añade leche y lleva a ebullición',
      'Agrega queso rallado y mezcla hasta derretir',
      'Mezcla la salsa con la pasta caliente'
    ]
  },
  {
    id: '20',
    title: 'Huevo Frito con Tocino',
    meal_type: 'desayuno',
    servings: 1,
    ingredients: ['huevo', 'tocino', 'mantequilla', 'sal'],
    steps: [
      'Cocina el tocino hasta que esté crujiente',
      'En la misma grasa, añade mantequilla',
      'Fríe el huevo con la yema intacta',
      'Voltea ligeramente si quieres la yema más cocida',
      'Sirve junto con el tocino'
    ]
  }
];