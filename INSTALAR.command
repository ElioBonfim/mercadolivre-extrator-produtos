#!/bin/bash

# Script para abrir Chrome em chrome://extensions/

echo "🚀 Abrindo Chrome..."
echo ""
echo "Instruções:"
echo "1. ✓ Ative o 'Modo do desenvolvedor' (canto superior direito)"
echo "2. ✓ Clique em 'Carregar extensão sem empacotamento'"
echo "3. ✓ Selecione a pasta: MercadoLivre-Extension"
echo "4. ✓ Pronto! A extensão estará instalada"
echo ""

# Abre o Chrome na página de extensões
open -a "Google Chrome" "chrome://extensions/"

sleep 2
echo "✅ Chrome aberto! Siga as instruções acima."
