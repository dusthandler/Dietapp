export const baseRecipes = [
    {
        name: "Tortilla de Avena",
        emoji: "🥞",
        desc: "Mezcla avena, claras y canela. Cocina en sartén antiadherente.",
        ingredients: [
            { food: "Claras", qty: 150 },
            { food: "Copos de avena", qty: 40 },
            { food: "Canela", qty: 2 }
        ]
    },

    {
        name: "Tallarines a la carbonada",
        emoji: "🍝",
        desc: `1. Corta el guanciale o panceta en tiras o cubitos y fríelo a fuego medio hasta que quede dorado y crujiente. No tires la grasa que suelte, la vas a usar después.

        2. Pon a hervir 100 g de tallarines en abundante agua con sal. Guarda al menos 1/4 de taza del agua de cocción antes de escurrirlos.

        3. Mientras se cuece la pasta, mezcla en un bol:
   - 2 yemas de huevo
   - 25 g de queso rallado
   - 1/4 cucharadita de pimienta negra molida
   - 1 cucharada de la grasa caliente del guanciale
   Mezcla todo hasta que quede una crema espesa.

   4. Cuando la pasta esté cocida y escurrida, viértela en la sartén aún caliente donde freíste el guanciale (ya sin fuego).

   5. Añade la mezcla de yema y queso sobre la pasta y mezcla rápido.

   6. Agrega poco a poco agua de cocción caliente (unas 2 o 3 cucharadas, o lo que haga falta) hasta que la salsa quede cremosa.`,
        ingredients: [
            { food: "Tallarines", qty: 100 },
            { food: "Panceta", qty: 40 },
            { food: "Yema de huevo", qty: 2 },
            { food: "Queso parmesano", qty: 25 },
            { food: "Pimienta negra", qty: 1 }
        ]
    },

    {
    name: "Ensalada de quinoa y salmón",
    emoji: "🥗",
    desc: "Cocina la quinoa según las instrucciones. Mezcla con salmón a la plancha, pepino, tomate y aliña con limón y aceite de oliva.",
    ingredients: [
        { food: "Quinoa", qty: 60 },
        { food: "Salmón fresco", qty: 150 },
        { food: "Pepino", qty: 100 },
        { food: "Tomate", qty: 100 },
        { food: "Limón", qty: 1 },
        { food: "Aceite de oliva", qty: 10 },
        { food: "Sal", qty: 1 }
    ]
},

{
    name: "Pollo al curry con arroz basmati",
    emoji: "🍛",
    desc: `1. Dorar el pollo en aceite. Añadir cebolla y ajo picados.
    2. Agregar curry en polvo y mezclar. Incorporar yogur griego y cocinar a fuego lento.
    3. Servir con arroz basmati cocido.`,
    ingredients: [
        { food: "Pechuga de pollo", qty: 200 },
        { food: "Arroz basmati", qty: 80 },
        { food: "Yogur griego 0%", qty: 100 },
        { food: "Cebolla", qty: 50 },
        { food: "Ajo", qty: 5 },
        { food: "Curry en polvo", qty: 5 },
        { food: "Aceite de oliva", qty: 10 }
    ]
},

{
    name: "Tofu salteado con verduras",
    emoji: "🧈",
    desc: "Saltear tofu en aceite hasta dorar. Añadir calabacín, pimiento y cebolla. Condimentar con comino y ajo.",
    ingredients: [
        { food: "Tofu", qty: 150 },
        { food: "Calabacín", qty: 100 },
        { food: "Pimiento verde", qty: 100 },
        { food: "Cebolla", qty: 50 },
        { food: "Ajo", qty: 5 },
        { food: "Comino molido", qty: 2 },
        { food: "Aceite de oliva", qty: 10 }
    ]
},

{
    name: "Lentejas estofadas",
    emoji: "🍲",
    desc: `1. Sofreír cebolla, ajo y zanahoria. Añadir lentejas y agua.
    2. Cocinar a fuego lento con pimentón y laurel hasta que las lentejas estén tiernas.`,
    ingredients: [
        { food: "Lentejas", qty: 100 },
        { food: "Cebolla", qty: 50 },
        { food: "Ajo", qty: 5 },
        { food: "Zanahoria", qty: 50 },
        { food: "Pimentón dulce", qty: 2 },
        { food: "Aceite de oliva", qty: 10 }
    ]
},

{
    name: "Merluza al horno con patatas",
    emoji: "🐟",
    desc: "Colocar merluza y patatas en bandeja. Aliñar con ajo, limón y aceite. Hornear a 180°C hasta cocido.",
    ingredients: [
        { food: "Merluza", qty: 200 },
        { food: "Patata", qty: 150 },
        { food: "Limón", qty: 0.5 },
        { food: "Ajo", qty: 5 },
        { food: "Aceite de oliva", qty: 10 }
    ]
},

{
    name: "Seitán con espinacas y nata",
    emoji: "🌱",
    desc: `1. Saltear seitán con ajo y cebolla.
    2. Añadir espinacas y cocinar hasta marchitar.
    3. Incorporar nata y reducir la salsa.`,
    ingredients: [
        { food: "Seitán", qty: 150 },
        { food: "Espinacas crudas", qty: 100 },
        { food: "Cebolla", qty: 50 },
        { food: "Ajo", qty: 5 },
        { food: "Nata para cocinar", qty: 50 },
        { food: "Aceite de oliva", qty: 10 }
    ]
},

{
    name: "Lasagna de carne light",
    emoji: "🍽️",
    desc: `1. Precalienta el horno a 180°C.
    2. Saltea carne picada con cebolla y ajo. Añade tomate triturado.
    3. Alterna capas de láminas de pasta, carne y bechamel light (hecha con leche semidesnatada).
    4. Cubre con queso rallado y hornea 25-30 min hasta gratinar.`,
    ingredients: [
        { food: "Carne picada de vacuno", qty: 200 },
        { food: "Tallarines", qty: 100 },
        { food: "Tomate", qty: 150 },
        { food: "Leche semidesnatada", qty: 200 },
        { food: "Queso parmesano", qty: 50 },
        { food: "Cebolla", qty: 50 },
        { food: "Ajo", qty: 5 }
    ]
},

{
    name: "Pimientos rellenos de atún",
    emoji: "🌶️",
    desc: `1. Precalienta horno a 190°C.
    2. Mezcla atún escurrido con quinoa cocida, tomate picado y cebolla.
    3. Rellena pimientos y hornea 20-25 min hasta tiernos.`,
    ingredients: [
        { food: "Atún en lata (agua)", qty: 120 },
        { food: "Quinoa", qty: 60 },
        { food: "Pimiento rojo", qty: 200 }, // 2 pimientos medianos
        { food: "Tomate", qty: 50 },
        { food: "Cebolla", qty: 30 }
    ]
},

{
    name: "Muslos de pollo al horno con patatas",
    emoji: "🍗",
    desc: `1. Precalienta horno a 200°C.
    2. Mezcla muslos de pollo con patatas en rodajas, romero y ajo.
    3. Hornea 40-45 min, volteando a mitad de cocción.`,
    ingredients: [
        { food: "Pollo (muslo)", qty: 300 }, // 2 muslos grandes
        { food: "Patata", qty: 200 },
        { food: "Ajo", qty: 10 },
        { food: "Aceite de oliva", qty: 15 }
    ]
},

{
    name: "Berenjena rellena de tofu",
    emoji: "🍆",
    desc: `1. Precalienta horno a 180°C.
    2. Hornea berenjenas partidas 15 min.
    3. Rellena con mezcla de tofu desmenuzado, tomate y cúrcuma.
    4. Hornea otros 15 min.`,
    ingredients: [
        { food: "Berenjena", qty: 300 }, // 2 medianas
        { food: "Tofu", qty: 150 },
        { food: "Tomate", qty: 100 },
        { food: "Cúrcuma molida", qty: 3 }
    ]
},

{
    name: "Salmón al horno con espárragos",
    emoji: "🐟",
    desc: `1. Precalienta horno a 200°C.
    2. Coloca salmón y espárragos en bandeja.
    3. Aliña con limón y eneldo. Hornea 15-20 min.`,
    ingredients: [
        { food: "Salmón fresco", qty: 250 },
        { food: "Espárragos verdes", qty: 150 },
        { food: "Limón", qty: 0.5 },
        { food: "Aceite de oliva", qty: 10 }
    ]
},

{
    name: "Tarta de requesón sin azúcar",
    emoji: "🍰",
    desc: `1. Precalienta horno a 170°C.
    2. Mezcla requesón, huevos, edulcorante y esencia de vainilla.
    3. Vierte en molde y hornea 35-40 min hasta cuajar.`,
    ingredients: [
        { food: "Requesón", qty: 400 },
        { food: "Huevo", qty: 3 },
        { food: "Edulcorante de fruta del monje", qty: 5 },
        { food: "Esencia de vainilla", qty: 5 }
    ]
},

{
    name: "Tostada de aguacate y huevo",
    emoji: "🥑🍳",
    desc: "1. Tuesta las tortitas de maíz\n2. Unta aguacate machacado\n3. Corona con huevo pochado y semillas de sésamo",
    ingredients: [
        { food: "Tortitas de maíz", qty: 40 },
        { food: "Aguacate", qty: 100 },
        { food: "Huevo", qty: 1 },
        { food: "Semillas de calabaza", qty: 10 }
    ]
},

{
    name: "Bowl poke de salmón",
    emoji: "🍣🥗",
    desc: "1. Marína cubos de salmón en salsa de soja\n2. Monta con quinoa, edamame y aguacate\n3. Decora con semillas de sésamo",
    ingredients: [
        { food: "Salmón fresco", qty: 150 },
        { food: "Quinoa", qty: 80 },
        { food: "Edamame", qty: 50 },
        { food: "Aguacate", qty: 50 }
    ]
},

{
    name: "Hamburguesa de garbanzos",
    emoji: "🍔🌱",
    desc: `1. Mezcla garbanzos triturados con avena y especias
    2. Forma hamburguesas y cocina en sartén 4-5 min por lado
    3. Sirve en tortitas de maíz con yogur griego`,
    ingredients: [
        { food: "Garbanzos cocidos", qty: 200 },
        { food: "Copos de avena", qty: 30 },
        { food: "Comino molido", qty: 2 },
        { food: "Yogur griego 0%", qty: 50 }
    ]
},

{
    name: "Huevos al horno con espinacas",
    emoji: "🥘🥚",
    desc: `1. Precalienta horno a 190°C
    2. Saltea espinacas con ajo en cazuela de barro
    3. Casca huevos encima y hornea 12-15 min`,
    ingredients: [
        { food: "Huevo", qty: 3 },
        { food: "Espinacas crudas", qty: 100 },
        { food: "Queso feta", qty: 30 },
        { food: "Ajo", qty: 5 }
    ]
},

{
    name: "Caballa al horno con verduras",
    emoji: "🐟🥕",
    desc: `1. Precalienta horno a 200°C
    2. Coloca caballa y bastones de zanahoria/patata
    3. Rocía con limón y hornea 25-30 min`,
    ingredients: [
        { food: "Caballa", qty: 250 },
        { food: "Patata", qty: 150 },
        { food: "Zanahoria", qty: 100 },
        { food: "Limón", qty: 0.5 }
    ]
},

{
    name: "Tortitas proteicas",
    emoji: "🥞💪",
    desc: "1. Mezcla claras, avena y plátano maduro\n2. Cocina en sartén antiadherente\n3. Acompaña con fresas",
    ingredients: [
        { food: "Claras", qty: 120 },
        { food: "Copos de avena", qty: 40 },
        { food: "Plátano", qty: 100 },
        { food: "Fresas", qty: 50 }
    ]
},

{
    name: "Bolitas energéticas sin horno",
    emoji: "🍫⚡",
    desc: "1. Mezcla dátiles, almendra molida y cacao\n2. Forma bolitas y refrigera 1 hora\n3. Espolvorea con coco rallado",
    ingredients: [
        { food: "Semillas de chía", qty: 30 },
        { food: "Crema de almendras", qty: 50 },
        { food: "Copos de avena", qty: 50 },
        { food: "Miel", qty: 20 }
    ]
},

{
    name: "Revuelto de jamón y espárragos",
    emoji: "🥓🍳",
    desc: "1. Saltea espárragos en rodajas\n2. Añade jamón serrano y huevos batidos\n3. Cocina a fuego medio removiendo constantemente",
    ingredients: [
        { food: "Huevo", qty: 3 },
        { food: "Jamón serrano", qty: 50 },
        { food: "Espárragos verdes", qty: 80 },
        { food: "Aceite de oliva", qty: 5 }
    ]
},

{
    name: "Curry de garbanzos y calabaza",
    emoji: "🎃🥘",
    desc: `1. Sofríe cebolla, ajo y jengibre
    2. Añade calabaza en cubos y garbanzos
    3. Cocina con leche de coco y curry 20 min`,
    ingredients: [
        { food: "Garbanzos cocidos", qty: 150 },
        { food: "Calabaza", qty: 200 },
        { food: "Leche de coco", qty: 100 },
        { food: "Curry en polvo", qty: 5 }
    ]
},
{
    name: "Poke bowl de atún y mango",
    emoji: "🐟🥭",
    desc: "1. Marina cubos de atún en salsa de soja\n2. Monta bowl con arroz, mango y aguacate\n3. Decora con semillas de sésamo",
    ingredients: [
        { food: "Atún en lata (agua)", qty: 120 },
        { food: "Arroz basmati", qty: 80 },
        { food: "Mango", qty: 100 },
        { food: "Aguacate", qty: 50 }
    ]
},

{
    name: "Ternera estofada con puré",
    emoji: "🥩🥔",
    desc: `1. Dora la ternera en olla
    2. Añade vino tinto y cocina 2h a fuego lento
    3. Sirve con puré de patata y zanahoria`,
    ingredients: [
        { food: "Filete de ternera", qty: 250 },
        { food: "Patata", qty: 200 },
        { food: "Zanahoria", qty: 100 },
        { food: "Vino tinto", qty: 100 }
    ]
},

{
    name: "Pizza de coliflor",
    emoji: "🍕🥦",
    desc: `1. Precalienta horno a 200°C
    2. Mezcla coliflor rallada con huevo y queso
    3. Hornea base 15 min y añade toppings
    4. Gratina 5 min más`,
    ingredients: [
        { food: "Coliflor", qty: 300 },
        { food: "Huevo", qty: 1 },
        { food: "Queso mozzarella", qty: 80 },
        { food: "Tomate", qty: 100 }
    ]
},

{
    name: "Ensalada césar light",
    emoji: "🥗🍗",
    desc: "1. Mezcla lechuga, pollo a la plancha y croutons\n2. Aliña con yogur griego, anchoas y limón\n3. Espolvorea parmesano rallado",
    ingredients: [
        { food: "Pechuga de pollo", qty: 150 },
        { food: "Lechuga iceberg", qty: 100 },
        { food: "Yogur griego 0%", qty: 50 },
        { food: "Queso parmesano", qty: 20 }
    ]
},

{
    name: "Smoothie bowl antioxidante",
    emoji: "🥣🍓",
    desc: `1. Tritura frutos rojos con plátano y leche de almendras
    2. Vierte en bowl y decora con granola y coco rallado
    3. Sirve inmediatamente`,
    ingredients: [
        { food: "Fresas", qty: 100 },
        { food: "Plátano", qty: 80 },
        { food: "Leche de almendras", qty: 100 },
        { food: "Granola sin azúcar", qty: 30 }
    ]
},

{
    name: "Pollo relleno de espinacas y queso de cabra",
    emoji: "🐔🧀",
    desc: `1. Precalienta horno a 180°C
    2. Abre bolsillo en pechugas y rellena con espinacas salteadas y queso
    3. Hornea 25-30 min hasta dorar`,
    ingredients: [
        { food: "Pechuga de pollo", qty: 200 },
        { food: "Espinacas crudas", qty: 50 },
        { food: "Queso feta", qty: 40 },
        { food: "Ajo granulado", qty: 2 }
    ]
},
{
    name: "Bowl de boniato y lentejas",
    emoji: "🍠🥣",
    desc: `1. Asar boniato en horno a 200°C por 35 min
    2. Mezclar con lentejas cocidas y yogur de soja
    3. Espolvorear con semillas de calabaza`,
    ingredients: [
        { food: "Boniato", qty: 150 },
        { food: "Lentejas", qty: 80 },
        { food: "Yogur de soja", qty: 50 },
        { food: "Semillas de calabaza", qty: 15 }
    ]
},
{
    name: "Tartar de salmón con aguacate",
    emoji: "🐟🥑",
    desc: "1. Picar salmón y mezclar con aguacate\n2. Aliñar con salsa de soja y sésamo\n3. Servir sobre base de pepino",
    ingredients: [
        { food: "Salmón ahumado", qty: 120 },
        { food: "Aguacate", qty: 80 },
        { food: "Pepino", qty: 50 },
        { food: "Semillas de sésamo", qty: 5 }
    ]
},
{
    name: "Tofu al wok con verduras",
    emoji: "🥡🌶️",
    desc: `1. Saltear tofu en aceite de coco
    2. Añadir pimiento, brócoli y zanahoria juliana
    3. Condimentar con jengibre y salsa de soja`,
    ingredients: [
        { food: "Tofu", qty: 150 },
        { food: "Brócoli", qty: 100 },
        { food: "Pimiento rojo", qty: 80 },
        { food: "Jengibre fresco", qty: 10 }
    ]
},
{
    name: "Porridge de avena proteico",
    emoji: "🥣💪",
    desc: `1. Cocinar avena con leche de almendras
    2. Mezclar con proteína de suelo y plátano
    3. Topear con nueces y canela`,
    ingredients: [
        { food: "Copos de avena", qty: 50 },
        { food: "Leche de almendras", qty: 200 },
        { food: "Proteína de suero", qty: 30 },
        { food: "Nueces", qty: 20 }
    ]
},
{
    name: "Huevos revueltos con champiñones",
    emoji: "🍳🍄",
    desc: "1. Saltear champiñones con ajo\n2. Batir huevos con queso rallado\n3. Cocinar mezclando hasta cremosos",
    ingredients: [
        { food: "Huevo", qty: 3 },
        { food: "Champiñones", qty: 100 },
        { food: "Queso emmental", qty: 30 },
        { food: "Perejil fresco", qty: 5 }
    ]
},
{
    name: "Energía balls de café",
    emoji: "☕🍫",
    desc: `1. Mezclar dátiles, café instantáneo y almendra molida
    2. Formar bolitas y rodar en coco rallado
    3. Refrigerar 2 horas antes de servir`,
    ingredients: [
        { food: "Dátiles", qty: 80 },
        { food: "Crema de almendras", qty: 50 },
        { food: "Café instantáneo", qty: 5 },
        { food: "Coco rallado", qty: 20 }
    ]
},

{
    name: "Tostada de aguacate y huevo",
    emoji: "🥑🍳",
    desc: "1. Tostar tortitas de maíz\n2. Untar aguacate machacado\n3. Añadir huevo pochado y semillas",
    ingredients: [
        { food: "Tortitas de maíz", qty: 40 },
        { food: "Aguacate", qty: 80 },
        { food: "Huevo", qty: 1 },
        { food: "Semillas de sésamo", qty: 5 }
    ]
},
{
    name: "Tallarines de calabacín con pesto",
    emoji: "🥒🍝",
    desc: "1. Cortar calabacín en tiras\n2. Mezclar con pesto rojo\n3. Añadir almendras fileteadas",
    ingredients: [
        { food: "Calabacín", qty: 200 },
        { food: "Pesto de tomate seco", qty: 30 },
        { food: "Almendras tostadas", qty: 20 }
    ]
},
{
    name: "Aguacate relleno de salmón",
    emoji: "🥑🐟",
    desc: "1. Vaciar aguacate\n2. Mezclar pulpa con salmón ahumado\n3. Rellenar y decorar con limón",
    ingredients: [
        { food: "Aguacate", qty: 150 },
        { food: "Salmón ahumado", qty: 80 },
        { food: "Limón", qty: 0.5 }
    ]
},

{
    name: "Carpaccio de salmón con olivada",
    emoji: "🐟🫒",
    desc: "1. Cortar salmón en láminas finas\n2. Preparar tapenade de aceitunas\n3. Decorar con albahaca",
    ingredients: [
        { food: "Salmón fresco", qty: 120 },
        { food: "Aceitunas negras", qty: 50 },
        { food: "Albahaca fresca", qty: 10 }
    ]
},
{
    name: "Merluza al horno con verduras",
    emoji: "🐟🥕",
    desc: `1. Precalentar horno a 200°C
2. Colocar merluza y verduras en papillote
3. Hornear 15-20 min`,
    ingredients: [
        { food: "Merluza", qty: 250 },
        { food: "Calabacín", qty: 100 },
        { food: "Zanahoria", qty: 80 },
        { food: "Limón", qty: 0.5 }
    ]
},
{
    name: "Mousse de chocolate amargo",
    emoji: "🍫🥄",
    desc: `1. Derretir chocolate 85%
2. Mezclar con yogur griego
3. Refrigerar 2 horas`,
    ingredients: [
        { food: "Chocolate 85%", qty: 60 },
        { food: "Yogur griego 0%", qty: 150 },
        { food: "Claras", qty: 2 }
    ]
},
{
    name: "Pavo asado con puré de manzana",
    emoji: "🦃🍎",
    desc: `1. Marinar pavo con romero
2. Asar 25 min a 180°C
3. Hacer puré de manzana al horno`,
    ingredients: [
        { food: "Pechuga de pavo", qty: 200 },
        { food: "Manzana", qty: 150 },
        { food: "Romero fresco", qty: 5 }
    ]
}

];