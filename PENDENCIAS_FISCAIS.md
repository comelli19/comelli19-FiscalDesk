# PENDÊNCIAS FISCAIS E AUDITORIA TRIBUTÁRIA — FISCALDESK

Este documento registra formalmente todos os itens da legislação fiscal, alíquotas estaduais, regras de ICMS-ST, notas técnicas da SEFAZ e modelos de IA que necessitam de conferência ou validação em fonte oficial primária (Diário Oficial, CONFAZ, Receita Federal ou Secretarias Estaduais de Fazenda).

---

## 1. Servidor e Modelos de Inteligência Artificial (Etapa 1)
- [x] **Modelo Gemini Live (Áudio em Tempo Real):** O identificador `gemini-3.8-live` não é um modelo oficial do catálogo do Google GenAI SDK. Configurado por padrão para o modelo oficial `gemini-2.0-flash` (ou configurável via variável de ambiente `GEMINI_LIVE_MODEL`).
- [x] **Autenticação em Rotas de Escrita:** Token de autenticação obrigatório (`API_AUTH_TOKEN` / `VITE_API_AUTH_TOKEN`) implementado para rotas `POST`, `PUT`, `DELETE`, `/api/gemini/*` e WebSocket `/api/live`.
- [x] **Rate Limiting:** Proteção de 30 req/min nas rotas de IA para evitar abuso de quota e custos.
- [x] **Tamanho de Payload (Body Parser):** Limitado a 1MB no escopo geral e até 5MB restrito a endpoints de importação em lote (`/api/ncms/importar`, `/api/cfops/importar`).

---

## 2. Dados Fiscais de UFs e Alíquotas Internas (Etapa 2 - Em Preparação)
- [ ] **Alagoas (AL):** Conferir Lei Estadual nº 8.779/2022 e atualizações para 2026 (alíquota interna padrão: 19%, 20% ou 20,5%).
- [ ] **Maranhão (MA):** Conferir Lei Estadual nº 12.120/2023 (alíquota interna padrão elevada para 22% ou 23%).
- [ ] **Rio Grande do Norte (RN):** Conferir vigência da alíquota modal de 18% vs. 20% (Lei Estadual nº 11.314/2022 e alterações).
- [ ] **Ceará (CE) e Pernambuco (PE):** Desvincular citações duplicadas. Cada estado deve apontar para sua lei orgânica do ICMS própria (ex: CE - Lei nº 12.670/1996; PE - Lei nº 15.730/2016).
- [ ] **FCP Geral vs. FCP Específico:** Fundo de Combate à Pobreza (FCP) não incide de forma linear sobre todas as mercadorias. Mover de atributo fixo da UF para tabela de NCMs sujeitos ao adicional.
- [ ] **Rejeições SEFAZ 694 vs. 695:** Conferir no Manual de Orientação do Contribuinte (MOC NF-e v7.0) a correta separação entre grupo ICMSInterestadual (`ICMSUFDest`) informado indevidamente vs. não informado.

---

## 3. Lógica de Cálculo e CFOPs (Etapa 3 - Em Preparação)
- [ ] **CFOP de Substituto vs. CFOP de Substituído:** 
  - CFOPs 5.405 e 6.404 referem-se à operação cujo ICMS-ST já foi retido anteriormente por terceiro.
  - Quando a operação atual calcula e retém ICMS-ST pela primeira vez, os CFOPs corretos são 5.401/5.403 ou 6.401/6.403.
- [ ] **DIFAL Base Dupla vs. Base Única:** Mapear os 27 estados conforme LC 190/2022 e regulamentos estaduais.
- [ ] **Exclusão do ICMS da Base de PIS/COFINS (Tema 69 STF):** Estender o benefício da exclusão do ICMS destacado da base de cálculo tanto para o Lucro Real quanto para o Lucro Presumido (RE 574.706 / Parecer SEI COSIT nº 14.483/2021).
- [ ] **Tratamento do Simples Nacional:** Eliminar cálculo de débito integral de ICMS em operações de optantes do Simples Nacional (LC 123/2006); exibir segregação CSOSN e permissão de crédito aos adquirentes (Art. 23 da LC 123).
- [ ] **Precisão Monetária:** Substituir arredondamentos de ponto flutuante por cálculo com centavos inteiros/arredondamento bancário conforme MOC da SEFAZ.

---

## 4. Reforma Tributária - EC 132/2023 e Leis Complementares (Etapa 4 - Em Preparação)
- [ ] **Substituição dos parâmetros provisórios da PLP 68/2024:** Remover CBS 8,8% + IBS 17,7%.
- [ ] **Alíquotas de Teste para o ano de 2026 (LC 214/2025 e LC 227/2026):**
  - CBS teste: 0,9%
  - IBS teste: 0,1%
  - Regime de compensação integral com PIS/COFINS (sem recolhimento líquido adicional).
- [ ] **Alíquota de Referência 2027+ Configurável:** Parâmetro editável com indicação da Resolução oficial do Comitê Gestor do IBS (CGIBS).
