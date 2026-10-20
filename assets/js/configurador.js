/* ==================================================================
   A VALORIZA SOFÁ — configurador.js · "Monte seu atendimento"
   ------------------------------------------------------------------
   Vanilla JS. Não calcula valores: organiza o pedido e gera a
   mensagem para o WhatsApp.
   Etapas: 1 Serviço · 2 Características · 3 Condições · 4 Local · 5 Resumo
   - Esquema de campos declarado em SERVICOS / CONDICOES / LOCAL.
   - Vários serviços no mesmo atendimento (cada um com suas condições).
   - Respostas preservadas ao voltar (sessionStorage).
   - Sem ícones: apenas tipografia, bordas e estados.
   ================================================================== */
(function () {
  'use strict';

  var raiz = document.querySelector('[data-config]');
  if (!raiz) return;

  var painel = raiz.querySelector('[data-config-painel]');
  var progresso = raiz.querySelector('[data-config-progresso]');
  var lateral = raiz.querySelector('[data-config-lateral]');
  var NUMERO = (document.body.getAttribute('data-wa-numero') || '').replace(/\D/g, '');
  var CHAVE = 'avs-atendimento-v1';
  var ETAPAS = ['Serviço', 'Características', 'Condições', 'Local', 'Resumo'];

  /* ----------------------------------------------------------------
     ESQUEMA
     ---------------------------------------------------------------- */
  var LUGARES = [['2', '2 lugares'], ['3', '3 lugares'], ['4', '4 lugares'], ['5+', '5 ou mais lugares']];

  var SERVICOS = {
    sofa: {
      opcao: 'Sofá', desc: 'Tradicional, retrátil, reclinável ou de canto',
      nome: 'Higienização de sofá', pergunta: 'Conte um pouco sobre o sofá',
      campos: [
        { id: 'lugares', rotulo: 'Quantos lugares?', tipo: 'radio', obrig: true, opcoes: LUGARES },
        { id: 'caract', rotulo: 'Características', dica: 'Opcional. Marque todas que se aplicam.', tipo: 'checkbox', opcoes: [['retratil', 'Retrátil'], ['reclinavel', 'Reclinável'], ['canto', 'Sofá de canto']] },
        { id: 'medidas', rotulo: 'Medidas aproximadas', dica: 'Opcional. Ajuda em sofás de canto e modelos grandes.', tipo: 'texto', placeholder: 'Ex.: 2,60 m × 1,80 m' },
      ],
      curto: function (v) { return 'Sofá' + (v.lugares ? ' · ' + rot(this.campos, 'lugares', v.lugares) : ''); },
    },
    colchao: {
      opcao: 'Colchão', desc: 'Solteiro, casal, queen ou king',
      nome: 'Higienização de colchão', pergunta: 'Qual é o tamanho do colchão?',
      campos: [
        { id: 'tamanho', rotulo: 'Tamanho', tipo: 'radio', obrig: true, opcoes: [['solteiro', 'Solteiro'], ['casal', 'Casal'], ['queen', 'Queen'], ['king', 'King']] },
        { id: 'qtd', rotulo: 'Quantidade de colchões', tipo: 'numero', min: 1, max: 10, padrao: 1 },
      ],
      curto: function (v) { return 'Colchão' + (v.tamanho ? ' ' + rot(this.campos, 'tamanho', v.tamanho).toLowerCase() : ''); },
    },
    poltrona: {
      opcao: 'Poltrona', desc: 'Decorativa, reclinável ou de amamentação',
      nome: 'Higienização de poltrona', pergunta: 'Quantas poltronas?',
      campos: [{ id: 'qtd', rotulo: 'Quantidade de poltronas', tipo: 'numero', min: 1, max: 30, padrao: 1 }],
      curto: function (v) { return v.qtd > 1 ? v.qtd + ' poltronas' : 'Poltrona'; },
    },
    cadeiras: {
      opcao: 'Cadeiras', desc: 'De jantar, escritório ou banquetas',
      nome: 'Higienização de cadeiras', pergunta: 'Quantas cadeiras?',
      campos: [{ id: 'qtd', rotulo: 'Quantidade de cadeiras', tipo: 'numero', min: 1, max: 80, padrao: 4 }],
      curto: function (v) { return (v.qtd || '') + ' cadeiras'; },
    },
    automotiva: {
      opcao: 'Interior de veículo', desc: 'Bancos, teto e carpete',
      nome: 'Higienização interna de veículo', pergunta: 'Quais áreas do veículo?',
      campos: [
        { id: 'areas', rotulo: 'Áreas a higienizar', dica: 'Marque uma ou mais áreas, ou a higienização interna completa.', tipo: 'checkbox', obrig: true, exclusivos: { completa: '*' }, opcoes: [['bancos', 'Bancos'], ['teto', 'Teto'], ['carpete', 'Carpete'], ['completa', 'Higienização interna completa']] },
      ],
      curto: function (v) { return 'Veículo' + (v.areas && v.areas.length ? ' · ' + rot(this.campos, 'areas', v.areas).toLowerCase() : ''); },
    },
    impermeabilizacao: {
      opcao: 'Impermeabilização de estofados', desc: 'Proteção aplicada sobre o tecido limpo',
      nome: 'Impermeabilização de estofados', pergunta: 'O que você quer impermeabilizar?',
      campos: [
        { id: 'peca', rotulo: 'Estofado', tipo: 'radio', obrig: true, opcoes: [['sofa', 'Sofá'], ['poltrona', 'Poltrona'], ['cadeiras', 'Cadeiras'], ['outro', 'Outro estofado (sujeito à confirmação)']] },
        { id: 'lugares', rotulo: 'Quantos lugares tem o sofá?', tipo: 'radio', obrig: true, opcoes: LUGARES, se: function (v) { return v.peca === 'sofa'; } },
        { id: 'descricao', rotulo: 'Qual estofado?', tipo: 'texto', obrig: true, placeholder: 'Ex.: recamier, banco de cozinha, puff', se: function (v) { return v.peca === 'outro'; } },
        { id: 'qtd', rotulo: 'Quantidade', tipo: 'numero', min: 1, max: 80, padrao: 1, se: function (v) { return v.peca && v.peca !== 'sofa'; } },
        { id: 'medidas', rotulo: 'Medidas aproximadas', dica: 'Opcional.', tipo: 'texto', placeholder: 'Ex.: 2,20 m × 0,90 m', se: function (v) { return v.peca === 'sofa' || v.peca === 'outro'; } },
      ],
      curto: function (v) { return 'Impermeabilização' + (v.peca ? ' · ' + rot(this.campos, 'peca', v.peca).replace(' (sujeito à confirmação)', '').toLowerCase() : ''); },
    },
  };
  var ORDEM = ['sofa', 'colchao', 'poltrona', 'cadeiras', 'automotiva', 'impermeabilizacao'];

  var CONDICOES = [
    { id: 'condicao', rotulo: 'Situação atual', tipo: 'checkbox', obrig: true, oculto: true,
      dica: 'Marque o que se aplica. Manchas e odores são avaliados no atendimento. A remoção completa não pode ser garantida.',
      exclusivos: { 'nao-sei': '*', leve: ['moderada'], moderada: ['leve'] },
      opcoes: [['leve', 'Sujeira leve'], ['moderada', 'Sujeira moderada'], ['manchas', 'Manchas visíveis'], ['odor', 'Odor persistente'], ['nao-sei', 'Não sei avaliar']] },
    { id: 'adicional', rotulo: 'Deseja incluir impermeabilização após a higienização?', tipo: 'radio', padrao: 'nao',
      opcoes: [['sim', 'Sim, incluir'], ['nao', 'Não'], ['saber', 'Quero saber mais']],
      se: function (v, s) { return s === 'sofa' || s === 'poltrona' || s === 'cadeiras' || s === 'automotiva'; } },
    { id: 'obs', rotulo: 'Observações', dica: 'Opcional.', tipo: 'area', placeholder: 'Ex.: mancha de café no braço, tecido claro, regras do condomínio…' },
  ];

  var LOCAL = [
    { id: 'cidade', rotulo: 'Cidade', tipo: 'radio', obrig: true, oculto: true,
      opcoes: [['São José dos Campos', 'São José dos Campos'], ['Jacareí', 'Jacareí'], ['outra', 'Outra cidade do Vale do Paraíba']] },
    { id: 'municipio', rotulo: 'Qual município?', tipo: 'texto', obrig: true, placeholder: 'Ex.: Caçapava', se: function (v) { return v.cidade === 'outra'; },
      dica: 'Atendemos outras cidades do Vale mediante confirmação de disponibilidade.' },
  ];

  /* ----------------------------------------------------------------
     ESTADO
     ---------------------------------------------------------------- */
  function novoItem(s) { return { servico: s || null, v: {}, c: {} }; }
  function novoEstado() { return { etapa: 1, itens: [], atual: novoItem(), editando: null, local: {} }; }
  function carregar() { try { var s = JSON.parse(sessionStorage.getItem(CHAVE)); return s && s.atual && s.local ? s : null; } catch (e) { return null; } }
  function salvar() { try { sessionStorage.setItem(CHAVE, JSON.stringify(st)); } catch (e) { /* armazenamento indisponível */ } }
  var st = carregar() || novoEstado();

  /* ----------------------------------------------------------------
     UTILITÁRIOS
     ---------------------------------------------------------------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function def(lista, id) { for (var i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i]; }
  function rot(lista, id, valor) {
    var c = def(lista, id);
    if (!c || !c.opcoes) return valor;
    return [].concat(valor).map(function (x) {
      for (var i = 0; i < c.opcoes.length; i++) if (c.opcoes[i][0] === x) return c.opcoes[i][1];
      return x;
    }).join(', ');
  }
  function vis(c, v, s) { return !c.se || c.se(v, s); }
  function vazio(x) { return x == null || x === '' || (Array.isArray(x) && !x.length); }
  function padroes(lista, alvo) { lista.forEach(function (c) { if (alvo[c.id] === undefined && c.padrao !== undefined) alvo[c.id] = c.padrao; }); }
  function juntar(arr) { return arr.length > 1 ? arr.slice(0, -1).join(', ') + ' e ' + arr[arr.length - 1] : arr.join(''); }

  /* ----------------------------------------------------------------
     CAMPOS
     ---------------------------------------------------------------- */
  function campo(c, valores, grupo) {
    var nome = grupo + '.' + c.id;
    var id = 'cf-' + grupo + '-' + c.id;
    var val = valores[c.id];
    var dica = c.dica ? '<p class="cf-dica" id="' + id + '-d">' + esc(c.dica) + '</p>' : '';
    var desc = c.dica ? ' aria-describedby="' + id + '-d"' : '';
    if (c.tipo === 'radio' || c.tipo === 'checkbox') {
      var marc = [].concat(val || []);
      return '<fieldset class="cf-campo" data-campo="' + c.id + '"' + desc + '>' +
        '<legend class="' + (c.oculto ? 'sr' : 'cf-rotulo') + '">' + esc(c.rotulo) + '</legend>' + dica +
        '<div class="cf-opcoes cf-opcoes--' + c.tipo + '">' +
        c.opcoes.map(function (o) {
          return '<label class="cf-opcao"><input type="' + c.tipo + '" name="' + nome + '" value="' + esc(o[0]) + '"' + (marc.indexOf(o[0]) > -1 ? ' checked' : '') + '><span>' + esc(o[1]) + '</span></label>';
        }).join('') + '</div></fieldset>';
    }
    var rotulo = '<label class="cf-rotulo" for="' + id + '">' + esc(c.rotulo) + '</label>';
    if (c.tipo === 'numero') {
      return '<div class="cf-campo" data-campo="' + c.id + '">' + rotulo + dica +
        '<input class="cf-input cf-input--num" id="' + id + '" name="' + nome + '" type="number" inputmode="numeric" min="' + c.min + '" max="' + c.max + '" value="' + esc(val || c.padrao || 1) + '"' + desc + '></div>';
    }
    if (c.tipo === 'area') {
      return '<div class="cf-campo" data-campo="' + c.id + '">' + rotulo + dica +
        '<textarea class="cf-input" id="' + id + '" name="' + nome + '" rows="3" placeholder="' + esc(c.placeholder || '') + '"' + desc + '>' + esc(val || '') + '</textarea></div>';
    }
    return '<div class="cf-campo" data-campo="' + c.id + '">' + rotulo + dica +
      '<input class="cf-input" id="' + id + '" name="' + nome + '" type="text" value="' + esc(val || '') + '" placeholder="' + esc(c.placeholder || '') + '"' + desc + '></div>';
  }

  function ler(prefixo, lista, alvo) {
    lista.forEach(function (c) {
      var n = prefixo + '.' + c.id;
      if (c.tipo === 'checkbox') {
        alvo[c.id] = [].map.call(painel.querySelectorAll('[name="' + n + '"]:checked'), function (x) { return x.value; });
      } else if (c.tipo === 'radio') {
        var r = painel.querySelector('[name="' + n + '"]:checked');
        if (r) alvo[c.id] = r.value;
      } else {
        var el = painel.querySelector('[name="' + n + '"]');
        if (!el) return;
        if (c.tipo === 'numero') {
          var num = parseInt(el.value, 10);
          alvo[c.id] = isNaN(num) ? '' : Math.max(c.min, Math.min(c.max, num));
        } else alvo[c.id] = el.value.trim();
      }
    });
  }

  function validar(lista, valores, s) {
    for (var i = 0; i < lista.length; i++) {
      var c = lista[i];
      if (vis(c, valores, s) && c.tipo === 'numero' && vazio(valores[c.id])) return { c: c, msg: 'Informe a quantidade.' };
      if (c.obrig && vis(c, valores, s) && vazio(valores[c.id])) return { c: c, msg: c.tipo === 'checkbox' || c.tipo === 'radio' ? 'Escolha uma opção para continuar.' : 'Preencha este campo para continuar.' };
    }
    return null;
  }

  function visibilidade(lista, valores, s) {
    lista.forEach(function (c) {
      var el = painel.querySelector('[data-campo="' + c.id + '"]');
      if (el) el.hidden = !vis(c, valores, s);
    });
  }

  /* ----------------------------------------------------------------
     RESUMO DE ITENS
     ---------------------------------------------------------------- */
  function linhas(it) {
    var sv = SERVICOS[it.servico], out = [], v = it.v, c = it.c;
    if (it.servico === 'sofa') {
      if (v.lugares) out.push(['Tamanho', rot(sv.campos, 'lugares', v.lugares)]);
      if (v.caract && v.caract.length) out.push(['Características', rot(sv.campos, 'caract', v.caract)]);
      if (v.medidas) out.push(['Medidas', v.medidas]);
    } else if (it.servico === 'colchao') {
      if (v.tamanho) out.push(['Tamanho', rot(sv.campos, 'tamanho', v.tamanho)]);
      if (v.qtd) out.push(['Quantidade', String(v.qtd)]);
    } else if (it.servico === 'poltrona' || it.servico === 'cadeiras') {
      out.push(['Quantidade', String(v.qtd)]);
    } else if (it.servico === 'automotiva') {
      if (v.areas) out.push(['Áreas', rot(sv.campos, 'areas', v.areas)]);
    } else if (it.servico === 'impermeabilizacao') {
      var peca = v.peca === 'outro' ? (v.descricao || 'Outro estofado') + ' (sujeito à confirmação)' : rot(sv.campos, 'peca', v.peca);
      out.push(['Estofado', peca]);
      if (v.peca === 'sofa' && v.lugares) out.push(['Tamanho', rot(sv.campos, 'lugares', v.lugares)]);
      if (v.peca && v.peca !== 'sofa' && v.qtd) out.push(['Quantidade', String(v.qtd)]);
      if (v.medidas) out.push(['Medidas', v.medidas]);
    }
    if (c.condicao && c.condicao.length) {
      var lista = c.condicao.map(function (x) { return rot(CONDICOES, 'condicao', x); });
      lista = lista.map(function (x, i) { return i ? x.charAt(0).toLowerCase() + x.slice(1) : x; });
      out.push(['Condição', juntar(lista)]);
    }
    if (vis(def(CONDICOES, 'adicional'), c, it.servico)) {
      if (c.adicional === 'sim') out.push(['Adicional', 'Impermeabilização']);
      if (c.adicional === 'saber') out.push(['Adicional', 'Quer saber mais sobre impermeabilização']);
    }
    if (c.obs) out.push(['Observações', c.obs]);
    return out;
  }

  function cidadeTexto() {
    var l = st.local;
    if (!l.cidade) return '';
    return l.cidade === 'outra' ? (l.municipio || 'Outra cidade') + ' (Vale do Paraíba, a confirmar)' : l.cidade;
  }

  function mensagem() {
    var L = ['Olá, A Valoriza Sofá! Vim pelo site e gostaria de solicitar um atendimento:', ''];
    st.itens.forEach(function (it, i) {
      L.push('*' + (st.itens.length > 1 ? (i + 1) + '. ' : '') + SERVICOS[it.servico].nome + '*');
      linhas(it).forEach(function (l) { L.push('• ' + l[0] + ': ' + l[1]); });
      L.push('');
    });
    if (st.local.cidade) L.push('*Cidade:* ' + cidadeTexto(), '');
    L.push('Posso enviar fotos dos estofados, se ajudar na avaliação.');
    return L.join('\n');
  }

  function linkWhats() {
    var base = NUMERO ? 'https://wa.me/' + NUMERO : 'https://wa.me/';
    return base + '?text=' + encodeURIComponent(mensagem());
  }

  /* ----------------------------------------------------------------
     RENDERIZAÇÃO
     ---------------------------------------------------------------- */
  function navegacao(voltar, avancar) {
    return '<div class="cf-nav">' +
      (voltar ? '<button type="button" class="cf-btn cf-btn--texto" data-acao="voltar">' + esc(voltar) + '</button>' : '<span></span>') +
      (avancar ? '<button type="submit" class="cf-btn cf-btn--primario">' + esc(avancar) + '</button>' : '') +
      '</div><p class="cf-erro" data-erro role="alert" aria-live="assertive"></p>';
  }

  function render(focar) {
    var e = st.etapa, it = st.atual, sv = it.servico && SERVICOS[it.servico], h = '';

    if (e === 1) {
      h = '<fieldset class="cf-passo"><legend class="cf-titulo">O que você deseja higienizar?</legend>' +
        '<p class="cf-sub">Escolha um serviço. Ao final, você pode adicionar outros ao mesmo atendimento.</p>' +
        '<div class="cf-servicos">' + ORDEM.map(function (k) {
          var s = SERVICOS[k];
          return '<label class="cf-servico"><input type="radio" name="servico" value="' + k + '"' + (it.servico === k ? ' checked' : '') + '>' +
            '<span class="cf-servico__t">' + esc(s.opcao) + '</span><span class="cf-servico__d">' + esc(s.desc) + '</span></label>';
        }).join('') + '</div></fieldset>' +
        navegacao(st.itens.length ? 'Voltar ao resumo' : null, 'Continuar');
    }

    if (e === 2) {
      padroes(sv.campos, it.v);
      h = '<div class="cf-passo"><p class="cf-contexto">' + esc(sv.nome) + '</p><h2 class="cf-titulo">' + esc(sv.pergunta) + '</h2>' +
        sv.campos.map(function (c) { return campo(c, it.v, 'v'); }).join('') + '</div>' +
        navegacao('Voltar', 'Continuar');
    }

    if (e === 3) {
      padroes(CONDICOES, it.c);
      h = '<div class="cf-passo"><p class="cf-contexto">' + esc(sv.curto.call(sv, it.v)) + '</p><h2 class="cf-titulo">Como está o estofado atualmente?</h2>' +
        CONDICOES.map(function (c) { return campo(c, it.c, 'c'); }).join('') + '</div>' +
        navegacao('Voltar', st.editando !== null ? 'Salvar alterações' : 'Continuar');
    }

    if (e === 4) {
      h = '<div class="cf-passo"><h2 class="cf-titulo">Onde o serviço será realizado?</h2>' +
        '<p class="cf-sub">O atendimento é feito no seu endereço.</p>' +
        LOCAL.map(function (c) { return campo(c, st.local, 'l'); }).join('') + '</div>' +
        navegacao('Voltar', 'Ver resumo');
    }

    if (e === 5) {
      h = '<div class="cf-passo"><h2 class="cf-titulo">Seu atendimento</h2>' +
        '<div class="cf-resumo">' + st.itens.map(function (it, i) {
          var s = SERVICOS[it.servico];
          return '<article class="cf-item"><header class="cf-item__cab"><h3>' + esc(s.nome) + '</h3>' +
            '<div class="cf-item__acoes"><button type="button" class="cf-link" data-acao="editar" data-i="' + i + '">Editar</button>' +
            '<button type="button" class="cf-link cf-link--suave" data-acao="remover" data-i="' + i + '">Remover</button></div></header>' +
            '<dl>' + linhas(it).map(function (l) { return '<div><dt>' + esc(l[0]) + '</dt><dd>' + esc(l[1]) + '</dd></div>'; }).join('') + '</dl></article>';
        }).join('') +
        '<button type="button" class="cf-adicionar" data-acao="adicionar">Adicionar outro serviço</button>' +
        '<div class="cf-cidade"><div><span>Cidade</span><strong>' + esc(cidadeTexto()) + '</strong></div><button type="button" class="cf-link" data-acao="cidade">Alterar</button></div>' +
        '</div>' +
        '<p class="cf-aviso">O valor e a disponibilidade serão confirmados após a avaliação das informações pela nossa equipe.</p>' +
        '<div class="cf-final"><a class="cf-btn cf-btn--wa" href="' + esc(linkWhats()) + '" target="_blank" rel="noopener" data-enviar>Enviar solicitação pelo WhatsApp</a>' +
        '<button type="button" class="cf-btn cf-btn--texto" data-acao="voltar">Voltar</button></div>' +
        '</div>';
    }

    painel.innerHTML = '<form class="cf-form" data-cf-form novalidate>' + h + '</form>';
    if (e === 2) visibilidade(sv.campos, it.v, it.servico);
    if (e === 3) visibilidade(CONDICOES, it.c, it.servico);
    if (e === 4) visibilidade(LOCAL, st.local);
    pintarProgresso();
    pintarLateral();
    salvar();

    if (focar) {
      var t = painel.querySelector('.cf-titulo');
      if (t) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
      var topo = raiz.getBoundingClientRect().top + window.scrollY - 90;
      if (window.scrollY > topo) window.scrollTo({ top: topo, behavior: 'smooth' });
    }
  }

  function pintarProgresso() {
    var e = st.etapa;
    progresso.setAttribute('aria-valuenow', String(e));
    progresso.setAttribute('aria-valuetext', 'Etapa ' + e + ' de 5: ' + ETAPAS[e - 1]);
    progresso.innerHTML = '<div class="cf-prog__barra"><i style="width:' + (e / 5) * 100 + '%"></i></div>' +
      '<p class="cf-prog__texto"><span>Etapa ' + e + ' de 5</span>' + esc(ETAPAS[e - 1]) + '</p>';
  }

  function pintarLateral() {
    var itens = st.itens.map(function (it, i) {
      var s = SERVICOS[it.servico];
      return '<li' + (st.editando === i ? ' class="editando"' : '') + '><strong>' + esc(s.curto.call(s, it.v)) + '</strong>' +
        '<span>' + esc((it.c.condicao || []).map(function (x) { return rot(CONDICOES, 'condicao', x); }).join(' · ')) + '</span></li>';
    });
    if (st.atual.servico && st.editando === null && st.etapa > 1 && st.etapa < 4) {
      var s = SERVICOS[st.atual.servico];
      itens.push('<li class="rascunho"><strong>' + esc(s.curto.call(s, st.atual.v)) + '</strong><span>Em preenchimento</span></li>');
    }
    lateral.innerHTML = '<p class="cf-lateral__t">Seu atendimento</p>' +
      (itens.length ? '<ol>' + itens.join('') + '</ol>' : '<p class="cf-lateral__vazio">Os serviços escolhidos aparecem aqui.</p>') +
      (st.local.cidade ? '<p class="cf-lateral__cidade">' + esc(cidadeTexto()) + '</p>' : '');
  }

  /* ----------------------------------------------------------------
     NAVEGAÇÃO
     ---------------------------------------------------------------- */
  function erro(r) {
    var el = painel.querySelector('[data-erro]');
    if (el) el.textContent = r ? r.msg : '';
    if (!r) return;
    var bloco = painel.querySelector('[data-campo="' + r.c.id + '"]');
    if (bloco) {
      bloco.classList.add('cf-campo--erro');
      var f = bloco.querySelector('input, textarea');
      if (f) f.focus();
    }
  }

  function exclusividade(lista, alvo) {
    var g = alvo.name.split('.'), c = def(lista, g[1]);
    if (!c || !c.exclusivos || !alvo.checked) return;
    var regra = c.exclusivos[alvo.value];
    painel.querySelectorAll('[name="' + alvo.name + '"]').forEach(function (x) {
      if (x === alvo) return;
      var deOutro = c.exclusivos[x.value];
      if (regra === '*' || deOutro === '*' || (regra && regra.indexOf(x.value) > -1)) x.checked = false;
    });
  }

  function listaDaEtapa() {
    if (st.etapa === 2) return { lista: SERVICOS[st.atual.servico].campos, alvo: st.atual.v, p: 'v' };
    if (st.etapa === 3) return { lista: CONDICOES, alvo: st.atual.c, p: 'c' };
    if (st.etapa === 4) return { lista: LOCAL, alvo: st.local, p: 'l' };
    return null;
  }

  function lerEtapa() { var d = listaDaEtapa(); if (d) ler(d.p, d.lista, d.alvo); return d; }

  function avancar() {
    var it = st.atual;
    if (st.etapa === 1) {
      if (!it.servico) { erro({ c: { id: 'servico' }, msg: 'Escolha um serviço para continuar.' }); return; }
      st.etapa = 2;
    } else if (st.etapa === 2 || st.etapa === 3 || st.etapa === 4) {
      var d = lerEtapa(), r = validar(d.lista, d.alvo, it.servico);
      if (r) { erro(r); return; }
      if (st.etapa === 2) st.etapa = 3;
      else if (st.etapa === 3) {
        // remove respostas de campos ocultos e grava o item
        SERVICOS[it.servico].campos.forEach(function (c) { if (!vis(c, it.v, it.servico)) delete it.v[c.id]; });
        CONDICOES.forEach(function (c) { if (!vis(c, it.c, it.servico)) delete it.c[c.id]; });
        var editando = st.editando !== null;
        if (editando) st.itens[st.editando] = it; else st.itens.push(it);
        st.atual = novoItem(); st.editando = null;
        st.etapa = st.local.cidade ? 5 : 4;
      } else {
        if (st.local.cidade !== 'outra') delete st.local.municipio;
        st.etapa = 5;
      }
    }
    render(true);
  }

  function voltar() {
    if (st.etapa === 1) { st.atual = novoItem(); st.editando = null; st.etapa = 5; }
    else if (st.etapa === 2 || st.etapa === 3) { lerEtapa(); st.etapa -= 1; }
    else if (st.etapa === 4) {
      lerEtapa();
      var ult = st.itens.length - 1;
      st.atual = JSON.parse(JSON.stringify(st.itens[ult])); st.editando = ult; st.etapa = 3;
    } else if (st.etapa === 5) st.etapa = 4;
    render(true);
  }

  painel.addEventListener('submit', function (e) { e.preventDefault(); avancar(); });

  painel.addEventListener('change', function (e) {
    var t = e.target, it = st.atual;
    if (t.name === 'servico') {
      if (it.servico !== t.value) { it.servico = t.value; it.v = {}; it.c = {}; }
      erro(null); pintarLateral(); salvar(); return;
    }
    var d = listaDaEtapa();
    if (!d) return;
    if (t.type === 'checkbox') exclusividade(d.lista, t);
    ler(d.p, d.lista, d.alvo);
    visibilidade(d.lista, d.alvo, it.servico);
    var bloco = t.closest('.cf-campo');
    if (bloco) bloco.classList.remove('cf-campo--erro');
    erro(null); pintarLateral(); salvar();
  });

  painel.addEventListener('input', function (e) {
    if (e.target.matches('.cf-input')) { var d = listaDaEtapa(); if (d) { ler(d.p, d.lista, d.alvo); salvar(); } }
  });

  // Seleção de serviço por clique avança sozinha (teclado usa "Continuar")
  painel.addEventListener('click', function (e) {
    var op = e.target.closest('.cf-servico');
    if (op && e.detail > 0 && st.etapa === 1) setTimeout(function () { if (st.atual.servico) { st.etapa = 2; render(true); } }, 220);
    var b = e.target.closest('[data-acao]');
    if (!b) return;
    var a = b.getAttribute('data-acao'), i = parseInt(b.getAttribute('data-i'), 10);
    if (a === 'voltar') voltar();
    if (a === 'adicionar') { st.atual = novoItem(); st.editando = null; st.etapa = 1; render(true); }
    if (a === 'editar') { st.atual = JSON.parse(JSON.stringify(st.itens[i])); st.editando = i; st.etapa = 2; render(true); }
    if (a === 'remover') {
      st.itens.splice(i, 1);
      if (!st.itens.length) { st.etapa = 1; st.atual = novoItem(); }
      render(true);
    }
    if (a === 'cidade') { st.etapa = 4; render(true); }
  });

  /* ----------------------------------------------------------------
     INÍCIO — ?servico=sofa pré-seleciona e abre a etapa 2
     ---------------------------------------------------------------- */
  var pre = new URLSearchParams(location.search).get('servico');
  if (pre && SERVICOS[pre] && st.editando === null && st.etapa <= 2) {
    if (st.atual.servico !== pre) st.atual = novoItem(pre);
    st.etapa = 2;
    history.replaceState(null, '', location.pathname);
  }
  if (st.etapa > 1 && st.etapa < 4 && !st.atual.servico) st.etapa = st.itens.length ? 5 : 1;
  if (st.etapa >= 4 && !st.itens.length) st.etapa = 1;
  if (st.etapa === 5 && !st.local.cidade) st.etapa = 4;
  render(false);
})();
