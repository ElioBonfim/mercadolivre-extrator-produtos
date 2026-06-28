# 🛒 Extensão Chrome - Mercado Livre Extrator

## ✨ Pronto para usar!

Esta pasta contém TUDO que você precisa para instalar a extensão no Chrome.

### 📂 Conteúdo da Pasta

```
MercadoLivre-Extension/
├── manifest.json      ✓ Configuração
├── popup.html         ✓ Interface
├── popup.js           ✓ Lógica
├── content.js         ✓ Extrator
├── images/
│   ├── icon16.png     ✓ Ícone 16x16
│   ├── icon48.png     ✓ Ícone 48x48
│   └── icon128.png    ✓ Ícone 128x128
└── LEIA-ME.md         ← Você está aqui
```

---

## 🚀 INSTALAÇÃO RÁPIDA (3 passos)

### 1️⃣ Abra o Chrome
- Clique em **☰** (menu) → **Mais ferramentas** → **Extensões**
- OU digite na barra: `chrome://extensions/`

### 2️⃣ Ative o Modo do Desenvolvedor
- No canto **superior direito**, ative o toggle **"Modo do desenvolvedor"**

### 3️⃣ Carregue a Extensão
- Clique em **"Carregar extensão sem empacotamento"**
- **Selecione ESTA PASTA** (`MercadoLivre-Extension`)
- ✅ Pronto! A extensão aparecerá na lista

---

## 📖 Como usar

1. Vá para **mercadolivre.com.br**
2. Faça uma busca (qualquer produto)
3. Clique no ícone da extensão 🛒
4. **Aproveite!**

### Funcionalidades

| Função | O que faz |
|--------|-----------|
| **🔍 Filtrar** | Busca produtos por nome em tempo real |
| **📊 Ordenar** | Nome (A-Z), Menor/Maior Preço, Maior Desconto |
| **📋 Copiar** | Copia em CSV (cola direto no Excel/Sheets) |
| **⬇️ CSV** | Baixa arquivo `.csv` (separador `;`, decimal `,`, BOM UTF-8) |
| **↻ Extrair** | Extrai novamente os produtos |

> 💡 Role a página até o fim antes de extrair: o ML carrega mais produtos conforme você rola.

### Campos extraídos
`id, titulo, preco, preco_original, desconto, parcelas, frete, full, categoria, link`

---

## 🧰 Extração em massa (sem instalar nada) — `ml-to-csv.js`

Para pegar **todos** os produtos de uma página (inclusive os que só carregam ao rolar), salve a página e rode o parser, que lê o JSON embutido do ML:

1. Na página do ML: `Cmd+S` → salvar como **"Página da Web, completa"** → `pagina.html`
2. No terminal, dentro desta pasta:
   ```bash
   node ml-to-csv.js /caminho/pagina.html
   ```
3. Gera `pagina.csv` com tudo. Opcional: `node ml-to-csv.js pagina.html saida.csv`

📄 `amostra-monitores.csv` — exemplo de saída (24 monitores de uma home logada).

---

## 💡 Dicas

✅ **Fixe a extensão** na barra de ferramentas para acesso rápido  
✅ **Filtre** para produtos específicos  
✅ **Ordene** por preço para encontrar os melhores  
✅ **Copie** e cole a lista em Excel/Google Sheets  

---

## 🆘 Troubleshooting

### "Nenhum produto encontrado"
- Você está em uma página vazia?
- Tente fazer uma busca no Mercado Livre

### Extensão não aparece
- ✅ Modo do Desenvolvedor está ON?
- ✅ Selecionou ESTA PASTA?
- ✅ Recarregou a página (F5)?

### Alguns preços não aparecem
- A estrutura do ML muda
- Clique "↻ Extrair" novamente

---

## 🔐 Segurança

✅ 100% offline (nenhum dado é enviado)  
✅ Uso pessoal exclusivo  
✅ Sem tracking ou analytics  

---

## 📝 Próximos Passos

1. ✓ Abra `chrome://extensions/`
2. ✓ Ative "Modo do desenvolvedor"
3. ✓ Clique "Carregar extensão sem empacotamento"
4. ✓ Selecione esta pasta
5. **🎉 Aproveite!**

---

**Desenvolvido para seu uso pessoal** | v1.0
