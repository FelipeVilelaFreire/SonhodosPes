const fs = require('fs');
const path = require('path');

function buildHeader() {
    const parts = [
        'PRODUTO', 'COR_PRODUTO', 'Coleção', 'QTDE_CONTAGEM', 'CONTAGEM', 'DIFERENCA_TOTAL',
        'U', '34', '35', '36', '37', '38', '39', '40', 'P', 'M', 'G', 'GG'
    ];
    for (let i = 13; i <= 48; i++) parts.push(`Q${i}`);
    for (let i = 1; i <= 48; i++) parts.push(`S${i}`);
    parts.push(
        'DESC_PRODUTO', 'GRUPO_PRODUTO', 'SUBGRUPO_PRODUTO', 'GRADE', 'UNIDADE', 'PESO',
        'REVENDA', 'DESC_COR_PRODUTO', 'COR_SORTIDA', 'COR_FABRICANTE', 'REFER_FABRICANTE'
    );
    for (let i = 1; i <= 48; i++) parts.push(`D${i}`);
    parts.push(
        'PONTEIRO_PRECO_TAM', 'VARIA_PRECO_COR', 'VARIA_PRECO_TAM',
        'CUSTO_REPOSICAO1', 'CUSTO_REPOSICAO2', 'CUSTO_REPOSICAO3', 'CUSTO_REPOSICAO4',
        'CUSTO_MEDIO1', 'CUSTO_MEDIO2', 'CUSTO_MEDIO3', 'CUSTO_MEDIO4',
        'CUSTO4_A_VALORIZAR', 'CUSTO3_A_VALORIZAR', 'CUSTO2_A_VALORIZAR', 'CUSTO1_A_VALORIZAR',
        'VALOR_CONTAGEM_DIFERENCA', 'ESTOQUE_CONTAGEM'
    );
    for (let i = 1; i <= 48; i++) parts.push(`ES${i}`);
    parts.push('DIFERENCA', 'PRECO_VENDA');
    return parts.join(',');
}

function buildRow(p) {
    const sizes = p.sizes || {};
    const totalPares = Object.values(sizes).reduce((a, b) => a + (b || 0), 0);

    const getSize = (key) => (sizes[key] || 0);
    const u = p.tipo === 'acessorio' ? (p.unidade || 0) : 0;
    const _34 = getSize('34');
    const _35 = getSize('35');
    const _36 = getSize('36');
    const _37 = getSize('37');
    const _38 = getSize('38');
    const _39 = getSize('39');
    const _40 = getSize('40');
    const _P = getSize('P');
    const _M = getSize('M');
    const _G = getSize('G');
    const _GG = getSize('GG');

    const parts = [
        p.codigo,
        p.corCode || '',
        '',
        totalPares,
        totalPares,
        0,
        u, _34, _35, _36, _37, _38, _39, _40, _P, _M, _G, _GG
    ];
    for (let i = 13; i <= 48; i++) parts.push(0);
    for (let i = 1; i <= 48; i++) parts.push(0);

    parts.push(
        p.descricao,
        p.grupo || 'CALCADOS',
        p.subgrupo || '',
        p.grade || 'CALCADOS 33 - 40',
        p.unidadeMedida || 'PAR',
        p.peso || '0.30100000',
        '.T.',
        p.cor,
        '.F.',
        '',
        p.ref || ''
    );
    for (let i = 1; i <= 48; i++) parts.push(0);

    parts.push(
        '1,11111E+47',
        '.F.',
        '.F.',
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        '(nulo)',
        '(nulo)'
    );
    for (let i = 1; i <= 48; i++) parts.push('(nulo)');
    parts.push(0, p.preco);

    return parts.map(v => {
        const s = String(v);
        if (s.includes(',') && !s.includes('"')) return `"${s}"`;
        return s;
    }).join(',');
}

const produtos = [
    // SCARPIN - 3 cores
    { codigo: 37201, corCode: 10, cor: 'PRETO',   descricao: 'SCARPIN NAPA MADRID 491002 DOLCCINI',       subgrupo: 'SCARPIN',    ref: '491002',     preco: 259.90, sizes: {34:1,35:3,36:4,37:3,38:2,39:1,40:0} },
    { codigo: 37201, corCode: 20, cor: 'NUDE',    descricao: 'SCARPIN NAPA MADRID 491002 DOLCCINI',       subgrupo: 'SCARPIN',    ref: '491002',     preco: 259.90, sizes: {34:2,35:3,36:5,37:4,38:2,39:1,40:0} },
    { codigo: 37201, corCode: 30, cor: 'VINHO',   descricao: 'SCARPIN NAPA MADRID 491002 DOLCCINI',       subgrupo: 'SCARPIN',    ref: '491002',     preco: 259.90, sizes: {34:0,35:1,36:2,37:2,38:1,39:0,40:0} },

    // MOCASSIM - 2 cores
    { codigo: 37202, corCode: 10, cor: 'PRETO',   descricao: 'MOCASSIM VERNIZ MOLHADO MK6483 D MATTHES', subgrupo: 'MOCASSIM',   ref: 'MK6483',     preco: 289.90, sizes: {34:2,35:3,36:4,37:3,38:2,39:1,40:0} },
    { codigo: 37202, corCode: 40, cor: 'DOURADO', descricao: 'MOCASSIM VERNIZ MOLHADO MK6483 D MATTHES', subgrupo: 'MOCASSIM',   ref: 'MK6483',     preco: 289.90, sizes: {34:1,35:2,36:3,37:2,38:1,39:0,40:0} },

    // SAPATILHA - 3 cores
    { codigo: 37203, corCode: 20, cor: 'NUDE',    descricao: 'SAPATILHA NAPA MADRID MK6457 FIORELLA',    subgrupo: 'SAPATILHA',  ref: 'MK6457',     preco: 149.90, sizes: {34:3,35:4,36:5,37:3,38:2,39:1,40:0} },
    { codigo: 37203, corCode: 10, cor: 'PRETA',   descricao: 'SAPATILHA NAPA MADRID MK6457 FIORELLA',    subgrupo: 'SAPATILHA',  ref: 'MK6457',     preco: 149.90, sizes: {34:2,35:3,36:3,37:2,38:1,39:0,40:0} },
    { codigo: 37203, corCode: 50, cor: 'BRANCA',  descricao: 'SAPATILHA NAPA MADRID MK6457 FIORELLA',    subgrupo: 'SAPATILHA',  ref: 'MK6457',     preco: 149.90, sizes: {34:1,35:2,36:3,37:2,38:0,39:0,40:0} },

    // RASTEIRA - 3 cores
    { codigo: 37210, corCode: 60, cor: 'CAMEL',     descricao: 'RASTEIRA TRASEIRO NAPA PE2363S EMP',       subgrupo: 'RASTEIRA',   ref: 'PE2363S',    preco: 99.90,  sizes: {33:1,34:3,35:5,36:4,37:3,38:2,39:0,40:0} },
    { codigo: 37210, corCode: 10, cor: 'PRETO',     descricao: 'RASTEIRA TRASEIRO NAPA PE2363S EMP',       subgrupo: 'RASTEIRA',   ref: 'PE2363S',    preco: 99.90,  sizes: {33:0,34:2,35:4,36:3,37:2,38:1,39:0,40:0} },
    { codigo: 37210, corCode: 70, cor: 'OFF-WHITE', descricao: 'RASTEIRA TRASEIRO NAPA PE2363S EMP',       subgrupo: 'RASTEIRA',   ref: 'PE2363S',    preco: 99.90,  sizes: {33:0,34:1,35:2,36:3,37:2,38:1,39:0,40:0} },

    // PAPETE - 2 cores
    { codigo: 37211, corCode: 10, cor: 'PRETO',     descricao: 'PAPETE NAPA ZX2350S EMP',                   subgrupo: 'PAPETE',     ref: 'ZX2350S',    preco: 169.90, sizes: {34:1,35:3,36:4,37:3,38:2,39:1,40:0} },
    { codigo: 37211, corCode: 80, cor: 'CARAMELO',  descricao: 'PAPETE NAPA ZX2350S EMP',                   subgrupo: 'PAPETE',     ref: 'ZX2350S',    preco: 169.90, sizes: {34:0,35:2,36:3,37:2,38:1,39:0,40:0} },

    // SANDALIA BAIXA - 3 cores
    { codigo: 37212, corCode: 20, cor: 'NUDE',      descricao: 'SANDALIA BAIXA NAPA 3172907 DAMA',         subgrupo: 'SANDALIA',   ref: '3172907',    preco: 149.90, sizes: {34:2,35:3,36:4,37:3,38:2,39:1,40:0} },
    { codigo: 37212, corCode: 10, cor: 'PRETO',     descricao: 'SANDALIA BAIXA NAPA 3172907 DAMA',         subgrupo: 'SANDALIA',   ref: '3172907',    preco: 149.90, sizes: {33:1,34:2,35:3,36:3,37:2,38:1,39:0,40:0} },
    { codigo: 37212, corCode: 40, cor: 'DOURADO',   descricao: 'SANDALIA BAIXA NAPA 3172907 DAMA',         subgrupo: 'SANDALIA',   ref: '3172907',    preco: 149.90, sizes: {34:1,35:2,36:2,37:1,38:0,39:0,40:0} },

    // TENIS NAPA - 2 cores
    { codigo: 37220, corCode: 50, cor: 'BRANCO',    descricao: 'TENIS NAPA CAMURCA MK6505 SAME',            subgrupo: 'TENIS',      ref: 'MK6505',     preco: 249.90, sizes: {34:2,35:4,36:5,37:3,38:2,39:1,40:0} },
    { codigo: 37220, corCode: 10, cor: 'PRETO',     descricao: 'TENIS NAPA CAMURCA MK6505 SAME',            subgrupo: 'TENIS',      ref: 'MK6505',     preco: 249.90, sizes: {33:1,34:2,35:3,36:4,37:3,38:1,39:0,40:0} },

    // TENIS KNIT - 3 cores
    { codigo: 37221, corCode: 90, cor: 'ROSA BALLET', descricao: 'TENIS KNIT 26171 THEORIA',                subgrupo: 'TENIS',      ref: '26171',      preco: 229.90, sizes: {34:3,35:5,36:6,37:4,38:3,39:1,40:0} },
    { codigo: 37221, corCode: 10, cor: 'PRETO',     descricao: 'TENIS KNIT 26171 THEORIA',                   subgrupo: 'TENIS',      ref: '26171',      preco: 229.90, sizes: {33:1,34:3,35:4,36:5,37:3,38:2,39:0,40:0} },
    { codigo: 37221, corCode: 50, cor: 'BRANCO',    descricao: 'TENIS KNIT 26171 THEORIA',                   subgrupo: 'TENIS',      ref: '26171',      preco: 229.90, sizes: {34:2,35:3,36:4,37:3,38:1,39:0,40:0} },

    // ANABELA
    { codigo: 37230, corCode: 80, cor: 'CARAMELO',  descricao: 'ANABELA NAPA RAFIA MK6459 JS MULLER',      subgrupo: 'ANABELA',    ref: 'MK6459',     preco: 299.90, sizes: {34:1,35:2,36:3,37:2,38:1,39:0,40:0} },

    // PLATAFORMA - 2 cores
    { codigo: 37231, corCode: 10, cor: 'PRETO',     descricao: 'PLATAFORMA CAMURCA MK6610 JS MULLER',      subgrupo: 'PLATAFORMA', ref: 'MK6610',     preco: 329.90, sizes: {35:2,36:3,37:3,38:2,39:1,40:0} },
    { codigo: 37231, corCode: 100, cor: 'MARROM',   descricao: 'PLATAFORMA CAMURCA MK6610 JS MULLER',      subgrupo: 'PLATAFORMA', ref: 'MK6610',     preco: 329.90, sizes: {34:1,35:2,36:2,37:2,38:1,39:0,40:0} },

    // MULE - 3 cores
    { codigo: 37232, corCode: 10, cor: 'PRETO',     descricao: 'MULE VERNIZ MOLHADO MK6502 JS MULLER',     subgrupo: 'MULE',       ref: 'MK6502',     preco: 219.90, sizes: {34:1,35:3,36:4,37:3,38:2,39:1,40:0} },
    { codigo: 37232, corCode: 20, cor: 'NUDE',      descricao: 'MULE VERNIZ MOLHADO MK6502 JS MULLER',     subgrupo: 'MULE',       ref: 'MK6502',     preco: 219.90, sizes: {34:2,35:3,36:3,37:2,38:1,39:0,40:0} },
    { codigo: 37232, corCode: 110, cor: 'VERMELHO', descricao: 'MULE VERNIZ MOLHADO MK6502 JS MULLER',     subgrupo: 'MULE',       ref: 'MK6502',     preco: 219.90, sizes: {35:1,36:2,37:2,38:1,39:0,40:0} },

    // TAMANCO - 2 cores
    { codigo: 37240, corCode: 120, cor: 'BEGE',     descricao: 'TAMANCO ALINE 6802967 DAMA',                subgrupo: 'TAMANCO',    ref: '6802967',    preco: 179.90, sizes: {35:1,36:2,37:2,38:1,39:0,40:0} },
    { codigo: 37240, corCode: 10, cor: 'PRETO',     descricao: 'TAMANCO ALINE 6802967 DAMA',                subgrupo: 'TAMANCO',    ref: '6802967',    preco: 179.90, sizes: {34:1,35:2,36:2,37:2,38:1,39:0,40:0} },

    // BOLSAS (tamanho U = unidade)
    { codigo: 48001, corCode: 10, cor: 'PRETA',     descricao: 'BOLSA COURO M COURO FLY 462 FEGALLY',       subgrupo: 'BOLSA', grupo: 'ACESSORIOS', grade: 'BOLSA UNICO', unidadeMedida: 'UN', ref: '462',       preco: 379.90, tipo: 'acessorio', unidade: 8, sizes: {} },
    { codigo: 48001, corCode: 60, cor: 'CAMEL',     descricao: 'BOLSA COURO M COURO FLY 462 FEGALLY',       subgrupo: 'BOLSA', grupo: 'ACESSORIOS', grade: 'BOLSA UNICO', unidadeMedida: 'UN', ref: '462',       preco: 379.90, tipo: 'acessorio', unidade: 5, sizes: {} },
    { codigo: 48001, corCode: 30, cor: 'VINHO',     descricao: 'BOLSA COURO M COURO FLY 462 FEGALLY',       subgrupo: 'BOLSA', grupo: 'ACESSORIOS', grade: 'BOLSA UNICO', unidadeMedida: 'UN', ref: '462',       preco: 379.90, tipo: 'acessorio', unidade: 2, sizes: {} },

    // CINTOS (tamanho P/M/G)
    { codigo: 55001, corCode: 10, cor: 'PRETO',     descricao: 'CINTO COURO SDP00013 LORENA',               subgrupo: 'CINTO', grupo: 'ACESSORIOS', grade: 'CINTO PMG', unidadeMedida: 'UN', ref: 'SDP00013', preco: 129.90, sizes: {P:4,M:6,G:3} },
    { codigo: 55001, corCode: 100, cor: 'MARROM',   descricao: 'CINTO COURO SDP00013 LORENA',               subgrupo: 'CINTO', grupo: 'ACESSORIOS', grade: 'CINTO PMG', unidadeMedida: 'UN', ref: 'SDP00013', preco: 129.90, sizes: {P:2,M:4,G:2} },

    // CARTEIRAS (U)
    { codigo: 65001, corCode: 10, cor: 'PRETA',     descricao: 'CARTEIRA COURO SH438 MARJU',                subgrupo: 'CARTEIRA', grupo: 'ACESSORIOS', grade: 'CARTEIRA UNICO', unidadeMedida: 'UN', ref: 'SH438', preco: 149.90, tipo: 'acessorio', unidade: 12, sizes: {} },
    { codigo: 65001, corCode: 60, cor: 'CAMEL',     descricao: 'CARTEIRA COURO SH438 MARJU',                subgrupo: 'CARTEIRA', grupo: 'ACESSORIOS', grade: 'CARTEIRA UNICO', unidadeMedida: 'UN', ref: 'SH438', preco: 149.90, tipo: 'acessorio', unidade: 8, sizes: {} },
    { codigo: 65001, corCode: 30, cor: 'VINHO',     descricao: 'CARTEIRA COURO SH438 MARJU',                subgrupo: 'CARTEIRA', grupo: 'ACESSORIOS', grade: 'CARTEIRA UNICO', unidadeMedida: 'UN', ref: 'SH438', preco: 149.90, tipo: 'acessorio', unidade: 3, sizes: {} },
];

const outputPath = path.join(__dirname, '..', 'produtos.csv');
const lines = [buildHeader()];
produtos.forEach(p => lines.push(buildRow(p)));
fs.writeFileSync(outputPath, lines.join('\n') + '\n', 'utf8');

console.log(`Gerado produtos.csv com ${produtos.length} linhas e ${buildHeader().split(',').length} colunas`);
console.log(`Caminho: ${outputPath}`);
