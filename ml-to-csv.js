#!/usr/bin/env node
/**
 * ml-to-csv.js — Extrai TODOS os produtos de uma página do Mercado Livre salva (.html)
 * lendo o JSON embutido (_n.ctx.r.appProps). Pega inclusive seções que no
 * navegador só carregam ao rolar a página.
 *
 * Uso:
 *   node ml-to-csv.js pagina.html               -> gera pagina.csv
 *   node ml-to-csv.js pagina.html saida.csv      -> gera saida.csv
 */

const fs = require('fs');

const inFile = process.argv[2];
if (!inFile) {
    console.error('Uso: node ml-to-csv.js <arquivo.html> [saida.csv]');
    process.exit(1);
}
const outFile = process.argv[3] || inFile.replace(/\.html?$/i, '') + '.csv';

const html = fs.readFileSync(inFile, 'utf8');

// 1) Recorta o objeto JSON de _n.ctx.r={...} com balanceamento de chaves
function extractCtx(src) {
    const marker = '_n.ctx.r=';
    const start = src.indexOf(marker);
    if (start === -1) throw new Error('JSON _n.ctx.r não encontrado (a página foi salva completa?).');
    let i = src.indexOf('{', start);
    let depth = 0, inStr = false, esc = false;
    for (let j = i; j < src.length; j++) {
        const c = src[j];
        if (inStr) {
            if (esc) esc = false;
            else if (c === '\\') esc = true;
            else if (c === '"') inStr = false;
        } else {
            if (c === '"') inStr = true;
            else if (c === '{') depth++;
            else if (c === '}') { depth--; if (depth === 0) return JSON.parse(src.slice(i, j + 1)); }
        }
    }
    throw new Error('Não consegui fechar o JSON.');
}

// 2) Varre recursivamente coletando polycards e cards de produto
function collect(node, bag) {
    if (!node || typeof node !== 'object') return;

    // Polycard: { metadata:{id,...}, components:[{type:'title'...},...] }
    if (Array.isArray(node.polycards)) {
        for (const card of node.polycards) bag.push(fromPolycard(card));
    }
    // Dynamic-access / widget item: { content:{ name|header, price }, permalink }
    if (node.content && (node.content.name || node.content.title) && node.content.price) {
        const c = fromDynamicCard(node);
        if (c) bag.push(c);
    }

    for (const k in node) {
        const v = node[k];
        if (v && typeof v === 'object') collect(v, bag);
    }
}

function comp(card, type) {
    return (card.components || []).find(c => c.type === type);
}

function fromPolycard(card) {
    const md = card.metadata || {};
    const title = comp(card, 'title');
    const price = comp(card, 'price') || {};
    const p = price.price || {};
    const ship = comp(card, 'shipping');
    return {
        id: md.id || md.product_id || '',
        titulo: title ? (title.title.text || '') : '',
        preco: p.current_price ? p.current_price.value : null,
        preco_original: p.previous_price ? p.previous_price.value : null,
        desconto: p.discount_label ? p.discount_label.text : '',
        parcelas: p.installments ? (p.installments.text || '').replace('{price}', instPrice(p.installments)) : '',
        frete: ship && ship.shipping ? (ship.shipping.text || '') : '',
        full: !!(ship && ship.shipping && JSON.stringify(ship.shipping).includes('full')),
        categoria: md.category_id || '',
        link: buildUrl(md)
    };
}

function instPrice(inst) {
    const v = (inst.values || []).find(x => x.type === 'price');
    return v && v.price ? String(v.price.value).replace('.', ',') : '';
}

function fromDynamicCard(node) {
    const c = node.content;
    const name = (c.name && c.name.text) || (c.title && c.title.text) || '';
    if (!name) return null;
    const cur = c.price.current_value || {};
    const orig = c.price.original_price || {};
    return {
        id: (node.permalink || '').match(/MLB-?\d+|MLBU\d+/)?.[0]?.replace('-', '') || '',
        titulo: name,
        preco: cur.value ? num(cur.value) : null,
        preco_original: orig.value ? num(orig.value) : null,
        desconto: c.price.discount ? c.price.discount.value + '% OFF' : '',
        parcelas: '',
        frete: c.shipping ? (c.shipping.text || '').replace('{icon}', '').trim() : '',
        full: JSON.stringify(c.shipping || {}).includes('full'),
        categoria: '',
        link: node.permalink || ''
    };
}

function num(v) {
    const s = String(v.fraction || '').replace(/\./g, '') + '.' + (v.cents || '00');
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : null;
}

function buildUrl(md) {
    if (md.url) return 'https://' + String(md.url).replace(/^https?:\/\//, '').split('#')[0];
    return '';
}

// 3) CSV (Excel pt-BR: separador ; , vírgula decimal , BOM UTF-8)
function cell(v) {
    if (v == null) return '';
    const s = String(v).replace(/"/g, '""');
    return /[",;\n]/.test(s) ? `"${s}"` : s;
}
function toCSV(rows) {
    const H = ['id', 'titulo', 'preco', 'preco_original', 'desconto', 'parcelas', 'frete', 'full', 'categoria', 'link'];
    const body = rows.map(r => H.map(h => {
        if (h === 'full') return r.full ? 'sim' : 'nao';
        if (h === 'preco' || h === 'preco_original') return r[h] == null ? '' : String(r[h]).replace('.', ',');
        return cell(r[h]);
    }).join(';'));
    return '﻿' + H.join(';') + '\n' + body.join('\n');
}

// ---- run ----
const ctx = extractCtx(html);
const bag = [];
collect(ctx.appProps || ctx, bag);

// dedup por id+titulo
const seen = new Set();
const rows = bag.filter(r => {
    if (!r.titulo) return false;
    const k = (r.id || '') + '|' + r.titulo.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
});

fs.writeFileSync(outFile, toCSV(rows), 'utf8');
console.log(`✓ ${rows.length} produtos extraídos -> ${outFile}`);
