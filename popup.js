let allProducts = [];
let filteredProducts = [];
let currentTabUrl = '';

document.addEventListener('DOMContentLoaded', () => {
    extractProducts();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('extractBtn').addEventListener('click', extractProducts);
    document.getElementById('searchBox').addEventListener('input', filterProducts);
    document.getElementById('sortSelect').addEventListener('change', sortAndDisplay);
    document.getElementById('copyBtn').addEventListener('click', copyToClipboard);
    document.getElementById('csvBtn').addEventListener('click', downloadCSV);
    document.getElementById('supabaseBtn').addEventListener('click', saveToSupabase);
}

function extractProducts() {
    const container = document.getElementById('productContainer');
    container.innerHTML = '<div class="loading"><div class="spinner"></div>Extraindo produtos...</div>';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        currentTabUrl = tabs[0] ? tabs[0].url : '';
        chrome.tabs.sendMessage(tabs[0].id, { action: 'extractProducts' }, (response) => {
            if (chrome.runtime.lastError || !response) {
                container.innerHTML = emptyMsg('Não consegui ler a página.',
                    'Recarregue a aba do Mercado Livre (F5) e clique em ↻ Extrair.');
                return;
            }
            if (response.products && response.products.length) {
                allProducts = response.products;
                filteredProducts = [...allProducts];
                sortAndDisplay();
                updateCount();
            } else {
                container.innerHTML = emptyMsg('Nenhum produto encontrado.',
                    'Abra uma home, busca ou listagem do Mercado Livre e raspe a página (role até o fim para carregar mais).');
            }
        });
    });
}

function emptyMsg(t, s) {
    return `<div class="empty"><div class="empty-icon">⚠️</div><p>${t}</p>
            <p style="font-size:11px;margin-top:8px;color:#aaa;">${s}</p></div>`;
}

function filterProducts() {
    const q = document.getElementById('searchBox').value.toLowerCase();
    filteredProducts = allProducts.filter(p => p.titulo.toLowerCase().includes(q));
    sortAndDisplay();
    updateCount();
}

function sortAndDisplay() {
    const by = document.getElementById('sortSelect').value;
    if (by === 'nome') filteredProducts.sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));
    else if (by === 'preco-asc') filteredProducts.sort((a, b) => (a.preco ?? Infinity) - (b.preco ?? Infinity));
    else if (by === 'preco-desc') filteredProducts.sort((a, b) => (b.preco ?? -1) - (a.preco ?? -1));
    else if (by === 'desconto') filteredProducts.sort((a, b) => descPct(b) - descPct(a));
    else filteredProducts.sort((a, b) => a.ordem - b.ordem);
    displayProducts();
}

function descPct(p) {
    const m = (p.desconto || '').match(/(\d+)\s*%/);
    return m ? parseInt(m[1], 10) : 0;
}

function brl(n) {
    return n == null ? '—' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function displayProducts() {
    const container = document.getElementById('productContainer');
    if (!filteredProducts.length) {
        container.innerHTML = emptyMsg('Nenhum produto com esse filtro.', '');
        return;
    }
    container.innerHTML = filteredProducts.map((p, i) => `
        <div class="product-item">
            <div class="product-name">${i + 1}. ${p.titulo}
                ${p.full ? '<span class="badge">FULL</span>' : ''}
                ${p.desconto ? `<span class="badge badge-disc">${p.desconto}</span>` : ''}
            </div>
            <div class="product-price">${brl(p.preco)}
                ${p.preco_original ? `<span class="old">${brl(p.preco_original)}</span>` : ''}
            </div>
            <div class="product-meta">
                <span>${p.parcelas || ''}</span>
                <span>${p.frete || ''}</span>
            </div>
        </div>`).join('');
}

function updateCount() {
    const el = document.getElementById('count');
    el.textContent = filteredProducts.length === allProducts.length
        ? `Total: ${allProducts.length} produtos`
        : `Exibindo ${filteredProducts.length} de ${allProducts.length}`;
}

// ---------- exportações ----------

function csvCell(v) {
    if (v == null) return '';
    const s = String(v).replace(/"/g, '""');
    return /[",;\n]/.test(s) ? `"${s}"` : s;
}

function buildCSV(list) {
    const headers = ['ordem', 'id', 'titulo', 'preco', 'preco_original', 'desconto', 'parcelas', 'frete', 'full', 'link'];
    const rows = list.map(p => headers.map(h => {
        if (h === 'full') return p.full ? 'sim' : 'nao';
        if (h === 'preco' || h === 'preco_original') return p[h] == null ? '' : String(p[h]).replace('.', ',');
        return csvCell(p[h]);
    }).join(';'));
    // ; como separador + BOM = abre certinho no Excel pt-BR
    return '﻿' + headers.join(';') + '\n' + rows.join('\n');
}

function downloadCSV() {
    if (!filteredProducts.length) { alert('Nada para exportar.'); return; }
    const blob = new Blob([buildCSV(filteredProducts)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const data = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `mercadolivre-produtos-${data}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    flash('csvBtn', '✓ Baixado!');
}

function copyToClipboard() {
    if (!filteredProducts.length) { alert('Nada para copiar.'); return; }
    navigator.clipboard.writeText(buildCSV(filteredProducts)).then(() => flash('copyBtn', '✓ Copiado!'));
}

function flash(id, msg) {
    const btn = document.getElementById(id);
    const orig = btn.textContent;
    btn.textContent = msg;
    setTimeout(() => { btn.textContent = orig; }, 2000);
}

// ---------- Supabase ----------

function toRow(p) {
    return {
        ml_id: p.id || null,
        titulo: p.titulo,
        preco: p.preco,
        preco_original: p.preco_original,
        desconto: p.desconto || null,
        parcelas: p.parcelas || null,
        frete: p.frete || null,
        full_ml: !!p.full,
        link: p.link || null,
        origem: currentTabUrl || null
    };
}

async function saveToSupabase() {
    const btn = document.getElementById('supabaseBtn');
    if (!filteredProducts.length) { alert('Nada para salvar. Extraia produtos primeiro.'); return; }
    if (typeof SUPABASE_CONFIG === 'undefined' || !SUPABASE_CONFIG.url || !SUPABASE_CONFIG.publishableKey) {
        alert('Supabase não configurado. Edite o config.js.'); return;
    }

    const orig = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ Salvando...';

    const endpoint = `${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.table}`;
    const headers = {
        'apikey': SUPABASE_CONFIG.publishableKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.publishableKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    };

    const rows = filteredProducts.map(toRow);
    const BATCH = 200;
    let salvos = 0;

    try {
        for (let i = 0; i < rows.length; i += BATCH) {
            const chunk = rows.slice(i, i + BATCH);
            const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(chunk) });
            if (!res.ok) {
                const msg = await res.text();
                throw new Error(`HTTP ${res.status}: ${msg.slice(0, 200)}`);
            }
            salvos += chunk.length;
        }
        btn.textContent = `✓ ${salvos} salvos`;
    } catch (e) {
        console.error('Supabase:', e);
        btn.textContent = '✗ Erro';
        alert('Falha ao salvar no Supabase:\n' + e.message);
    } finally {
        setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 2500);
    }
}
