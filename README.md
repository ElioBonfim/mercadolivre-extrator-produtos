# 🛒 Mercado Livre — Extrator de Produtos (Chrome Extension)

Extensão Chrome (Manifest V3) que extrai e lista todos os produtos exibidos em uma página do Mercado Livre, com filtro, ordenação e exportação para CSV.

## ✨ Funcionalidades

- **🔍 Filtrar** produtos por nome em tempo real
- **📊 Ordenar** por Nome (A-Z), Menor/Maior Preço, Maior Desconto
- **📋 Copiar** em CSV (cola direto no Excel/Google Sheets)
- **⬇️ Baixar CSV** (separador `;`, decimal `,`, BOM UTF-8)
- **🧰 Extração em massa** via `ml-to-csv.js` (Node) lendo o JSON embutido da página

**Campos extraídos:** `id, titulo, preco, preco_original, desconto, parcelas, frete, full, categoria, link`

## 🚀 Instalação

1. Abra `chrome://extensions/`
2. Ative o **Modo do desenvolvedor** (canto superior direito)
3. Clique em **"Carregar extensão sem empacotamento"** e selecione esta pasta

Detalhes completos de uso em [`LEIA-ME.md`](LEIA-ME.md).

## 🧰 Extração em massa (CLI)

```bash
node ml-to-csv.js /caminho/pagina.html        # gera pagina.csv
node ml-to-csv.js pagina.html saida.csv       # nome de saída custom
```

## 🔐 Segurança

- 100% offline — nenhum dado é enviado a servidores
- Sem tracking ou analytics
- Permissões mínimas (`activeTab`, `scripting`, `tabs`) restritas a `*.mercadolivre.com.br`

## 📄 Licença

MIT

---

> ⚠️ Uso pessoal/educacional. Respeite os Termos de Uso do Mercado Livre ao coletar dados.
