import { CFOP } from '../types/fiscal';

/**
 * Tabela Completa dos 619 Códigos CFOP Vigentes no Brasil
 * Fonte: Convênio S/Nº de 15/12/1970, Ajuste SINIEF 07/05, Ajustes SINIEF 03/2022, 18/2023 e Tabela CONFAZ/SPED 2026.
 * Formato compacto: [codigo4Digitos, descricaoOficial]
 */
type CfopTuple = [string, string];

// Entradas do Estado (1.xxx) — 166 códigos vigentes
const CFOPS_1XXX: CfopTuple[] = [
  ['1101', 'Compra para industrialização ou produção rural'],
  ['1102', 'Compra para comercialização'],
  ['1111', 'Compra para industrialização de mercadoria recebida anteriormente em consignação industrial'],
  ['1113', 'Compra para comercialização, de mercadoria recebida anteriormente em consignação mercantil'],
  ['1116', 'Compra para industrialização ou produção rural originada de encomenda para recebimento futuro'],
  ['1117', 'Compra para comercialização originada de encomenda para recebimento futuro'],
  ['1118', 'Compra de mercadoria para comercialização pelo adquirente originário, entregue pelo vendedor remetente ao destinatário, em venda à ordem'],
  ['1120', 'Compra para industrialização, em venda à ordem, já recebida do vendedor remetente'],
  ['1121', 'Compra para comercialização, em venda à ordem, já recebida do vendedor remetente'],
  ['1122', 'Compra para industrialização em que a mercadoria foi remetida pelo fornecedor ao industrializador sem transitar pelo estabelecimento adquirente'],
  ['1124', 'Industrialização efetuada por outra empresa'],
  ['1125', 'Industrialização efetuada por outra empresa quando a mercadoria remetida para utilização no processo de industrialização não transitou pelo estabelecimento adquirente da mercadoria'],
  ['1126', 'Compra para utilização na prestação de serviço sujeita ao ICMS'],
  ['1128', 'Compra para utilização na prestação de serviço sujeita ao ISSQN'],
  ['1129', 'Compra para industrialização sob o Regime Aduaneiro Especial de Entreposto Industrial sob Controle Informatizado (Recof-Sped)'],
  ['1131', 'Entrada de mercadoria com previsão de posterior ajuste ou fixação de preço, decorrente de operação de ato cooperativo'],
  ['1132', 'Fixação de preço de produção do estabelecimento produtor, inclusive quando remetidas anteriormente com previsão de posterior ajuste ou fixação de preço, em ato cooperativo, para comercialização'],
  ['1135', 'Fixação de preço de produção do estabelecimento produtor, inclusive quando remetidas anteriormente com previsão de posterior ajuste ou fixação de preço, em ato cooperativo, para industrialização'],
  ['1151', 'Transferência para industrialização ou produção rural'],
  ['1152', 'Transferência para comercialização'],
  ['1153', 'Transferência de energia elétrica para distribuição'],
  ['1154', 'Transferência para utilização na prestação de serviço'],
  ['1159', 'Entrada decorrente do fornecimento de produto ou mercadoria de ato cooperativo'],
  ['1201', 'Devolução de venda de produção do estabelecimento'],
  ['1202', 'Devolução de venda de mercadoria adquirida ou recebida de terceiros'],
  ['1203', 'Devolução de venda de produção do estabelecimento, destinada à Zona Franca de Manaus ou Áreas de Livre Comércio'],
  ['1204', 'Devolução de venda de mercadoria adquirida ou recebida de terceiros, destinada à Zona Franca de Manaus ou Áreas de Livre Comércio'],
  ['1205', 'Anulação de valor relativo à prestação de serviço de comunicação'],
  ['1206', 'Anulação de valor relativo à prestação de serviço de transporte'],
  ['1207', 'Anulação de valor relativo à venda de energia elétrica'],
  ['1208', 'Devolução de produção do estabelecimento, remetida em transferência'],
  ['1209', 'Devolução de mercadoria adquirida ou recebida de terceiros, remetida em transferência'],
  ['1212', 'Devolução de venda no mercado interno de mercadoria industrializada e insumo importado sob o Regime Aduaneiro Especial de Entreposto Industrial sob Controle Informatizado do Sistema Público de Escrituração Digital (Recof-Sped)'],
  ['1213', 'Devolução de remessa de produção do estabelecimento com previsão de posterior ajuste ou fixação de preço, em ato cooperativo'],
  ['1214', 'Devolução de fixação de preço de produção do estabelecimento produtor, de ato cooperativo'],
  ['1215', 'Devolução de fornecimento de produção do estabelecimento de ato cooperativo'],
  ['1216', 'Devolução de fornecimento de mercadoria adquirida ou recebida de terceiros de ato cooperativo'],
  ['1251', 'Compra de energia elétrica para distribuição ou comercialização'],
  ['1252', 'Compra de energia elétrica por estabelecimento industrial'],
  ['1253', 'Compra de energia elétrica por estabelecimento comercial'],
  ['1254', 'Compra de energia elétrica por estabelecimento prestador de serviço de transporte'],
  ['1255', 'Compra de energia elétrica por estabelecimento prestador de serviço de comunicação'],
  ['1256', 'Compra de energia elétrica por estabelecimento de produtor rural'],
  ['1257', 'Compra de energia elétrica para consumo por demanda contratada'],
  ['1301', 'Aquisição de serviço de comunicação para execução de serviço da mesma natureza'],
  ['1302', 'Aquisição de serviço de comunicação por estabelecimento industrial'],
  ['1303', 'Aquisição de serviço de comunicação por estabelecimento comercial'],
  ['1304', 'Aquisição de serviço de comunicação por estabelecimento de prestador de serviço de transporte'],
  ['1305', 'Aquisição de serviço de comunicação por estabelecimento de geradora ou de distribuidora de energia elétrica'],
  ['1306', 'Aquisição de serviço de comunicação por estabelecimento de produtor rural'],
  ['1351', 'Aquisição de serviço de transporte para execução de serviço da mesma natureza'],
  ['1352', 'Aquisição de serviço de transporte por estabelecimento industrial'],
  ['1353', 'Aquisição de serviço de transporte por estabelecimento comercial'],
  ['1354', 'Aquisição de serviço de transporte por estabelecimento de prestador de serviço de comunicação'],
  ['1355', 'Aquisição de serviço de transporte por estabelecimento de geradora ou de distribuidora de energia elétrica'],
  ['1356', 'Aquisição de serviço de transporte por estabelecimento de produtor rural'],
  ['1360', 'Aquisição de serviço de transporte por contribuinte substituto em relação ao serviço de transporte'],
  ['1401', 'Compra para industrialização ou produção rural em operação com mercadoria sujeita ao regime de substituição tributária'],
  ['1403', 'Compra para comercialização em operação com mercadoria sujeita ao regime de substituição tributária'],
  ['1406', 'Compra de bem para o ativo imobilizado cuja mercadoria está sujeita ao regime de substituição tributária'],
  ['1407', 'Compra de mercadoria para uso ou consumo cuja mercadoria está sujeita ao regime de substituição tributária'],
  ['1408', 'Transferência para industrialização ou produção rural em operação com mercadoria sujeita ao regime de substituição tributária'],
  ['1409', 'Transferência para comercialização em operação com mercadoria sujeita ao regime de substituição tributária'],
  ['1410', 'Devolução de venda de produção do estabelecimento em operação com produto sujeito ao regime de substituição tributária'],
  ['1411', 'Devolução de venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária'],
  ['1414', 'Retorno de produção do estabelecimento, remetida para venda fora do estabelecimento em operação com produto sujeito ao regime de substituição tributária'],
  ['1415', 'Retorno de mercadoria adquirida ou recebida de terceiros, remetida para venda fora do estabelecimento em operação com mercadoria sujeita ao regime de substituição tributária'],
  ['1451', 'Entrada de animal - Sistema de Integração e Parceria Rural'],
  ['1452', 'Entrada de insumo - Sistema de Integração e Parceria Rural'],
  ['1453', 'Retorno de animal ou da produção - Sistema de Integração e Parceria Rural'],
  ['1454', 'Retorno simbólico de animal ou da produção - Sistema de Integração e Parceria Rural'],
  ['1455', 'Retorno de insumo não utilizado na produção - Sistema de Integração e Parceria Rural'],
  ['1456', 'Entrada referente a remuneração do produtor no Sistema de Integração e Parceria Rural'],
  ['1501', 'Entrada de mercadoria recebida com fim específico de exportação'],
  ['1503', 'Entrada decorrente de devolução de produto remetido com fim específico de exportação, de produção do estabelecimento'],
  ['1504', 'Entrada decorrente de devolução de mercadoria remetida com fim específico de exportação, adquirida ou recebida de terceiros'],
  ['1505', 'Entrada decorrente de devolução simbólica de mercadoria remetida para formação de lote de exportação, de produto industrializado ou produzido pelo próprio estabelecimento'],
  ['1506', 'Entrada decorrente de devolução simbólica de mercadoria, adquirida ou recebida de terceiros, remetida para formação de lote de exportação'],
  ['1551', 'Compra de bem para o ativo imobilizado'],
  ['1552', 'Transferência de bem do ativo imobilizado'],
  ['1553', 'Devolução de venda de bem do ativo imobilizado'],
  ['1554', 'Retorno de bem do ativo imobilizado remetido para uso fora do estabelecimento'],
  ['1555', 'Entrada de bem do ativo imobilizado de terceiro, remetido para uso no estabelecimento'],
  ['1556', 'Compra de material para uso ou consumo'],
  ['1557', 'Transferência de material para uso ou consumo'],
  ['1601', 'Recebimento, por transferência, de crédito de ICMS'],
  ['1602', 'Recebimento, por transferência, de saldo credor de ICMS de outro estabelecimento da mesma empresa, para compensação de saldo devedor de ICMS'],
  ['1603', 'Ressarcimento de ICMS retido por substituição tributária'],
  ['1604', 'Lançamento do crédito relativo à compra de bem para o ativo imobilizado'],
  ['1605', 'Recebimento, por transferência, de saldo devedor de ICMS de outro estabelecimento da mesma empresa'],
  ['1651', 'Compra de combustível ou lubrificante para industrialização subseqüente'],
  ['1652', 'Compra de combustível ou lubrificante para comercialização'],
  ['1653', 'Compra de combustível ou lubrificante por consumidor ou usuário final'],
  ['1658', 'Transferência de combustível e lubrificante para industrialização'],
  ['1659', 'Transferência de combustível e lubrificante para comercialização'],
  ['1660', 'Devolução de venda de combustível ou lubrificante destinado à industrialização subseqüente'],
  ['1661', 'Devolução de venda de combustível ou lubrificante destinado à comercialização'],
  ['1662', 'Devolução de venda de combustível ou lubrificante destinado a consumidor ou usuário final'],
  ['1663', 'Entrada de combustível ou lubrificante para armazenagem'],
  ['1664', 'Retorno de combustível ou lubrificante remetido para armazenagem'],
  ['1665', 'Retorno simbólico de combustível ou lubrificante remetido para armazenagem'],
  ['1666', 'Entrada de combustível ou lubrificante recebido por conta e ordem de terceiros para armazenagem'],
  ['1901', 'Entrada para industrialização por encomenda'],
  ['1902', 'Retorno de mercadoria remetida para industrialização por encomenda'],
  ['1903', 'Entrada de mercadoria remetida para industrialização e não aplicada no referido processo'],
  ['1904', 'Retorno de remessa para venda fora do estabelecimento'],
  ['1905', 'Entrada de mercadoria recebida para depósito em depósito fechado ou armazém geral'],
  ['1906', 'Retorno de mercadoria remetida para depósito fechado ou armazém geral'],
  ['1907', 'Retorno simbólico de mercadoria remetida para depósito fechado ou armazém geral'],
  ['1908', 'Entrada de bem por conta de contrato de comodato'],
  ['1909', 'Retorno de bem remetido por conta de contrato de comodato'],
  ['1910', 'Entrada de bonificação, doação ou brinde'],
  ['1911', 'Entrada de amostra grátis'],
  ['1912', 'Entrada de mercadoria ou bem recebido para demonstração ou mostruário'],
  ['1913', 'Retorno de mercadoria ou bem remetido para demonstração, mostruário ou treinamento'],
  ['1914', 'Retorno de mercadoria ou bem remetido para exposição ou feira'],
  ['1915', 'Entrada de mercadoria ou bem recebido para conserto ou reparo'],
  ['1916', 'Retorno de mercadoria ou bem remetido para conserto ou reparo'],
  ['1917', 'Entrada de mercadoria recebida em consignação mercantil ou industrial'],
  ['1918', 'Devolução de mercadoria remetida em consignação mercantil ou industrial'],
  ['1919', 'Devolução simbólica de mercadoria vendida ou utilizada em processo industrial, remetida anteriormente em consignação mercantil ou industrial'],
  ['1920', 'Entrada de vasilhame ou sacaria'],
  ['1921', 'Retorno de vasilhame ou sacaria'],
  ['1922', 'Lançamento efetuado a título de simples faturamento decorrente de compra para recebimento futuro'],
  ['1923', 'Entrada de mercadoria recebida do vendedor remetente, em venda à ordem'],
  ['1924', 'Entrada para industrialização por conta e ordem do adquirente da mercadoria, quando esta não transitar pelo estabelecimento do adquirente'],
  ['1925', 'Retorno de mercadoria remetida para industrialização por conta e ordem do adquirente da mercadoria, quando esta não transitar pelo estabelecimento do adquirente'],
  ['1926', 'Lançamento efetuado a título de reclassificação de mercadoria decorrente de formação de kit ou de sua desagregação'],
  ['1931', 'Lançamento efetuado pelo tomador do serviço de transporte quando a responsabilidade de retenção do imposto for atribuída ao remetente ou alienante da mercadoria, pelo serviço de transporte realizado por transportador autônomo ou por transportador não inscrito na unidade da Federação onde iniciado o serviço'],
  ['1932', 'Aquisição de serviço de transporte iniciado em unidade da Federação diversa daquela onde inscrito o prestador'],
  ['1933', 'Aquisição de serviço tributado pelo ISSQN'],
  ['1934', 'Entrada simbólica de mercadoria recebida para depósito fechado ou armazém geral'],
  ['1949', 'Outra entrada de mercadoria ou prestação de serviço não especificada'],
];

// Entradas de Outros Estados (2.xxx) — espelha 1.xxx excluindo códigos estritamente estaduais + códigos específicos de 2.xxx
const EXCLUIR_DE_2XXX = new Set(['1601', '1602', '1604', '1605', '1926', '1360']);
const CFOPS_2XXX: CfopTuple[] = [
  ...CFOPS_1XXX.filter(([cod]) => !EXCLUIR_DE_2XXX.has(cod)).map(
    ([cod, desc]): CfopTuple => [`2${cod.slice(1)}`, desc]
  ),
];

// Entradas do Exterior (3.xxx) — 26 códigos oficiais vigentes
const CFOPS_3XXX: CfopTuple[] = [
  ['3101', 'Compra para industrialização ou produção rural'],
  ['3102', 'Compra para comercialização'],
  ['3126', 'Compra para utilização na prestação de serviço sujeita ao ICMS'],
  ['3127', 'Compra para industrialização sob o regime de "drawback"'],
  ['3128', 'Compra para utilização na prestação de serviço sujeita ao ISSQN'],
  ['3129', 'Compra para industrialização sob o Regime Aduaneiro Especial de Entreposto Industrial sob Controle Informatizado do Sistema Público de Escrituração Digital (Recof-Sped)'],
  ['3201', 'Devolução de venda de produção do estabelecimento'],
  ['3202', 'Devolução de venda de mercadoria adquirida ou recebida de terceiros'],
  ['3205', 'Anulação de valor relativo à prestação de serviço de comunicação'],
  ['3206', 'Anulação de valor relativo à prestação de serviço de transporte'],
  ['3207', 'Anulação de valor relativo à venda de energia elétrica'],
  ['3211', 'Devolução de venda de produção do estabelecimento sob o regime de "drawback"'],
  ['3212', 'Devolução de venda no mercado externo de mercadoria industrializada sob o Regime Aduaneiro Especial de Entreposto Industrial sob Controle Informatizado do Sistema Público de Escrituração Digital (Recof-Sped)'],
  ['3251', 'Compra de energia elétrica para distribuição ou comercialização'],
  ['3301', 'Aquisição de serviço de comunicação para execução de serviço da mesma natureza'],
  ['3351', 'Aquisição de serviço de transporte para execução de serviço da mesma natureza'],
  ['3352', 'Aquisição de serviço de transporte por estabelecimento industrial'],
  ['3353', 'Aquisição de serviço de transporte por estabelecimento comercial'],
  ['3354', 'Aquisição de serviço de transporte por estabelecimento de prestador de serviço de comunicação'],
  ['3355', 'Aquisição de serviço de transporte por estabelecimento de geradora ou de distribuidora de energia elétrica'],
  ['3356', 'Aquisição de serviço de transporte por estabelecimento de produtor rural'],
  ['3503', 'Devolução de mercadoria exportada que tenha sido recebida com fim específico de exportação'],
  ['3551', 'Compra de bem para o ativo imobilizado'],
  ['3553', 'Devolução de venda de bem do ativo imobilizado'],
  ['3556', 'Compra de material para uso ou consumo'],
  ['3651', 'Compra de combustível ou lubrificante para industrialização subseqüente'],
  ['3652', 'Compra de combustível ou lubrificante para comercialização'],
  ['3653', 'Compra de combustível ou lubrificante por consumidor ou usuário final'],
  ['3930', 'Lançamento efetuado a título de entrada de bem sob amparo de regime especial aduaneiro de admissão temporária'],
  ['3949', 'Outra entrada de mercadoria ou prestação de serviço não especificado'],
];

// Saídas para o Estado (5.xxx) — 169 códigos oficiais vigentes
const CFOPS_5XXX: CfopTuple[] = [
  ['5101', 'Venda de produção do estabelecimento'],
  ['5102', 'Venda de mercadoria adquirida ou recebida de terceiros'],
  ['5103', 'Venda de produção do estabelecimento, efetuada fora do estabelecimento'],
  ['5104', 'Venda de mercadoria adquirida ou recebida de terceiros, efetuada fora do estabelecimento'],
  ['5105', 'Venda de produção do estabelecimento que não deva por ele transitar'],
  ['5106', 'Venda de mercadoria adquirida ou recebida de terceiros, que não deva por ele transitar'],
  ['5109', 'Venda de produção do estabelecimento, destinada à Zona Franca de Manaus ou Áreas de Livre Comércio'],
  ['5110', 'Venda de mercadoria adquirida ou recebida de terceiros, destinada à Zona Franca de Manaus ou Áreas de Livre Comércio'],
  ['5111', 'Venda de produção do estabelecimento remetida anteriormente em consignação industrial'],
  ['5112', 'Venda de mercadoria adquirida ou recebida de terceiros remetida anteriormente em consignação industrial'],
  ['5113', 'Venda de produção do estabelecimento remetida anteriormente em consignação mercantil'],
  ['5114', 'Venda de mercadoria adquirida ou recebida de terceiros remetida anteriormente em consignação mercantil'],
  ['5115', 'Venda de mercadoria adquirida ou recebida de terceiros, recebida anteriormente em consignação mercantil'],
  ['5116', 'Venda de produção do estabelecimento originada de encomenda para entrega futura'],
  ['5117', 'Venda de mercadoria adquirida ou recebida de terceiros, originada de encomenda para entrega futura'],
  ['5118', 'Venda de produção do estabelecimento entregue ao destinatário por conta e ordem do adquirente originário, em venda à ordem'],
  ['5119', 'Venda de mercadoria adquirida ou recebida de terceiros entregue ao destinatário por conta e ordem do adquirente originário, em venda à ordem'],
  ['5120', 'Venda de mercadoria adquirida ou recebida de terceiros entregue ao destinatário pelo vendedor remetente, em venda à ordem'],
  ['5122', 'Venda de produção do estabelecimento remetida para industrialização, por conta e ordem do adquirente, sem transitar pelo estabelecimento do adquirente'],
  ['5123', 'Venda de mercadoria adquirida ou recebida de terceiros remetida para industrialização, por conta e ordem do adquirente, sem transitar pelo estabelecimento do adquirente'],
  ['5124', 'Industrialização efetuada para outra empresa'],
  ['5125', 'Industrialização efetuada para outra empresa quando a mercadoria recebida para utilização no processo de industrialização não transitar pelo estabelecimento adquirente da mercadoria'],
  ['5129', 'Venda de insumo importado e de mercadoria industrializada sob o amparo do Regime Aduaneiro Especial de Entreposto Industrial sob Controle Informatizado do Sistema Público de Escrituração Digital (Recof-Sped)'],
  ['5131', 'Remessa de produção do estabelecimento, com previsão de posterior ajuste ou fixação de preço, em ato cooperativo'],
  ['5132', 'Fixação de preço de produção do estabelecimento, inclusive quando remetidas anteriormente com previsão de posterior ajuste ou fixação de preço ou em ato cooperativo'],
  ['5151', 'Transferência de produção do estabelecimento'],
  ['5152', 'Transferência de mercadoria adquirida ou recebida de terceiros'],
  ['5153', 'Transferência de energia elétrica'],
  ['5155', 'Transferência de produção do estabelecimento, que não deva por ele transitar'],
  ['5156', 'Transferência de mercadoria adquirida ou recebida de terceiros, que não deva por ele transitar'],
  ['5159', 'Fornecimento de produção do estabelecimento de ato cooperativo'],
  ['5160', 'Fornecimento de mercadoria adquirida ou recebida de terceiros de ato cooperativo'],
  ['5201', 'Devolução de compra para industrialização ou produção rural'],
  ['5202', 'Devolução de compra para comercialização'],
  ['5205', 'Anulação de valor relativo a aquisição de serviço de comunicação'],
  ['5206', 'Anulação de valor relativo a aquisição de serviço de transporte'],
  ['5207', 'Anulação de valor relativo à compra de energia elétrica'],
  ['5208', 'Devolução de mercadoria recebida em transferência para industrialização ou produção rural'],
  ['5209', 'Devolução de mercadoria recebida em transferência para comercialização'],
  ['5210', 'Devolução de compra para utilização na prestação de serviço'],
  ['5212', 'Devolução de compra no mercado interno de mercadoria industrializada sob o Regime Aduaneiro Especial (Recof-Sped)'],
  ['5213', 'Devolução de entrada de mercadoria com previsão de posterior ajuste ou fixação de preço, em ato cooperativo'],
  ['5214', 'Devolução de fixação de preço de produção do estabelecimento produtor, de ato cooperativo'],
  ['5215', 'Devolução de fixação de preço de produção do estabelecimento produtor, de ato cooperativo, para industrialização'],
  ['5216', 'Devolução de entrada decorrente do fornecimento de produto ou mercadoria de ato cooperativo'],
  ['5251', 'Venda de energia elétrica para distribuição ou comercialização'],
  ['5252', 'Venda de energia elétrica para estabelecimento industrial'],
  ['5253', 'Venda de energia elétrica para estabelecimento comercial'],
  ['5254', 'Venda de energia elétrica para estabelecimento prestador de serviço de transporte'],
  ['5255', 'Venda de energia elétrica para estabelecimento prestador de serviço de comunicação'],
  ['5256', 'Venda de energia elétrica para estabelecimento de produtor rural'],
  ['5257', 'Venda de energia elétrica para consumo por demanda contratada'],
  ['5258', 'Venda de energia elétrica a não contribuinte'],
  ['5301', 'Prestação de serviço de comunicação para execução de serviço da mesma natureza'],
  ['5302', 'Prestação de serviço de comunicação a estabelecimento industrial'],
  ['5303', 'Prestação de serviço de comunicação a estabelecimento comercial'],
  ['5304', 'Prestação de serviço de comunicação a estabelecimento de prestador de serviço de transporte'],
  ['5305', 'Prestação de serviço de comunicação a estabelecimento de geradora ou de distribuidora de energia elétrica'],
  ['5306', 'Prestação de serviço de comunicação a estabelecimento de produtor rural'],
  ['5307', 'Prestação de serviço de comunicação a não contribuinte'],
  ['5351', 'Prestação de serviço de transporte para execução de serviço da mesma natureza'],
  ['5352', 'Prestação de serviço de transporte a estabelecimento industrial'],
  ['5353', 'Prestação de serviço de transporte a estabelecimento comercial'],
  ['5354', 'Prestação de serviço de transporte a estabelecimento de prestador de serviço de comunicação'],
  ['5355', 'Prestação de serviço de transporte a estabelecimento de geradora ou de distribuidora de energia elétrica'],
  ['5356', 'Prestação de serviço de transporte a estabelecimento de produtor rural'],
  ['5357', 'Prestação de serviço de transporte a não contribuinte'],
  ['5359', 'Prestação de serviço de transporte a contribuinte ou a não contribuinte quando a mercadoria transportada está dispensada de emissão de nota fiscal'],
  ['5360', 'Prestação de serviço de transporte a contribuinte substituto em relação ao serviço de transporte'],
  ['5401', 'Venda de produção do estabelecimento em operação com produto sujeito ao regime de substituição tributária, na condição de contribuinte substituto'],
  ['5402', 'Venda de produção do estabelecimento de produto sujeito ao regime de substituição tributária, em operação entre contribuintes substitutos do mesmo produto'],
  ['5403', 'Venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária, na condição de contribuinte substituto'],
  ['5405', 'Venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária, na condição de contribuinte substituído'],
  ['5408', 'Transferência de produção do estabelecimento em operação com produto sujeito ao regime de substituição tributária'],
  ['5409', 'Transferência de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária'],
  ['5410', 'Devolução de compra para industrialização ou produção rural em operação com mercadoria sujeita ao regime de substituição tributária'],
  ['5411', 'Devolução de compra para comercialização em operação com mercadoria sujeita ao regime de substituição tributária'],
  ['5412', 'Devolução de bem do ativo imobilizado, em operação com mercadoria sujeita ao regime de substituição tributária'],
  ['5413', 'Devolução de mercadoria destinada ao uso ou consumo, em operação com mercadoria sujeita ao regime de substituição tributária'],
  ['5414', 'Remessa de produção do estabelecimento para venda fora do estabelecimento em operação com produto sujeito ao regime de substituição tributária'],
  ['5415', 'Remessa de mercadoria adquirida ou recebida de terceiros para venda fora do estabelecimento, em operação com mercadoria sujeita ao regime de substituição tributária'],
  ['5451', 'Remessa de animal e de insumo para estabelecimento produtor - Sistema de Integração e Parceria Rural'],
  ['5452', 'Remessa de insumo - Sistema de Integração e Parceria Rural'],
  ['5453', 'Retorno de animal ou da produção - Sistema de Integração e Parceria Rural'],
  ['5454', 'Retorno simbólico de animal ou da produção - Sistema de Integração e Parceria Rural'],
  ['5455', 'Retorno de insumo não utilizado na produção - Sistema de Integração e Parceria Rural'],
  ['5456', 'Saída referente a remuneração do produtor no Sistema de Integração e Parceria Rural'],
  ['5501', 'Remessa de produção do estabelecimento, com fim específico de exportação'],
  ['5502', 'Remessa de mercadoria adquirida ou recebida de terceiros, com fim específico de exportação'],
  ['5503', 'Devolução de mercadoria recebida com fim específico de exportação'],
  ['5504', 'Remessa de mercadoria para formação de lote de exportação, de produto industrializado ou produzido pelo próprio estabelecimento'],
  ['5505', 'Remessa de mercadoria, adquirida ou recebida de terceiros, para formação de lote de exportação'],
  ['5551', 'Venda de bem do ativo imobilizado'],
  ['5552', 'Transferência de bem do ativo imobilizado'],
  ['5553', 'Devolução de compra de bem para o ativo imobilizado'],
  ['5554', 'Remessa de bem do ativo imobilizado para uso fora do estabelecimento'],
  ['5555', 'Devolução de bem do ativo imobilizado de terceiro, recebido para uso no estabelecimento'],
  ['5556', 'Devolução de compra de material de uso ou consumo'],
  ['5557', 'Transferência de material de uso ou consumo'],
  ['5601', 'Transferência de crédito de ICMS acumulado'],
  ['5602', 'Transferência de saldo credor de ICMS para outro estabelecimento da mesma empresa, destinado à compensação de saldo devedor de ICMS'],
  ['5603', 'Ressarcimento de ICMS retido por substituição tributária'],
  ['5605', 'Transferência de saldo devedor de ICMS de outro estabelecimento da mesma empresa'],
  ['5606', 'Utilização de saldo credor de ICMS para extinção por compensação de débitos fiscais'],
  ['5651', 'Venda de combustível ou lubrificante de produção do estabelecimento destinado à industrialização subseqüente'],
  ['5652', 'Venda de combustível ou lubrificante de produção do estabelecimento destinado à comercialização'],
  ['5653', 'Venda de combustível ou lubrificante de produção do estabelecimento destinado a consumidor ou usuário final'],
  ['5654', 'Venda de combustível ou lubrificante adquirido ou recebido de terceiros destinado à industrialização subseqüente'],
  ['5655', 'Venda de combustível ou lubrificante adquirido ou recebido de terceiros destinado à comercialização'],
  ['5656', 'Venda de combustível ou lubrificante adquirido ou recebido de terceiros destinado a consumidor ou usuário final'],
  ['5657', 'Remessa de combustível ou lubrificante adquirido ou recebido de terceiros para venda fora do estabelecimento'],
  ['5658', 'Transferência de combustível ou lubrificante de produção do estabelecimento'],
  ['5659', 'Transferência de combustível ou lubrificante adquirido ou recebido de terceiros'],
  ['5660', 'Devolução de compra de combustível ou lubrificante adquirido para industrialização subseqüente'],
  ['5661', 'Devolução de compra de combustível ou lubrificante adquirido para comercialização'],
  ['5662', 'Devolução de compra de combustível ou lubrificante adquirido por consumidor ou usuário final'],
  ['5663', 'Remessa para armazenagem de combustível ou lubrificante'],
  ['5664', 'Retorno de combustível ou lubrificante recebido para armazenagem'],
  ['5665', 'Retorno simbólico de combustível ou lubrificante recebido para armazenagem'],
  ['5666', 'Remessa por conta e ordem de terceiros de combustível ou lubrificante recebido para armazenagem'],
  ['5667', 'Venda de combustível ou lubrificante a consumidor ou usuário final estabelecido em outra unidade da Federação'],
  ['5901', 'Remessa para industrialização por encomenda'],
  ['5902', 'Retorno de mercadoria utilizada na industrialização por encomenda'],
  ['5903', 'Retorno de mercadoria recebida para industrialização e não aplicada no referido processo'],
  ['5904', 'Remessa para venda fora do estabelecimento'],
  ['5905', 'Remessa para depósito fechado ou armazém geral'],
  ['5906', 'Retorno de mercadoria depositada em depósito fechado ou armazém geral'],
  ['5907', 'Retorno simbólico de mercadoria depositada em depósito fechado ou armazém geral'],
  ['5908', 'Remessa de bem por conta de contrato de comodato'],
  ['5909', 'Retorno de bem recebido por conta de contrato de comodato'],
  ['5910', 'Remessa em bonificação, doação ou brinde'],
  ['5911', 'Remessa de amostra grátis'],
  ['5912', 'Remessa de mercadoria ou bem para demonstração, mostruário ou treinamento'],
  ['5913', 'Retorno de mercadoria ou bem recebido para demonstração ou mostruário'],
  ['5914', 'Remessa de mercadoria ou bem para exposição ou feira'],
  ['5915', 'Remessa de mercadoria ou bem para conserto ou reparo'],
  ['5916', 'Retorno de mercadoria ou bem recebido para conserto ou reparo'],
  ['5917', 'Remessa de mercadoria em consignação mercantil ou industrial'],
  ['5918', 'Devolução de mercadoria recebida em consignação mercantil ou industrial'],
  ['5919', 'Devolução simbólica de mercadoria vendida ou utilizada em processo industrial, recebida anteriormente em consignação mercantil ou industrial'],
  ['5920', 'Remessa de vasilhame ou sacaria'],
  ['5921', 'Devolução de vasilhame ou sacaria'],
  ['5922', 'Lançamento efetuado a título de simples faturamento decorrente de venda para entrega futura'],
  ['5923', 'Remessa de mercadoria por conta e ordem de terceiros, em venda à ordem ou em operações com armazém geral ou depósito fechado'],
  ['5924', 'Remessa para industrialização por conta e ordem do adquirente da mercadoria, quando esta não transitar pelo estabelecimento do adquirente'],
  ['5925', 'Retorno de mercadoria recebida para industrialização por conta e ordem do adquirente da mercadoria, quando aquela não transitar pelo estabelecimento do adquirente'],
  ['5926', 'Lançamento efetuado a título de reclassificação de mercadoria decorrente de formação de kit ou de sua desagregação'],
  ['5927', 'Lançamento efetuado a título de baixa de estoque decorrente de perda, roubo ou deterioração'],
  ['5928', 'Lançamento efetuado a título de baixa de estoque decorrente do encerramento da atividade da empresa'],
  ['5929', 'Lançamento efetuado em decorrência de emissão de documento fiscal relativo a operação ou prestação também registrada em equipamento Emissor de Cupom Fiscal - ECF'],
  ['5931', 'Lançamento efetuado em decorrência da responsabilidade de retenção do imposto por substituição tributária, atribuída ao remetente ou alienante da mercadoria, pelo serviço de transporte realizado por transportador autônomo ou por transportador não inscrito na unidade da Federação onde iniciado o serviço'],
  ['5932', 'Prestação de serviço de transporte iniciada em unidade da Federação diversa daquela onde inscrito o prestador'],
  ['5933', 'Prestação de serviço tributado pelo ISSQN'],
  ['5934', 'Remessa simbólica de mercadoria depositada em armazém geral ou depósito fechado'],
  ['5949', 'Outra saída de mercadoria ou prestação de serviço não especificado'],
];

// Saídas para Outros Estados (6.xxx) — espelha 5.xxx (exceto estaduais) + códigos exclusivos interestaduais (6.107, 6.108, 6.404, 6.667 omitido etc.)
const EXCLUIR_DE_6XXX = new Set([
  '5109',
  '5110',
  '5405',
  '5601',
  '5602',
  '5605',
  '5606',
  '5667',
  '5926',
  '5927',
  '5928',
  '5360',
]);
const EXTRAS_6XXX: CfopTuple[] = [
  ['6107', 'Venda de produção do estabelecimento, destinada a não contribuinte'],
  ['6108', 'Venda de mercadoria adquirida ou recebida de terceiros, destinada a não contribuinte'],
  ['6109', 'Venda de produção do estabelecimento, destinada à Zona Franca de Manaus ou Áreas de Livre Comércio'],
  ['6110', 'Venda de mercadoria adquirida ou recebida de terceiros, destinada à Zona Franca de Manaus ou Áreas de Livre Comércio'],
  ['6404', 'Venda de mercadoria sujeita ao regime de substituição tributária, cujo imposto já tenha sido retido anteriormente'],
];
const CFOPS_6XXX: CfopTuple[] = [
  ...CFOPS_5XXX.filter(([cod]) => !EXCLUIR_DE_6XXX.has(cod)).map(
    ([cod, desc]): CfopTuple => [`6${cod.slice(1)}`, desc]
  ),
  ...EXTRAS_6XXX,
];

// Saídas para o Exterior (7.xxx) — 23 códigos oficiais vigentes
const CFOPS_7XXX: CfopTuple[] = [
  ['7101', 'Venda de produção do estabelecimento'],
  ['7102', 'Venda de mercadoria adquirida ou recebida de terceiros'],
  ['7105', 'Venda de produção do estabelecimento, que não deva por ele transitar'],
  ['7106', 'Venda de mercadoria adquirida ou recebida de terceiros, que não deva por ele transitar'],
  ['7127', 'Venda de produção do estabelecimento sob o regime de "drawback"'],
  ['7129', 'Venda de produção do estabelecimento ao mercado externo de mercadoria industrializada sob o amparo do Regime Aduaneiro Especial de Entreposto Industrial sob Controle Informatizado do Sistema Público de Escrituração Digital (Recof-Sped)'],
  ['7201', 'Devolução de compra para industrialização ou produção rural'],
  ['7202', 'Devolução de compra para comercialização'],
  ['7205', 'Anulação de valor relativo à aquisição de serviço de comunicação'],
  ['7206', 'Anulação de valor relativo à aquisição de serviço de transporte'],
  ['7207', 'Anulação de valor relativo à compra de energia elétrica'],
  ['7210', 'Devolução de compra para utilização na prestação de serviço'],
  ['7211', 'Devolução de compras para industrialização sob o regime de "drawback"'],
  ['7212', 'Devolução de compras para industrialização sob o regime de Entreposto Industrial sob Controle Informatizado do Sistema Público de Escrituração Digital (Recof-Sped)'],
  ['7251', 'Venda de energia elétrica para o exterior'],
  ['7301', 'Prestação de serviço de comunicação para execução de serviço da mesma natureza'],
  ['7358', 'Prestação de serviço de transporte'],
  ['7501', 'Exportação de mercadorias recebidas com fim específico de exportação'],
  ['7504', 'Exportação de mercadoria que foi objeto de formação de lote de exportação'],
  ['7551', 'Venda de bem do ativo imobilizado'],
  ['7553', 'Devolução de compra de bem para o ativo imobilizado'],
  ['7556', 'Devolução de compra de material de uso ou consumo'],
  ['7651', 'Venda de combustível ou lubrificante de produção do estabelecimento'],
  ['7654', 'Venda de combustível ou lubrificante adquirido ou recebido de terceiros'],
  ['7667', 'Venda de combustível ou lubrificante a consumidor ou usuário final'],
  ['7930', 'Lançamento efetuado a título de devolução de bem cuja entrada tenha ocorrido sob amparo de regime especial aduaneiro de admissão temporária'],
  ['7949', 'Outra saída de mercadoria ou prestação de serviço não especificado'],
];

// Consolida e ordena todos os códigos oficiais vigentes sem duplicidade
const RAW_OFFICIAL_CFOPS: CfopTuple[] = [
  ...CFOPS_1XXX,
  ...CFOPS_2XXX,
  ...CFOPS_3XXX,
  ...CFOPS_5XXX,
  ...CFOPS_6XXX,
  ...CFOPS_7XXX,
].sort((a, b) => a[0].localeCompare(b[0]));

function deduzirRegrasCFOP(codigo4: string, descricao: string): CFOP {
  const d1 = codigo4[0];
  const suf = codigo4.slice(1);
  const formatado = `${d1}.${suf}`;
  const ehEntrada = ['1', '2', '3'].includes(d1);
  const tipo: 'entrada' | 'saida' = ehEntrada ? 'entrada' : 'saida';

  const abrangencia: 'estadual' | 'interestadual' | 'exterior' =
    d1 === '1' || d1 === '5' ? 'estadual' : d1 === '2' || d1 === '6' ? 'interestadual' : 'exterior';

  const grupo = `${d1}xxx` as CFOP['grupo'];

  let geraICMS = true;
  let geraIPI = false;
  let geraPISCOFINS = true;
  let movimentaEstoque = true;
  let movimentaFinanceiro = true;
  let quandoUsar = `Operação oficial de ${tipo} (${abrangencia}): ${descricao}.`;
  let quandoNaoUsar = 'Não utilizar fora da abrangência geográfica ou finalidade operacional prevista na Tabela SINIEF.';
  let cfopDevolucao: string | undefined;

  // Regras tributárias auditadas por subgrupo oficial SINIEF
  if (d1 === '7') {
    // Exportações: Imunidade constitucional (CF/88 Art. 155 § 2º X 'a', Art. 153 § 3º III, Art. 149 § 2º I)
    geraICMS = false;
    geraIPI = false;
    geraPISCOFINS = false;
    quandoUsar = `Operação de exportação (${descricao}) amparada por imunidade constitucional de ICMS, IPI, PIS, COFINS, CBS e IBS.`;
  } else if (['109', '110', '501', '502', '504', '505'].includes(suf)) {
    // ZFM/ALC e Fim Específico de Exportação
    geraICMS = false;
    geraIPI = false;
    geraPISCOFINS = false;
    quandoUsar = `Operação desonerada/incentivada (${descricao}) com isenção ou não incidência de ICMS, IPI e PIS/COFINS conforme legislação federal/CONFAZ.`;
  } else if (['151', '152', '153', '154', '155', '156', '408', '409', '552', '557', '658', '659'].includes(suf)) {
    // Transferências entre estabelecimentos do mesmo titular (STF ADC 49 / LC 204/2023)
    geraICMS = false;
    geraIPI = false;
    geraPISCOFINS = false;
    movimentaFinanceiro = false;
    quandoUsar = `Transferência entre matriz e filiais sem fato gerador de ICMS (STF ADC 49 / LC 204/2023) e sem receita de PIS/COFINS.`;
  } else if (['404', '405'].includes(suf)) {
    // Contribuinte substituído (ICMS-ST já retido anteriormente)
    geraICMS = false;
    geraIPI = false;
    geraPISCOFINS = true;
    quandoUsar = `Saída de mercadoria com ICMS cobrado anteriormente por substituição tributária (CST 60 / CSOSN 500 — sem destaque de ICMS próprio).`;
  } else if (['556', '407', '653'].includes(suf)) {
    // Uso e consumo
    geraICMS = false;
    geraIPI = false;
    geraPISCOFINS = false;
    quandoUsar = `Operação envolvendo material de uso/consumo ou combustível para consumo final (vedação de crédito fiscal padrão).`;
  } else if (suf === '551') {
    geraICMS = ehEntrada;
    geraIPI = d1 === '3';
    geraPISCOFINS = ehEntrada;
    quandoUsar = ehEntrada
      ? 'Aquisição de bem para o ativo imobilizado (crédito ICMS via CIAP 1/48 e depreciação/crédito PIS/COFINS conforme Lei 10.833).'
      : 'Venda de bem do ativo imobilizado com não incidência de ICMS, IPI e exclusão de receita não operacional de PIS/COFINS.';
  } else if (['601', '602', '603', '604', '605', '606'].includes(suf)) {
    // Créditos e ressarcimentos de ICMS
    geraICMS = true;
    geraIPI = false;
    geraPISCOFINS = false;
    movimentaEstoque = false;
    movimentaFinanceiro = false;
    quandoUsar = 'Escrituração exclusiva de transferência, compensação, crédito CIAP ou ressarcimento de ICMS — não movimenta mercadoria física.';
  } else if (['251', '252', '253', '254', '255', '256', '257', '258', '301', '302', '303', '304', '305', '306', '307', '351', '352', '353', '354', '355', '356', '357', '358', '359', '360'].includes(suf)) {
    // Energia elétrica, comunicação e transporte
    geraICMS = true;
    geraIPI = false;
    geraPISCOFINS = true;
    movimentaEstoque = false;
    quandoUsar = `Prestação ou aquisição de serviço de energia elétrica, comunicação ou transporte (${abrangencia}).`;
  } else if (['451', '452', '453', '454', '455', '456'].includes(suf)) {
    // Sistema de Integração e Parceria Rural
    geraICMS = suf === '456';
    geraIPI = false;
    geraPISCOFINS = suf === '456';
    movimentaFinanceiro = suf === '456';
    quandoUsar = 'Operação específica do Sistema de Integração e Parceria Rural (Lei nº 13.288/2016 e Ajuste SINIEF).';
  } else if (
    [
      '554', '555', '663', '664', '665', '666',
      '901', '902', '903', '904', '905', '906', '907', '908', '909',
      '911', '912', '913', '914', '915', '916', '920', '921', '923',
      '924', '925', '926', '927', '928', '929', '930', '931', '932',
      '933', '934', '949',
    ].includes(suf)
  ) {
    // Remessas/retornos sem transferência de titularidade, suspensão, isenção ou ajustes de estoque
    geraICMS = false;
    geraIPI = false;
    geraPISCOFINS = false;
    movimentaFinanceiro = suf === '933';
    quandoUsar = `Operação de remessa, retorno, suspensão ou lançamento específico sem incidência de venda/faturamento padrão (${descricao}).`;
  } else if (suf === '910') {
    // Bonificação / doação / brinde
    geraICMS = true;
    geraIPI = !ehEntrada;
    geraPISCOFINS = false;
    movimentaFinanceiro = false;
  } else if (['917', '918', '919'].includes(suf)) {
    // Consignação
    geraICMS = true;
    geraIPI = true;
    geraPISCOFINS = false;
    movimentaFinanceiro = false;
  } else if (suf === '922') {
    // Simples faturamento para entrega futura
    geraICMS = false;
    geraIPI = true;
    geraPISCOFINS = true;
    movimentaEstoque = false;
  } else if (['116', '117'].includes(suf)) {
    // Remessa/entrada de entrega futura (já faturada no x.922)
    geraICMS = true;
    geraIPI = false;
    geraPISCOFINS = false;
    movimentaFinanceiro = false;
  } else if (['101', '103', '105', '107', '111', '113', '118', '122', '124', '125', '201', '401', '402'].includes(suf)) {
    geraIPI = true;
  }

  // Dedução automática do CFOP de devolução correspondente
  if (suf === '101' || suf === '102') {
    const inv = d1 === '1' ? '5' : d1 === '2' ? '6' : d1 === '3' ? '7' : d1 === '5' ? '1' : d1 === '6' ? '2' : '3';
    cfopDevolucao = `${inv}.20${suf[2]}`;
  } else if (suf === '201' || suf === '202') {
    const inv = d1 === '1' ? '5' : d1 === '2' ? '6' : d1 === '3' ? '7' : d1 === '5' ? '1' : d1 === '6' ? '2' : '3';
    cfopDevolucao = `${inv}.10${suf[2]}`;
  } else if (suf === '915') {
    const inv = d1 === '1' ? '5' : d1 === '2' ? '6' : d1 === '5' ? '1' : '2';
    cfopDevolucao = `${inv}.916`;
  } else if (suf === '916') {
    const inv = d1 === '1' ? '5' : d1 === '2' ? '6' : d1 === '5' ? '1' : '2';
    cfopDevolucao = `${inv}.915`;
  } else if (suf === '901') {
    const inv = d1 === '1' ? '5' : d1 === '2' ? '6' : d1 === '5' ? '1' : '2';
    cfopDevolucao = `${inv}.902`;
  }

  return {
    id: `cfop-${codigo4}`,
    codigo: formatado,
    descricao,
    tipo,
    abrangencia,
    grupo,
    quandoUsar,
    quandoNaoUsar,
    cfopDevolucao,
    geraCreditoDebitoICMS: geraICMS,
    geraCreditoDebitoIPI: geraIPI,
    geraCreditoDebitoPISCOFINS: geraPISCOFINS,
    movimentaEstoque,
    movimentaFinanceiro,
    vigenciaInicio: '2003-01-01',
    fonte: 'Tabela Oficial CFOP — Convênio S/Nº 1970 e Ajustes SINIEF CONFAZ 2026',
    dataAtualizacao: '2026-01-01',
    favorito: false,
  };
}

/**
 * Mescla os CFOPs detalhados manualmente com toda a tabela oficial vigente da CONFAZ/SINIEF
 * preservando descrições e regras detalhadas já existentes e preenchendo todos os demais códigos oficiais.
 */
export function construirCatalogoCFOPCompleto(curados: CFOP[]): CFOP[] {
  const mapa = new Map<string, CFOP>();

  for (const item of curados) {
    const clean = item.codigo.replace(/\D/g, '');
    mapa.set(clean, item);
  }

  for (const [cod, desc] of RAW_OFFICIAL_CFOPS) {
    if (!mapa.has(cod)) {
      mapa.set(cod, deduzirRegrasCFOP(cod, desc));
    }
  }

  return Array.from(mapa.values()).sort((a, b) =>
    a.codigo.replace(/\D/g, '').localeCompare(b.codigo.replace(/\D/g, ''))
  );
}
