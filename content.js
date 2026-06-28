// Mercado Livre - Extrator de Produtos (layout atual: polycard + dynamic-access)
// Lê o que está REALMENTE renderizado na página (home, busca e listagem).

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractProducts') {
        try {
            sendResponse({ products: extractProductsFromPage() });
        } catch (e) {
            sendResponse({ products: [], error: String(e) });
        }
    }
    return true;
});

// ---------- helpers ----------

function txt(el) {
    return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
}

// "R$ 1.851" + cents superscript -> 1851.00 (número) | retorna null se vazio
function moneyToNumber(amountEl) {
    if (!amountEl) return null;
    const frac = amountEl.querySelector('.andes-money-amount__fraction');
    const cents = amountEl.querySelector('.andes-money-amount__cents');
    if (!frac) return null;
    const intPart = frac.textContent.replace(/\./g, '').trim();
    const centPart = cents ? cents.textContent.trim() : '00';
    const n = parseFloat(`${intPart}.${centPart}`);
    return Number.isFinite(n) ? n : null;
}

// extrai MLBxxxx / MLBUxxxx de uma URL
function idFromUrl(url) {
    if (!url) return '';
    const m = url.match(/(MLB-?\d+|MLBU\d+)/);
    return m ? m[1].replace('-', '') : '';
}

// ---------- extração ----------

function extractProductsFromPage() {
    const out = [];

    // 1) Polycards (formato dominante hoje)
    document.querySelectorAll('.poly-card').forEach((card, idx) => {
        const link = card.querySelector('a.poly-component__title') ||
                     card.querySelector('a[href*="MLB"]');
        const titulo = txt(link) || txt(card.querySelector('.poly-component__title'));
        if (!titulo || titulo.length < 3) return;

        const href = link ? link.href : '';
        const precoEl = card.querySelector('.poly-price__current') ||
                        card.querySelector('.andes-money-amount:not(.andes-money-amount--previous)');
        const origEl = card.querySelector('.andes-money-amount--previous');

        out.push({
            ordem: idx + 1,
            id: idFromUrl(href),
            titulo,
            preco: moneyToNumber(precoEl),
            preco_original: moneyToNumber(origEl),
            desconto: txt(card.querySelector('.poly-price__disc_label, .andes-money-amount__discount')),
            parcelas: txt(card.querySelector('.poly-price__installments')),
            frete: txt(card.querySelector('.poly-component__shipping')),
            full: !!card.querySelector('[href="#poly_full"], [alt="Enviado pelo FULL"]'),
            link: href
        });
    });

    // 2) Cards de acesso rápido (dynamic-access) — quando presentes
    document.querySelectorAll('.dynamic-access-card-item').forEach((card) => {
        const link = card.querySelector('.dynamic-access-card-item__item-title') ||
                     card.querySelector('a[href*="MLB"]');
        const titulo = txt(link);
        if (!titulo || titulo.length < 3) return;
        const href = link ? link.href : '';
        const precoEl = card.querySelector('.andes-money-amount-combo__main-container .andes-money-amount') ||
                        card.querySelector('.andes-money-amount');
        const origEl = card.querySelector('.andes-money-amount--previous');
        out.push({
            ordem: out.length + 1,
            id: idFromUrl(href),
            titulo,
            preco: moneyToNumber(precoEl),
            preco_original: moneyToNumber(origEl),
            desconto: txt(card.querySelector('.andes-money-amount__discount')),
            parcelas: '',
            frete: txt(card.querySelector('.dynamic-access-card-item__container-shipping-free')),
            full: card.innerHTML.includes('full_icon') || /Enviado pelo FULL/i.test(card.textContent),
            link: href
        });
    });

    // 3) Dedup por id+titulo, reordena
    const seen = new Set();
    const unique = [];
    out.forEach(p => {
        const key = (p.id || '') + '|' + p.titulo.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        p.ordem = unique.length + 1;
        unique.push(p);
    });

    return unique;
}
