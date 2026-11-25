// SVG Path definitions and center coordinates for all 27 Brazilian states
export interface UFPathData {
  sigla: string;
  nome: string;
  path: string;
  labelX: number;
  labelY: number;
}

export const BRAZIL_UF_PATHS: UFPathData[] = [
  // NORTE
  {
    sigla: 'RR',
    nome: 'Roraima',
    path: 'M 195,30 L 235,35 L 245,65 L 225,100 L 190,95 L 180,60 Z',
    labelX: 210,
    labelY: 65,
  },
  {
    sigla: 'AP',
    nome: 'Amapá',
    path: 'M 345,50 L 375,65 L 360,115 L 330,100 L 335,65 Z',
    labelX: 350,
    labelY: 85,
  },
  {
    sigla: 'AM',
    nome: 'Amazonas',
    path: 'M 70,85 L 175,70 L 210,105 L 240,110 L 245,175 L 190,205 L 135,190 L 70,165 L 50,120 Z',
    labelX: 145,
    labelY: 135,
  },
  {
    sigla: 'PA',
    nome: 'Pará',
    path: 'M 245,95 L 330,95 L 365,115 L 395,145 L 365,225 L 305,245 L 270,225 L 250,175 L 245,120 Z',
    labelX: 305,
    labelY: 165,
  },
  {
    sigla: 'AC',
    nome: 'Acre',
    path: 'M 25,165 L 85,160 L 95,190 L 65,210 L 20,195 Z',
    labelX: 55,
    labelY: 185,
  },
  {
    sigla: 'RO',
    nome: 'Rondônia',
    path: 'M 135,195 L 185,200 L 195,245 L 155,260 L 125,230 Z',
    labelX: 160,
    labelY: 225,
  },
  {
    sigla: 'TO',
    nome: 'Tocantins',
    path: 'M 330,225 L 365,220 L 360,300 L 325,325 L 315,260 Z',
    labelX: 340,
    labelY: 275,
  },

  // NORDESTE
  {
    sigla: 'MA',
    nome: 'Maranhão',
    path: 'M 370,140 L 420,150 L 415,220 L 370,230 L 360,175 Z',
    labelX: 390,
    labelY: 185,
  },
  {
    sigla: 'PI',
    nome: 'Piauí',
    path: 'M 420,160 L 450,170 L 440,245 L 405,250 L 415,210 Z',
    labelX: 425,
    labelY: 215,
  },
  {
    sigla: 'CE',
    nome: 'Ceará',
    path: 'M 450,155 L 495,160 L 485,205 L 450,195 Z',
    labelX: 470,
    labelY: 180,
  },
  {
    sigla: 'RN',
    nome: 'Rio Grande do Norte',
    path: 'M 495,165 L 530,170 L 525,195 L 490,190 Z',
    labelX: 510,
    labelY: 180,
  },
  {
    sigla: 'PB',
    nome: 'Paraíba',
    path: 'M 490,195 L 535,195 L 530,215 L 485,210 Z',
    labelX: 510,
    labelY: 205,
  },
  {
    sigla: 'PE',
    nome: 'Pernambuco',
    path: 'M 445,210 L 535,215 L 520,235 L 440,230 Z',
    labelX: 485,
    labelY: 225,
  },
  {
    sigla: 'AL',
    nome: 'Alagoas',
    path: 'M 505,235 L 535,240 L 520,255 L 495,245 Z',
    labelX: 515,
    labelY: 245,
  },
  {
    sigla: 'SE',
    nome: 'Sergipe',
    path: 'M 490,250 L 515,255 L 505,270 L 480,265 Z',
    labelX: 498,
    labelY: 260,
  },
  {
    sigla: 'BA',
    nome: 'Bahia',
    path: 'M 390,240 L 480,240 L 500,270 L 485,340 L 420,345 L 380,290 Z',
    labelX: 440,
    labelY: 290,
  },

  // CENTRO-OESTE
  {
    sigla: 'MT',
    nome: 'Mato Grosso',
    path: 'M 205,215 L 285,215 L 315,255 L 290,340 L 210,325 L 195,260 Z',
    labelX: 250,
    labelY: 275,
  },
  {
    sigla: 'GO',
    nome: 'Goiás',
    path: 'M 305,305 L 355,305 L 365,370 L 315,380 L 295,345 Z',
    labelX: 335,
    labelY: 345,
  },
  {
    sigla: 'DF',
    nome: 'Distrito Federal',
    path: 'M 345,335 L 360,335 L 360,345 L 345,345 Z',
    labelX: 375,
    labelY: 338,
  },
  {
    sigla: 'MS',
    nome: 'Mato Grosso do Sul',
    path: 'M 230,345 L 290,345 L 295,415 L 245,435 L 220,385 Z',
    labelX: 260,
    labelY: 385,
  },

  // SUDESTE
  {
    sigla: 'MG',
    nome: 'Minas Gerais',
    path: 'M 360,325 L 435,325 L 450,385 L 400,420 L 345,390 L 355,350 Z',
    labelX: 395,
    labelY: 375,
  },
  {
    sigla: 'ES',
    nome: 'Espírito Santo',
    path: 'M 445,370 L 475,375 L 465,410 L 440,400 Z',
    labelX: 458,
    labelY: 390,
  },
  {
    sigla: 'RJ',
    nome: 'Rio de Janeiro',
    path: 'M 410,415 L 455,410 L 440,435 L 395,435 Z',
    labelX: 425,
    labelY: 425,
  },
  {
    sigla: 'SP',
    nome: 'São Paulo',
    path: 'M 295,395 L 375,390 L 395,430 L 340,450 L 285,420 Z',
    labelX: 335,
    labelY: 420,
  },

  // SUL
  {
    sigla: 'PR',
    nome: 'Paraná',
    path: 'M 280,430 L 345,435 L 340,470 L 275,465 Z',
    labelX: 305,
    labelY: 450,
  },
  {
    sigla: 'SC',
    nome: 'Santa Catarina',
    path: 'M 285,470 L 345,470 L 330,500 L 280,490 Z',
    labelX: 310,
    labelY: 485,
  },
  {
    sigla: 'RS',
    nome: 'Rio Grande do Sul',
    path: 'M 265,495 L 330,500 L 315,560 L 255,550 L 245,510 Z',
    labelX: 285,
    labelY: 525,
  },
];
