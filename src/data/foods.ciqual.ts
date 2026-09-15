/**
 * Enlaces de la capa española con la tabla CIQUAL 2020 (ANSES, Licence Ouverte).
 *
 *  - CIQUAL_PRIMARY: el alimento NO existe en USDA → CIQUAL es la fuente de todos los nutrientes.
 *  - IODINE_FROM: USDA no publica yodo → se toma de un equivalente CIQUAL.
 *
 * Formato: código o [códigoCrudo, códigoCocinado]. Si falta el código cocinado, el valor
 * cocinado se estima a partir del crudo dividiendo por el rendimiento (pérdida de agua).
 */
export type CiqRef = number | [number, number]

export const CIQUAL_PRIMARY: Record<string, CiqRef> = {
  merluza: [26044, 26120],
  dorada: [26088, 27031],
  'jamon-serrano': 28845,
  kefir: 19865,
  'bebida-avena': 18905,
}

export const IODINE_FROM: Record<string, CiqRef> = {
  // carne
  'pechuga-pollo': 36003, 'muslo-pollo': [36024, 36004], 'alitas-pollo': 36033, 'pollo-asado': 36005, 'pollo-picado': 36003,
  'pechuga-pavo': [36304, 36306], 'pavo-picado': 36301, 'ternera-filete': 6102, 'solomillo-ternera': 6116, entrecot: 6111,
  'ternera-picada-magra': [6252, 6253], 'ternera-picada': [6256, 6257], 'falda-ternera': 6212, 'ternera-guiso': 6271,
  'lomo-cerdo': [28100, 28101], 'solomillo-cerdo': 28201, 'costillas-cerdo': 28100, 'pierna-cordero': [21502, 21503],
  'ternera-blanca': [6521, 6520], bacon: 28727, 'jamon-cocido': 28900, 'jamon-serrano': 28802, 'pavo-fiambre': 36900,
  chorizo: 30316, salchichon: 30351, salchichas: 30134, 'salchicha-fresca': [30110, 30011], mortadela: 30789,
  // pescado y marisco
  bacalao: [26043, 26025], salmon: [26036, 26229], 'atun-fresco': 26064, 'atun-lata-aceite': 26180, 'atun-lata-natural': 26181,
  'bonito-lata': 26179, 'sardinas-lata': 26034, anchoas: 26000, caballa: 26051, lubina: [26072, 27030], trucha: [27009, 27015],
  'pez-espada': 26082, lenguado: [26058, 26060], 'tilapia-panga': 27019, rape: [26018, 26081], abadejo: [26134, 26192],
  calamar: 10001, sepia: 10016, gambas: [10021, 10006], mejillones: [10014, 10013], almejas: [10017, 10027], pulpo: [10018, 10079],
  'salmon-ahumado': 26037, cangrejo: 10025,
  // huevos
  huevo: 22000, 'huevo-cocido': 22010, 'huevo-frito': 22505, 'huevos-revueltos': 22502, 'tortilla-francesa': 22509,
  'clara-huevo': 22001, 'yema-huevo': 22002, 'huevo-escalfado': 22011,
  // lácteos
  'leche-entera': 19024, 'leche-semi': 19042, 'leche-desnatada': 19051, 'yogur-natural': 19600, 'yogur-desnatado': 19544,
  'yogur-griego': 19860, 'yogur-griego-0': 19860, 'queso-fresco-batido': 19501, 'queso-fresco': 19641, mozzarella: 19590,
  parmesano: 12120, feta: 12066, 'queso-cabra': 12814, 'queso-curado': 12726, 'queso-semicurado': 12736, 'queso-lonchas': 12729,
  'queso-crema': 19646, mantequilla: 16403, nata: 19402, 'bebida-almendra': 18107, 'bebida-soja': 18901, 'helado-vainilla': 39500,
  'cafe-con-leche': 19042,
  // cereales, pan, patata
  'arroz-blanco': [9100, 9104], 'arroz-redondo': [9100, 9104], 'arroz-integral': [9102, 9103], pasta: [9810, 9811],
  'pasta-integral': [9870, 9871], 'pasta-sin-gluten': 9874, 'fideos-arroz': [9900, 9901], 'pasta-fresca': 9815,
  'pan-blanco': 7001, 'pan-molde': 7000, 'pan-integral': 7110, 'pan-multicereal': 7115, 'pan-centeno': 7125, 'pan-pita': 7180,
  'tortilla-trigo': 7815, 'pan-hamburguesa': 7259, 'pan-rallado': 7500, avena: 9311, quinoa: 9340, cuscus: [9681, 9683],
  bulgur: [9690, 9691], 'harina-trigo': 9436, 'corn-flakes': 32014, granola: 32004, 'tortitas-arroz': 7352,
  patata: [4008, 4003], 'patata-asada': 4026, 'patatas-fritas': 4032, 'pure-patata': 4047, boniato: [4101, 4102], 'maiz-dulce': 20066,
  palomitas: 9231, 'galletas-maria': 24001, 'galletas-chocolate': 24000, croissant: 7602, magdalena: 24630, bizcocho: 23594, tortitas: 23800,
  // legumbres
  lentejas: [20504, 20505], 'lentejas-rojas': [20535, 20589], garbanzos: [20516, 20507], 'alubias-blancas': [20501, 20502],
  'alubias-rojas': [20525, 20503], 'alubias-negras': [20525, 20503], habas: [20517, 20500], guisantes: 20037, edamame: 20901,
  tofu: 20904, hummus: 25621, cacahuetes: 15001, 'crema-cacahuete': 15202,
  // verduras
  brocoli: [20057, 20006], espinacas: [20059, 20027], tomate: 20047, 'tomate-triturado': 20169, 'tomate-frito': 11107,
  lechuga: 20031, mezclum: 20272, rucula: 20272, cebolla: [20034, 20035], cebolleta: 11003, ajo: 11000, zanahoria: [20009, 20008],
  'pimiento-rojo': 20087, 'pimiento-verde': 20085, 'pimiento-amarillo': 20168, calabacin: [20020, 20021], berenjena: [20053, 20002],
  pepino: 20019, champinones: [20056, 20102], coliflor: [20016, 20017], col: [20069, 20015], esparragos: 20279, puerro: [20039, 20040],
  aguacate: 13004, calabaza: [20138, 20141], remolacha: 20003, alcachofa: [20052, 20000], kale: [20218, 20219], apio: 20023,
  acelgas: [20004, 20005], aceitunas: 13147, rabanos: 20045, 'coles-bruselas': [20058, 20013], 'judias-verdes': [20061, 20030],
  jengibre: 11074, perejil: 11014, albahaca: 11033, guindilla: 20151, nabo: [20064, 20033],
  // frutas
  platano: 13005, manzana: 13039, naranja: 13034, mandarina: 13024, fresas: 13014, uvas: 13112, pera: 13037, melocoton: 13043,
  nectarina: 13030, sandia: 13036, melon: 13026, kiwi: 13021, pina: 13002, mango: 13025, arandanos: 13028, frambuesas: 13015,
  cerezas: 13008, limon: 13009, ciruela: 13100, higo: 13012, granada: 13018, pasas: 13046, datiles: 13011, albaricoque: 13000,
  papaya: 13035, coco: 15006, 'zumo-naranja': 2070, 'zumo-manzana': 2074,
  // frutos secos y semillas
  nueces: 15005, almendras: 15000, avellanas: 15004, anacardos: 15054, pistachos: 15044, 'pipas-girasol': 15011, chia: 15047,
  lino: 15034, sesamo: 15010, pinones: 15025, 'nueces-brasil': 15008, castanas: 15020, 'crema-almendra': 15000,
  // grasas, salsas, bebidas, dulces
  'aceite-oliva': 17270, 'aceite-girasol': 17440, 'aceite-coco': 16040, mayonesa: 11054, 'mayonesa-light': 11079,
  agua: 18008, cafe: 18004, te: 18154, 'te-verde': 18155, cerveza: 5001, 'vino-tinto': 5214, 'refresco-cola': 18018,
  miel: 31008, azucar: 31016, mermelada: 31006, 'chocolate-negro': 31005, 'chocolate-leche': 31004, 'cacao-puro': 18100,
  ketchup: 11008, mostaza: 11013, 'salsa-soja': 11104, vinagre: 11220, sal: 11017, pimenton: 11049, pimienta: 11015,
  oregano: 11035, canela: 11025, 'leche-coco': 18041, pizza: 25404, 'patatas-chips': 4004, 'hamburguesa-fast': 25413,
  // añadidos
  conejo: 34000, 'chuletas-cordero': [21502, 21503], 'pavo-asado': 36900, 'higado-pollo': [40111, 40116], 'barrita-cereales': 31113,
  chirimoya: 13056, caqui: 13066, pomelo: 13040, lima: 13067, membrillo: 13010, 'melon-piel-sapo': 13742, 'esparragos-blancos': 20076,
  endibia: 20090, yuca: 54031, 'vino-blanco': 5215, shiitake: 20212, 'bebida-isotonica': 18352, 'agua-coco': 18011,
  'pimientos-piquillo': 20087, ricotta: 19585, 'almendras-tostadas': 15042, 'alga-nori': 20987, 'leche-cacao': 18104,
}
