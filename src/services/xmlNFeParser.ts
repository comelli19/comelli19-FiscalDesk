/**
 * Parser de XML de Nota Fiscal Eletrônica (NF-e v4.00 e v3.10)
 * Extrai emitente, destinatário, itens com CFOP, NCM, tributos e DIFAL
 * para alimentar o Simulador Fiscal e auditar conformidade.
 */

export interface XMLItemProduto {
  nItem: number;
  cProd: string;
  xProd: string;
  ncm: string;
  cest?: string;
  cfop: string;
  uCom: string;
  qCom: number;
  vUnCom: number;
  vProd: number;
  // Tributos do item declarados no XML
  origemMercadoria: string;
  cstICMS: string;
  csosn?: string;
  aliquotaICMS: number;
  valorICMS: number;
  valorICMSST?: number;
  valorICMSDeson?: number;
  motDesICMS?: string;
  // IPI
  cstIPI?: string;
  aliquotaIPI?: number;
  valorIPI?: number;
  // PIS
  cstPIS?: string;
  aliquotaPIS?: number;
  valorPIS?: number;
  // COFINS
  cstCOFINS?: string;
  aliquotaCOFINS?: number;
  valorCOFINS?: number;
  // DIFAL do item (se houver grupo ICMSUFDest)
  temDifalDeclarado?: boolean;
  aliquotaInterDIFAL?: number;
  aliquotaDestinoDIFAL?: number;
  valorDIFAL?: number;
}

export interface DadosNFeExtraidos {
  chaveAcesso: string;
  numeroNF: string;
  serie: string;
  dataEmissao: string;
  naturezaOperacao: string;
  tipoOperacao: 'interna' | 'interestadual' | 'exterior';
  finalidade: 'normal' | 'complementar' | 'ajuste' | 'devolucao';
  // Emitente
  emitente: {
    cnpj: string;
    razaoSocial: string;
    uf: string;
    municipio: string;
    inscricaoEstadual: string;
    crt: '1' | '2' | '3'; // 1=Simples, 2=Simples Excesso, 3=Normal
    regimeTraduzido: 'simples_nacional' | 'lucro_presumido' | 'lucro_real';
  };
  // Destinatário
  destinatario: {
    cnpjCpf: string;
    razaoSocial: string;
    uf: string;
    municipio: string;
    inscricaoEstadual: string;
    indIEDest: '1' | '2' | '9'; // 1=Contribuinte, 2=Isento, 9=Não Contribuinte
    possuiIE: boolean;
    isuf?: string; // Inscrição SUFRAMA
    envolveZFM: boolean;
  };
  // Totais
  totais: {
    valorProdutos: number;
    valorFrete: number;
    valorSeguro: number;
    valorDesconto: number;
    valorOutro?: number;
    valorICMS: number;
    valorST?: number;
    valorICMSDeson: number;
    valorIPI: number;
    valorPIS: number;
    valorCOFINS: number;
    valorDIFAL: number;
    valorTotalNF: number;
  };
  // Itens
  itens: XMLItemProduto[];
}

/**
 * Função utilitária para extrair texto de tag XML considerando namespaces
 */
function getTagText(parent: Element | Document, tagName: string): string {
  const el = parent.getElementsByTagName(tagName)[0];
  return el ? (el.textContent || '').trim() : '';
}

function getTagFloat(parent: Element | Document, tagName: string): number {
  const val = getTagText(parent, tagName);
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Processa string de XML de NF-e e retorna objeto estruturado
 */
export function parseXMLNFe(xmlString: string): {
  sucesso: boolean;
  dados?: DadosNFeExtraidos;
  erro?: string;
} {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    // Valida se houve erro de parse
    const parserError = xmlDoc.getElementsByTagName('parsererror')[0];
    if (parserError) {
      return {
        sucesso: false,
        erro: 'O arquivo informado não contém uma estrutura XML válida: ' + parserError.textContent,
      };
    }

    const infNFe = xmlDoc.getElementsByTagName('infNFe')[0];
    if (!infNFe) {
      return {
        sucesso: false,
        erro: 'Tag <infNFe> não encontrada. Certifique-se de carregar um XML de Nota Fiscal Eletrônica (NF-e modelo 55 ou 65).',
      };
    }

    // 1. Chave e Identificação da NF
    const chaveId = infNFe.getAttribute('Id') || '';
    const chaveAcesso = chaveId.replace(/\D/g, '');
    const ide = xmlDoc.getElementsByTagName('ide')[0];

    const numeroNF = ide ? getTagText(ide, 'nNF') : '';
    const serie = ide ? getTagText(ide, 'serie') : '';
    const dataEmissao = ide ? getTagText(ide, 'dhEmi').substring(0, 10) : '';
    const naturezaOperacao = ide ? getTagText(ide, 'natOp') : '';

    const idDest = ide ? getTagText(ide, 'idDest') : '1';
    let tipoOperacao: 'interna' | 'interestadual' | 'exterior' = 'interna';
    if (idDest === '2') tipoOperacao = 'interestadual';
    else if (idDest === '3') tipoOperacao = 'exterior';

    const finNFe = ide ? getTagText(ide, 'finNFe') : '1';
    let finalidade: 'normal' | 'complementar' | 'ajuste' | 'devolucao' = 'normal';
    if (finNFe === '4') finalidade = 'devolucao';
    else if (finNFe === '2') finalidade = 'complementar';
    else if (finNFe === '3') finalidade = 'ajuste';

    // 2. Dados do Emitente
    const emit = xmlDoc.getElementsByTagName('emit')[0];
    const emitUF = emit ? getTagText(emit, 'UF') : 'SP';
    const crt = (emit ? getTagText(emit, 'CRT') : '3') as '1' | '2' | '3';
    const regimeTraduzido: 'simples_nacional' | 'lucro_presumido' | 'lucro_real' =
      crt === '1' ? 'simples_nacional' : 'lucro_presumido';

    const emitente = {
      cnpj: emit ? getTagText(emit, 'CNPJ') || getTagText(emit, 'CPF') : '',
      razaoSocial: emit ? getTagText(emit, 'xNome') : '',
      uf: emitUF,
      municipio: emit ? getTagText(emit, 'xMun') : '',
      inscricaoEstadual: emit ? getTagText(emit, 'IE') : '',
      crt,
      regimeTraduzido,
    };

    // 3. Dados do Destinatário
    const dest = xmlDoc.getElementsByTagName('dest')[0];
    const destUF = dest ? getTagText(dest, 'UF') : emitUF;
    const indIEDest = (dest ? getTagText(dest, 'indIEDest') : '1') as '1' | '2' | '9';
    const possuiIE = indIEDest === '1' || (dest && getTagText(dest, 'IE').length > 4);
    const isuf = dest ? getTagText(dest, 'ISUF') : '';
    const envolveZFM =
      Boolean(isuf && isuf.length > 2) ||
      destUF === 'AM' ||
      destUF === 'AP' ||
      destUF === 'RR' ||
      (dest && getTagText(dest, 'xMun').toLowerCase().includes('manaus'));

    const destinatario = {
      cnpjCpf: dest ? getTagText(dest, 'CNPJ') || getTagText(dest, 'CPF') : '',
      razaoSocial: dest ? getTagText(dest, 'xNome') : 'CONSUMIDOR FINAL',
      uf: destUF,
      municipio: dest ? getTagText(dest, 'xMun') : '',
      inscricaoEstadual: dest ? getTagText(dest, 'IE') : '',
      indIEDest,
      possuiIE: Boolean(possuiIE && indIEDest !== '9'),
      isuf,
      envolveZFM,
    };

    // 4. Itens da Nota
    const detElements = xmlDoc.getElementsByTagName('det');
    const itens: XMLItemProduto[] = [];

    for (let i = 0; i < detElements.length; i++) {
      const det = detElements[i];
      const prod = det.getElementsByTagName('prod')[0];
      const imposto = det.getElementsByTagName('imposto')[0];

      if (!prod) continue;

      const nItem = parseInt(det.getAttribute('nItem') || `${i + 1}`, 10);
      const cProd = getTagText(prod, 'cProd');
      const xProd = getTagText(prod, 'xProd');
      const ncm = getTagText(prod, 'NCM');
      const cest = getTagText(prod, 'CEST');
      const cfop = getTagText(prod, 'CFOP');
      const uCom = getTagText(prod, 'uCom') || 'UN';
      const qCom = getTagFloat(prod, 'qCom') || 1;
      const vUnCom = getTagFloat(prod, 'vUnCom');
      const vProd = getTagFloat(prod, 'vProd') || qCom * vUnCom;

      // ICMS
      let origemMercadoria = '0';
      let cstICMS = '00';
      let csosn = '';
      let aliquotaICMS = 0;
      let valorICMS = 0;
      let valorICMSST = 0;
      let valorICMSDeson = 0;
      let motDesICMS = '';

      if (imposto) {
        const icmsGroup = imposto.getElementsByTagName('ICMS')[0];
        if (icmsGroup && icmsGroup.firstElementChild) {
          const icmsTag = icmsGroup.firstElementChild;
          origemMercadoria = getTagText(icmsTag, 'orig') || '0';
          cstICMS = getTagText(icmsTag, 'CST') || '00';
          csosn = getTagText(icmsTag, 'CSOSN') || '';
          aliquotaICMS = getTagFloat(icmsTag, 'pICMS');
          valorICMS = getTagFloat(icmsTag, 'vICMS');
          valorICMSST = getTagFloat(icmsTag, 'vICMSST');
          valorICMSDeson = getTagFloat(icmsTag, 'vICMSDeson');
          motDesICMS = getTagText(icmsTag, 'motDesICMS');
        }
      }

      // IPI
      let cstIPI = '';
      let aliquotaIPI = 0;
      let valorIPI = 0;
      if (imposto) {
        const ipiGroup = imposto.getElementsByTagName('IPI')[0];
        if (ipiGroup) {
          cstIPI = getTagText(ipiGroup, 'CST') || '50';
          aliquotaIPI = getTagFloat(ipiGroup, 'pIPI');
          valorIPI = getTagFloat(ipiGroup, 'vIPI');
        }
      }

      // PIS
      let cstPIS = '';
      let aliquotaPIS = 0;
      let valorPIS = 0;
      if (imposto) {
        const pisGroup = imposto.getElementsByTagName('PIS')[0];
        if (pisGroup) {
          cstPIS = getTagText(pisGroup, 'CST') || '01';
          aliquotaPIS = getTagFloat(pisGroup, 'pPIS');
          valorPIS = getTagFloat(pisGroup, 'vPIS');
        }
      }

      // COFINS
      let cstCOFINS = '';
      let aliquotaCOFINS = 0;
      let valorCOFINS = 0;
      if (imposto) {
        const cofinsGroup = imposto.getElementsByTagName('COFINS')[0];
        if (cofinsGroup) {
          cstCOFINS = getTagText(cofinsGroup, 'CST') || '01';
          aliquotaCOFINS = getTagFloat(cofinsGroup, 'pCOFINS');
          valorCOFINS = getTagFloat(cofinsGroup, 'vCOFINS');
        }
      }

      // DIFAL do item (ICMSUFDest)
      let temDifalDeclarado = false;
      let aliquotaInterDIFAL = 0;
      let aliquotaDestinoDIFAL = 0;
      let valorDIFAL = 0;
      if (imposto) {
        const icmsUFDest = imposto.getElementsByTagName('ICMSUFDest')[0];
        if (icmsUFDest) {
          temDifalDeclarado = true;
          aliquotaInterDIFAL = getTagFloat(icmsUFDest, 'pICMSInter');
          aliquotaDestinoDIFAL = getTagFloat(icmsUFDest, 'pICMSUFDest');
          valorDIFAL = getTagFloat(icmsUFDest, 'vICMSUFDest');
        }
      }

      itens.push({
        nItem,
        cProd,
        xProd,
        ncm,
        cest,
        cfop,
        uCom,
        qCom,
        vUnCom,
        vProd,
        origemMercadoria,
        cstICMS,
        csosn,
        aliquotaICMS,
        valorICMS,
        valorICMSST,
        valorICMSDeson,
        motDesICMS,
        cstIPI,
        aliquotaIPI,
        valorIPI,
        cstPIS,
        aliquotaPIS,
        valorPIS,
        cstCOFINS,
        aliquotaCOFINS,
        valorCOFINS,
        temDifalDeclarado,
        aliquotaInterDIFAL,
        aliquotaDestinoDIFAL,
        valorDIFAL,
      });
    }

    // 5. Totais da Nota
    const totalICMS = xmlDoc.getElementsByTagName('ICMSTot')[0];
    const totais = {
      valorProdutos: totalICMS ? getTagFloat(totalICMS, 'vProd') : 0,
      valorFrete: totalICMS ? getTagFloat(totalICMS, 'vFrete') : 0,
      valorSeguro: totalICMS ? getTagFloat(totalICMS, 'vSeg') : 0,
      valorDesconto: totalICMS ? getTagFloat(totalICMS, 'vDesc') : 0,
      valorOutro: totalICMS ? getTagFloat(totalICMS, 'vOutro') : 0,
      valorICMS: totalICMS ? getTagFloat(totalICMS, 'vICMS') : 0,
      valorST: totalICMS ? getTagFloat(totalICMS, 'vST') : 0,
      valorICMSDeson: totalICMS ? getTagFloat(totalICMS, 'vICMSDeson') : 0,
      valorIPI: totalICMS ? getTagFloat(totalICMS, 'vIPI') : 0,
      valorPIS: totalICMS ? getTagFloat(totalICMS, 'vPIS') : 0,
      valorCOFINS: totalICMS ? getTagFloat(totalICMS, 'vCOFINS') : 0,
      valorDIFAL: totalICMS ? getTagFloat(totalICMS, 'vFCPUFDest') + getTagFloat(totalICMS, 'vICMSUFDest') : 0,
      valorTotalNF: totalICMS ? getTagFloat(totalICMS, 'vNF') : 0,
    };

    return {
      sucesso: true,
      dados: {
        chaveAcesso,
        numeroNF,
        serie,
        dataEmissao,
        naturezaOperacao,
        tipoOperacao,
        finalidade,
        emitente,
        destinatario,
        totais,
        itens,
      },
    };
  } catch (err: any) {
    return {
      sucesso: false,
      erro: 'Falha durante o processamento do XML: ' + (err?.message || String(err)),
    };
  }
}

/**
 * Gera XMLs de exemplo realistas para demonstração imediata com 1 clique
 */
export function gerarXMLExemplo(tipo: 'zfm_rs_ap' | 'difal_sp_rj' | 'simples_nacional'): string {
  if (tipo === 'zfm_rs_ap') {
    return `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe43260199999999000199550010000456121000456128" versao="4.00">
      <ide>
        <cUF>43</cUF>
        <cNF>00045612</cNF>
        <natOp>VENDA DE PRODUÇÃO DO ESTABELECIMENTO DESTINADA À ZONA FRANCA DE MANAUS OU ÁREAS DE LIVRE COMÉRCIO</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>45612</nNF>
        <dhEmi>2026-02-10T14:30:00-03:00</dhEmi>
        <tpNF>1</tpNF>
        <idDest>2</idDest>
        <cMunFG>4314902</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>8</cDV>
        <tpAmb>1</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>0</indFinal>
        <indPres>1</indPres>
      </ide>
      <emit>
        <CNPJ>99999999000199</CNPJ>
        <xNome>INDÚSTRIA PLÁSTICA GAÚCHA S.A.</xNome>
        <xFant>PLAST RS</xFant>
        <enderEmit>
          <xLgr>Av. das Indústrias</xLgr>
          <nro>1500</nro>
          <xBairro>Distrito Industrial</xBairro>
          <cMun>4314902</cMun>
          <xMun>Porto Alegre</xMun>
          <UF>RS</UF>
          <CEP>90200000</CEP>
        </enderEmit>
        <IE>0960000123</IE>
        <CRT>3</CRT>
      </emit>
      <dest>
        <CNPJ>88888888000188</CNPJ>
        <xNome>DISTRIBUIDORA AMAZONENSE DE MATERIAIS LTDA</xNome>
        <enderDest>
          <xLgr>Rua Fabril Amapá</xLgr>
          <nro>300</nro>
          <xBairro>Central</xBairro>
          <cMun>1600303</cMun>
          <xMun>Macapá</xMun>
          <UF>AP</UF>
          <CEP>68900000</CEP>
        </enderDest>
        <indIEDest>1</indIEDest>
        <IE>030123456</IE>
        <ISUF>200123456</ISUF>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>ART-PLAST-3925</cProd>
          <cEAN>7891234567890</cEAN>
          <xProd>Artefatos para apetrechamento de construções, de plásticos</xProd>
          <NCM>39253000</NCM>
          <CFOP>6109</CFOP>
          <uCom>UN</uCom>
          <qCom>100.0000</qCom>
          <vUnCom>35.0000</vUnCom>
          <vProd>3500.00</vProd>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS>
            <ICMS40>
              <orig>0</orig>
              <CST>40</CST>
              <vICMSDeson>420.00</vICMSDeson>
              <motDesICMS>7</motDesICMS>
            </ICMS40>
          </ICMS>
          <IPI>
            <cEnq>999</cEnq>
            <IPINT>
              <CST>53</CST>
            </IPINT>
          </IPI>
          <PIS>
            <PISNT>
              <CST>06</CST>
            </PISNT>
          </PIS>
          <COFINS>
            <COFINSNT>
              <CST>06</CST>
            </COFINSNT>
          </COFINS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>0.00</vBC>
          <vICMS>0.00</vICMS>
          <vICMSDeson>420.00</vICMSDeson>
          <vFCPUFDest>0.00</vFCPUFDest>
          <vICMSUFDest>0.00</vICMSUFDest>
          <vICMSUFRemet>0.00</vICMSUFRemet>
          <vFCP>0.00</vFCP>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>3500.00</vProd>
          <vFrete>0.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>420.00</vDesc>
          <vII>0.00</vII>
          <vIPI>0.00</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>0.00</vPIS>
          <vCOFINS>0.00</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>3080.00</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`;
  }

  if (tipo === 'difal_sp_rj') {
    return `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35260111222333000144550010000889901000889903" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>00088990</cNF>
        <natOp>VENDA DE MERCADORIA ADQUIRIDA OU RECEBIDA DE TERCEIROS A CONSUMIDOR FINAL</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>88990</nNF>
        <dhEmi>2026-02-11T10:15:00-03:00</dhEmi>
        <tpNF>1</tpNF>
        <idDest>2</idDest>
        <cMunFG>3550308</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>3</cDV>
        <tpAmb>1</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>1</indFinal>
        <indPres>2</indPres>
      </ide>
      <emit>
        <CNPJ>11222333000144</CNPJ>
        <xNome>COMÉRCIO ELETRÔNICO PAULISTA LTDA</xNome>
        <xFant>E-COMMERCE SP</xFant>
        <enderEmit>
          <xLgr>Av. Paulista</xLgr>
          <nro>1000</nro>
          <cMun>3550308</cMun>
          <xMun>São Paulo</xMun>
          <UF>SP</UF>
          <CEP>01310100</CEP>
        </enderEmit>
        <IE>110000111222</IE>
        <CRT>3</CRT>
      </emit>
      <dest>
        <CPF>12345678900</CPF>
        <xNome>CARLOS ALBERTO SILVA (CONSUMIDOR FINAL)</xNome>
        <enderDest>
          <xLgr>Rua Barata Ribeiro</xLgr>
          <nro>450</nro>
          <cMun>3304557</cMun>
          <xMun>Rio de Janeiro</xMun>
          <UF>RJ</UF>
          <CEP>22040000</CEP>
        </enderDest>
        <indIEDest>9</indIEDest>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>NOTEBOOK-PRO-15</cProd>
          <xProd>Computador portátil de peso inferior a 3,5 kg (Notebook)</xProd>
          <NCM>84713012</NCM>
          <CFOP>6108</CFOP>
          <uCom>UN</uCom>
          <qCom>1.0000</qCom>
          <vUnCom>4500.0000</vUnCom>
          <vProd>4500.00</vProd>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <modBC>3</modBC>
              <vBC>4500.00</vBC>
              <pICMS>12.00</pICMS>
              <vICMS>540.00</vICMS>
            </ICMS00>
          </ICMS>
          <ICMSUFDest>
            <vBCUFDest>4500.00</vBCUFDest>
            <pFCPUFDest>2.00</pFCPUFDest>
            <pICMSUFDest>20.00</pICMSUFDest>
            <pICMSInter>12.00</pICMSInter>
            <pICMSInterPart>100.00</pICMSInterPart>
            <vFCPUFDest>90.00</vFCPUFDest>
            <vICMSUFDest>360.00</vICMSUFDest>
            <vICMSUFRemet>0.00</vICMSUFRemet>
          </ICMSUFDest>
          <PIS>
            <PISAliq>
              <CST>01</CST>
              <vBC>3960.00</vBC>
              <pPIS>1.65</pPIS>
              <vPIS>65.34</vPIS>
            </PISAliq>
          </PIS>
          <COFINS>
            <COFINSAliq>
              <CST>01</CST>
              <vBC>3960.00</vBC>
              <pCOFINS>7.60</pCOFINS>
              <vCOFINS>300.96</vCOFINS>
            </COFINSAliq>
          </COFINS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>4500.00</vBC>
          <vICMS>540.00</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCPUFDest>90.00</vFCPUFDest>
          <vICMSUFDest>360.00</vICMSUFDest>
          <vICMSUFRemet>0.00</vICMSUFRemet>
          <vProd>4500.00</vProd>
          <vNF>4500.00</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`;
  }

  // Simples Nacional
  return `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe31260177777777000155550010000123451000123456" versao="4.00">
      <ide>
        <cUF>31</cUF>
        <cNF>00012345</cNF>
        <natOp>VENDA DE MERCADORIA ADQUIRIDA OU RECEBIDA DE TERCEIROS</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>12345</nNF>
        <dhEmi>2026-02-11T09:00:00-03:00</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <cMunFG>3106200</cMunFG>
        <finNFe>1</finNFe>
      </ide>
      <emit>
        <CNPJ>77777777000155</CNPJ>
        <xNome>LOJA MINEIRA SIMPLES ME</xNome>
        <enderEmit>
          <cMun>3106200</cMun>
          <xMun>Belo Horizonte</xMun>
          <UF>MG</UF>
        </enderEmit>
        <CRT>1</CRT>
      </emit>
      <dest>
        <CNPJ>66666666000144</CNPJ>
        <xNome>MERCADO CENTRAL DE BH LTDA</xNome>
        <enderDest>
          <cMun>3106200</cMun>
          <xMun>Belo Horizonte</xMun>
          <UF>MG</UF>
        </enderDest>
        <indIEDest>1</indIEDest>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>CAFE-MINEIRO-500G</cProd>
          <xProd>Café torrado e moído tradicional 500g</xProd>
          <NCM>09012100</NCM>
          <CFOP>5102</CFOP>
          <uCom>FD</uCom>
          <qCom>50.0000</qCom>
          <vUnCom>18.0000</vUnCom>
          <vProd>900.00</vProd>
        </prod>
        <imposto>
          <ICMS>
            <ICMSSN102>
              <orig>0</orig>
              <CSOSN>102</CSOSN>
            </ICMSSN102>
          </ICMS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vProd>900.00</vProd>
          <vNF>900.00</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`;
}

/**
 * Gera um XML de NF-e de compra industrial de compostos de PVC (31.500 kg)
 * ideal para demonstrar o comparativo executivo 2026 x 2027.
 */
export function gerarXMLCompraDemonstracao(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35260512345678000190550010000884121000884120" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>00088412</cNF>
        <natOp>VENDA DE PRODUCAO DO ESTABELECIMENTO (INSUMO INDUSTRIAL)</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>88412</nNF>
        <dhEmi>2026-06-18T10:15:00-03:00</dhEmi>
        <tpNF>1</tpNF>
        <idDest>2</idDest>
        <cMunFG>3550308</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>0</cDV>
        <tpAmb>1</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>0</indFinal>
        <indPres>1</indPres>
      </ide>
      <emit>
        <CNPJ>12345678000190</CNPJ>
        <xNome>PETROQUIMICA SUL COMPOSTOS POLIMERICOS S/A</xNome>
        <enderEmit>
          <cMun>3550308</cMun>
          <xMun>São Paulo</xMun>
          <UF>SP</UF>
        </enderEmit>
        <IE>110042490114</IE>
        <CRT>3</CRT>
      </emit>
      <dest>
        <CNPJ>98765432000110</CNPJ>
        <xNome>INDUSTRIA DE PERFIS E TUBOS CATARINENSE LTDA</xNome>
        <enderDest>
          <cMun>4209102</cMun>
          <xMun>Joinville</xMun>
          <UF>SC</UF>
        </enderDest>
        <indIEDest>1</indIEDest>
        <IE>254001928</IE>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>PVC-COMP-315</cProd>
          <xProd>Compostos de PVC rígido para extrusão industrial</xProd>
          <NCM>39042100</NCM>
          <CFOP>6101</CFOP>
          <uCom>KG</uCom>
          <qCom>31500.0000</qCom>
          <vUnCom>7.6700</vUnCom>
          <vProd>241605.00</vProd>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <modBC>3</modBC>
              <vBC>241605.00</vBC>
              <pICMS>12.00</pICMS>
              <vICMS>28992.60</vICMS>
            </ICMS00>
          </ICMS>
          <IPI>
            <IPITrib>
              <CST>50</CST>
              <vBC>241605.00</vBC>
              <pIPI>3.25</pIPI>
              <vIPI>7852.16</vIPI>
            </IPITrib>
          </IPI>
          <PIS>
            <PISAliq>
              <CST>01</CST>
              <vBC>212612.40</vBC>
              <pPIS>1.65</pPIS>
              <vPIS>3508.10</vPIS>
            </PISAliq>
          </PIS>
          <COFINS>
            <COFINSAliq>
              <CST>01</CST>
              <vBC>212612.40</vBC>
              <pCOFINS>7.60</vCOFINS>
              <vCOFINS>16158.54</vCOFINS>
            </COFINSAliq>
          </COFINS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>241605.00</vBC>
          <vICMS>28992.60</vICMS>
          <vST>0.00</vST>
          <vProd>241605.00</vProd>
          <vFrete>0.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>0.00</vDesc>
          <vIPI>7852.16</vIPI>
          <vPIS>3508.10</vPIS>
          <vCOFINS>16158.54</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>249457.16</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`;
}
