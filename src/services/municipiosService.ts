/**
 * Serviço de consulta dinâmica de Municípios Brasileiros por UF
 * Utiliza a API pública e oficial do IBGE Localidades (sem custo / sem chave)
 * com cache em memória e base local de contingência caso offline.
 */

export const CAPITAIS_POR_UF: Record<string, string> = {
  AC: 'Rio Branco',
  AL: 'Maceió',
  AP: 'Macapá',
  AM: 'Manaus',
  BA: 'Salvador',
  CE: 'Fortaleza',
  DF: 'Brasília',
  ES: 'Vitória',
  GO: 'Goiânia',
  MA: 'São Luís',
  MT: 'Cuiabá',
  MS: 'Campo Grande',
  MG: 'Belo Horizonte',
  PA: 'Belém',
  PB: 'João Pessoa',
  PR: 'Curitiba',
  PE: 'Recife',
  PI: 'Teresina',
  RJ: 'Rio de Janeiro',
  RN: 'Natal',
  RS: 'Porto Alegre',
  RO: 'Porto Velho',
  RR: 'Boa Vista',
  SC: 'Florianópolis',
  SP: 'São Paulo',
  SE: 'Aracaju',
  TO: 'Palmas',
};

const MUNICIPIOS_FALLBACK_POR_UF: Record<string, string[]> = {
  AC: ['Brasiléia', 'Cruzeiro do Sul', 'Epitaciolândia', 'Rio Branco', 'Sena Madureira', 'Tarauacá'],
  AL: ['Arapiraca', 'Delmiro Gouveia', 'Maceió', 'Marechal Deodoro', 'Palmeira dos Índios', 'Penedo', 'Rio Largo'],
  AP: ['Laranjal do Jari', 'Macapá', 'Mazagão', 'Oiapoque', 'Porto Grande', 'Santana'],
  AM: ['Coari', 'Itacoatiara', 'Manacapuru', 'Manaus', 'Parintins', 'Tabatinga', 'Tefé'],
  BA: [
    'Alagoinhas', 'Barreiras', 'Camaçari', 'Eunápolis', 'Feira de Santana', 'Ilhéus', 'Itabuna',
    'Jequié', 'Juazeiro', 'Lauro de Freitas', 'Luís Eduardo Magalhães', 'Paulo Afonso',
    'Porto Seguro', 'Salvador', 'Simões Filho', 'Teixeira de Freitas', 'Vitória da Conquista',
  ],
  CE: [
    'Aquiraz', 'Caucaia', 'Crato', 'Eusébio', 'Fortaleza', 'Iguatu', 'Itapipoca',
    'Juazeiro do Norte', 'Maracanaú', 'Maranguape', 'Quixadá', 'Sobral',
  ],
  DF: ['Brasília'],
  ES: [
    'Aracruz', 'Cachoeiro de Itapemirim', 'Cariacica', 'Colatina', 'Guarapari',
    'Linhares', 'São Mateus', 'Serra', 'Viana', 'Vila Velha', 'Vitória',
  ],
  GO: [
    'Águas Lindas de Goiás', 'Anápolis', 'Aparecida de Goiânia', 'Catalão', 'Formosa',
    'Goiânia', 'Itumbiara', 'Jataí', 'Luziânia', 'Rio Verde', 'Senador Canedo', 'Trindade',
  ],
  MA: ['Açailândia', 'Bacabal', 'Balsas', 'Caxias', 'Codó', 'Imperatriz', 'Paço do Lumiar', 'São José de Ribamar', 'São Luís', 'Timon'],
  MT: ['Barra do Garças', 'Cáceres', 'Cuiabá', 'Lucas do Rio Verde', 'Nova Mutum', 'Primavera do Leste', 'Rondonópolis', 'Sinop', 'Sorriso', 'Tangará da Serra', 'Várzea Grande'],
  MS: ['Campo Grande', 'Corumbá', 'Dourados', 'Naviraí', 'Nova Andradina', 'Ponta Porã', 'Três Lagoas'],
  MG: [
    'Araguari', 'Barbacena', 'Belo Horizonte', 'Betim', 'Contagem', 'Divinópolis',
    'Extrema', 'Governador Valadares', 'Ibirité', 'Ipatinga', 'Itabira', 'Itajubá',
    'Juiz de Fora', 'Montes Claros', 'Muriaé', 'Nova Lima', 'Ouro Preto', 'Passos',
    'Patos de Minas', 'Poços de Caldas', 'Pouso Alegre', 'Ribeirão das Neves',
    'Santa Luzia', 'Sete Lagoas', 'Teófilo Otoni', 'Uberaba', 'Uberlândia', 'Varginha',
  ],
  PA: ['Abaetetuba', 'Altamira', 'Ananindeua', 'Barcarena', 'Belém', 'Castanhal', 'Itaituba', 'Marabá', 'Marituba', 'Paragominas', 'Parauapebas', 'Redenção', 'Santarém'],
  PB: ['Bayeux', 'Cabedelo', 'Cajazeiras', 'Campina Grande', 'Guarabira', 'João Pessoa', 'Patos', 'Santa Rita', 'Sousa'],
  PR: [
    'Almirante Tamandaré', 'Apucarana', 'Arapongas', 'Araucária', 'Cambé', 'Campo Largo',
    'Cascavel', 'Colombo', 'Curitiba', 'Fazenda Rio Grande', 'Foz do Iguaçu', 'Francisco Beltrão',
    'Guarapuava', 'Londrina', 'Maringá', 'Paranaguá', 'Pato Branco', 'Pinhais',
    'Ponta Grossa', 'São José dos Pinhais', 'Sarandi', 'Toledo', 'Umuarama',
  ],
  PE: [
    'Abreu e Lima', 'Araripina', 'Cabo de Santo Agostinho', 'Camaragibe', 'Caruaru',
    'Garanhuns', 'Goiana', 'Igarassu', 'Ipojuca', 'Jaboatão dos Guararapes', 'Olinda',
    'Paulista', 'Petrolina', 'Recife', 'Santa Cruz do Capibaribe', 'Serra Talhada', 'Vitória de Santo Antão',
  ],
  PI: ['Campo Maior', 'Floriano', 'Parnaíba', 'Picos', 'Piripiri', 'Teresina'],
  RJ: [
    'Angra dos Reis', 'Araruama', 'Barra Mansa', 'Belford Roxo', 'Cabo Frio',
    'Campos dos Goytacazes', 'Duque de Caxias', 'Itaboraí', 'Itaguaí', 'Macaé',
    'Magé', 'Maricá', 'Mesquita', 'Nilópolis', 'Niterói', 'Nova Friburgo',
    'Nova Iguaçu', 'Petrópolis', 'Queimados', 'Resende', 'Rio das Ostras',
    'Rio de Janeiro', 'São Gonçalo', 'São João de Meriti', 'Teresópolis', 'Volta Redonda',
  ],
  RN: ['Assú', 'Caicó', 'Ceará-Mirim', 'Macaíba', 'Mossoró', 'Natal', 'Parnamirim', 'São Gonçalo do Amarante'],
  RS: [
    'Alvorada', 'Bagé', 'Bento Gonçalves', 'Cachoeirinha', 'Canoas', 'Caxias do Sul',
    'Erechim', 'Esteio', 'Farroupilha', 'Gravataí', 'Guaíba', 'Ijuí', 'Lajeado',
    'Novo Hamburgo', 'Passo Fundo', 'Pelotas', 'Porto Alegre', 'Rio Grande',
    'Santa Cruz do Sul', 'Santa Maria', 'São Leopoldo', 'Sapucaia do Sul', 'Uruguaiana', 'Viamão',
  ],
  RO: ['Ariquemes', 'Cacoal', 'Guajará-Mirim', 'Ji-Paraná', 'Porto Velho', 'Rolim de Moura', 'Vilhena'],
  RR: ['Alto Alegre', 'Boa Vista', 'Bonfim', 'Caracaraí', 'Mucajaí', 'Pacaraima', 'Rorainópolis'],
  SC: [
    'Araranguá', 'Balneário Camboriú', 'Barra Velha', 'Biguaçu', 'Blumenau', 'Braço do Norte',
    'Brusque', 'Caçador', 'Camboriú', 'Canoinhas', 'Chapecó', 'Concórdia', 'Criciúma',
    'Curitibanos', 'Florianópolis', 'Fraiburgo', 'Garopaba', 'Gaspar', 'Guaramirim',
    'Içara', 'Imbituba', 'Indaial', 'Itajaí', 'Itapema', 'Itapoá', 'Jaraguá do Sul',
    'Joaçaba', 'Joinville', 'Lages', 'Laguna', 'Mafra', 'Navegantes', 'Orleans',
    'Palhoça', 'Penha', 'Piçarras', 'Pomerode', 'Porto União', 'Rio do Sul',
    'São Bento do Sul', 'São Francisco do Sul', 'São José', 'São Miguel do Oeste',
    'Tijucas', 'Timbó', 'Tubarão', 'Videira', 'Xanxerê', 'Xaxim',
  ],
  SP: [
    'Americana', 'Araçatuba', 'Araraquara', 'Araras', 'Atibaia', 'Barueri', 'Bauru',
    'Botucatu', 'Bragança Paulista', 'Cajamar', 'Campinas', 'Carapicuíba', 'Catanduva',
    'Cotia', 'Cubatão', 'Diadema', 'Embu das Artes', 'Franca', 'Guaratinguetá',
    'Guarujá', 'Guarulhos', 'Hortolândia', 'Indaiatuba', 'Itapecerica da Serra',
    'Itapetininga', 'Itapevi', 'Itaquaquecetuba', 'Itu', 'Jacareí', 'Jundiaí',
    'Limeira', 'Marília', 'Mauá', 'Mogi das Cruzes', 'Mogi Guaçu', 'Osasco',
    'Paulínia', 'Pindamonhangaba', 'Piracicaba', 'Poá', 'Praia Grande',
    'Presidente Prudente', 'Ribeirão Preto', 'Rio Claro', 'Santana de Parnaíba',
    'Santo André', 'Santos', 'São Bernardo do Campo', 'São Caetano do Sul',
    'São Carlos', 'São José do Rio Preto', 'São José dos Campos', 'São Paulo',
    'São Vicente', 'Sertãozinho', 'Sorocaba', 'Sumaré', 'Suzano', 'Taboão da Serra',
    'Taubaté', 'Valinhos', 'Vinhedo',
  ],
  SE: ['Aracaju', 'Estância', 'Itabaiana', 'Lagarto', 'Nossa Senhora do Socorro', 'São Cristóvão'],
  TO: ['Araguaína', 'Colinas do Tocantins', 'Gurupi', 'Palmas', 'Paraíso do Tocantins', 'Porto Nacional'],
};

const cacheMunicipiosIBGE = new Map<string, string[]>();

/**
 * Extrai a sigla de 2 letras da UF a partir de strings como "SC", "MACAPÁ / AP", "EXTERIOR / EX".
 */
export function extrairSiglaUF(ufStr: string): string {
  const upper = (ufStr || '').trim().toUpperCase();
  if (upper.includes('/')) {
    const parts = upper.split('/');
    const sigla = parts[parts.length - 1].trim();
    if (/^[A-Z]{2}$/.test(sigla)) return sigla;
  }
  const match = upper.match(
    /\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO|EX)\b/
  );
  return match ? match[1] : upper.slice(0, 2);
}

/**
 * Retorna o município padrão sugerido ao selecionar um destino (ex: SC -> Florianópolis, MACAPÁ / AP -> Macapá).
 */
export function obterMunicipioPadraoDestino(ufDestino: string): string {
  const upper = (ufDestino || '').toUpperCase();
  if (upper.includes('MACAPÁ')) return 'Macapá';
  if (upper.includes('MANAUS')) return 'Manaus';
  if (upper.includes('BOA VISTA')) return 'Boa Vista';
  const sigla = extrairSiglaUF(ufDestino);
  if (sigla === 'EX') return 'Exterior';
  return CAPITAIS_POR_UF[sigla] || '';
}

/**
 * Retorna imediatamente a lista local (ou do cache IBGE, se já carregada) para a UF selecionada.
 */
export function obterMunicipiosLocaisPorUF(ufDestino: string): {
  sigla: string;
  municipios: string[];
  fonte: 'ibge' | 'local';
} {
  const sigla = extrairSiglaUF(ufDestino);
  if (!sigla || sigla === 'EX' || !CAPITAIS_POR_UF[sigla]) {
    return { sigla, municipios: [], fonte: 'local' };
  }
  const emCache = cacheMunicipiosIBGE.get(sigla);
  if (emCache && emCache.length > 0) {
    return { sigla, municipios: emCache, fonte: 'ibge' };
  }
  return {
    sigla,
    municipios: MUNICIPIOS_FALLBACK_POR_UF[sigla] || [CAPITAIS_POR_UF[sigla]],
    fonte: 'local',
  };
}

/**
 * Busca a lista oficial de municípios da UF na API pública do IBGE (gratuita),
 * com fallback imediato para a base local caso o ambiente esteja offline.
 */
export async function buscarMunicipiosPorUF(
  ufDestino: string
): Promise<{ sigla: string; municipios: string[]; fonte: 'ibge' | 'local' }> {
  const sigla = extrairSiglaUF(ufDestino);

  if (!sigla || sigla === 'EX' || !CAPITAIS_POR_UF[sigla]) {
    return { sigla, municipios: [], fonte: 'local' };
  }

  const emCache = cacheMunicipiosIBGE.get(sigla);
  if (emCache && emCache.length > 0) {
    return { sigla, municipios: emCache, fonte: 'ibge' };
  }

  const fallback = MUNICIPIOS_FALLBACK_POR_UF[sigla] || [CAPITAIS_POR_UF[sigla]];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${sigla}/municipios?orderBy=nome`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { sigla, municipios: fallback, fonte: 'local' };
    }

    const dados = (await response.json()) as Array<{ nome?: string }>;
    const nomes = dados
      .map((item) => item?.nome?.trim())
      .filter((nome): nome is string => Boolean(nome));

    if (nomes.length > 0) {
      cacheMunicipiosIBGE.set(sigla, nomes);
      return { sigla, municipios: nomes, fonte: 'ibge' };
    }
  } catch {
    // Contingência silenciosa para fallback local se estiver offline/sem acesso externo
  }

  return { sigla, municipios: fallback, fonte: 'local' };
}
