/* ==================================================================
   A VALORIZA SOFÁ — main.js (Vanilla JS, sem dependências)
   Cabeçalho, menu mobile, revelação ao rolar,
   índice da página, formulário de contato → WhatsApp.
   ================================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;

  /* Visualização local (arquivo aberto direto do disco): links de pasta
     apontam para o index.html. Não afeta o site publicado. */
  if (location.protocol === 'file:') {
    document.querySelectorAll('a[href]').forEach(function (a) {
      var h = a.getAttribute('href');
      if (/^\.{0,2}\/?([^:?#]*\/)?(\?[^#]*)?(#.*)?$/.test(h) && !/^#/.test(h)) {
        a.setAttribute('href', h.replace(/^([^?#]*\/)(?=[?#]|$)/, '$1index.html'));
      }
    });
  }
  var reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Cabeçalho: fundo ao rolar ------------------------------------- */
  var topo = document.querySelector('[data-topo]');
  var ultimoY = 0;
  function aoRolar() {
    var y = window.scrollY;
    if (topo) topo.classList.toggle('rolado', y > 8);
    ultimoY = y;
  }
  window.addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();

  /* Menu mobile ---------------------------------------------------- */
  var botaoMenu = document.querySelector('[data-abre-menu]');
  function fechaMenu() {
    doc.classList.remove('menu-aberto');
    if (botaoMenu) {
      botaoMenu.setAttribute('aria-expanded', 'false');
      botaoMenu.querySelector('.sr').textContent = 'Abrir menu';
    }
  }
  if (botaoMenu) {
    botaoMenu.addEventListener('click', function () {
      var aberto = doc.classList.toggle('menu-aberto');
      botaoMenu.setAttribute('aria-expanded', String(aberto));
      botaoMenu.querySelector('.sr').textContent = aberto ? 'Fechar menu' : 'Abrir menu';
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && doc.classList.contains('menu-aberto')) { fechaMenu(); botaoMenu.focus(); }
    });
    var celular = window.matchMedia('(max-width: 1020px)');
    // No celular, Serviços e Regiões abrem/fecham como sanfona (o link geral fica dentro da lista)
    document.querySelectorAll('[data-menu] .nav__item--sub > .nav__link').forEach(function (link) {
      link.setAttribute('aria-expanded', 'false');
      link.addEventListener('click', function (e) {
        if (!celular.matches) return;
        e.preventDefault();
        var item = link.parentNode;
        var abrir = !item.classList.contains('aberto');
        item.classList.toggle('aberto', abrir);
        link.setAttribute('aria-expanded', String(abrir));
      });
    });
    document.querySelectorAll('[data-menu] a').forEach(function (a) {
      a.addEventListener('click', function () {
        if (celular.matches && a.matches('.nav__item--sub > .nav__link')) return;
        fechaMenu();
      });
    });
    celular.addEventListener('change', function (m) { if (!m.matches) fechaMenu(); });
  }

  /* Revelação ao rolar -------------------------------------------- */
  var revelaveis = document.querySelectorAll('[data-revela]');
  if ('IntersectionObserver' in window && !reduzMovimento) {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('visivel'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revelaveis.forEach(function (el) { io.observe(el); });
  } else {
    revelaveis.forEach(function (el) { el.classList.add('visivel'); });
  }

  /* Comparação antes/depois (hero) ------------------------------ */
  var tecido = document.querySelector('[data-tecido]');
  if (tecido) {
    var range = tecido.querySelector('[data-tecido-range]');
    var aplica = function (v) { tecido.classList.add('interagiu'); tecido.style.setProperty('--pos', v + '%'); };
    range.addEventListener('input', function () { aplica(range.value); });
    var arrastando = false;
    var pos = function (e) {
      var r = tecido.getBoundingClientRect();
      var p = Math.max(4, Math.min(96, ((e.clientX - r.left) / r.width) * 100));
      range.value = p;
      aplica(p.toFixed(1));
    };
    tecido.addEventListener('pointerdown', function (e) { arrastando = true; pos(e); });
    window.addEventListener('pointermove', function (e) { if (arrastando) pos(e); });
    window.addEventListener('pointerup', function () { arrastando = false; });
  }

  /* Faixa de cards de serviços: setas avançam um card por vez ------ */
  document.querySelectorAll('[data-trilho]').forEach(function (trilho) {
    var secao = trilho.closest('section') || document;
    var ant = secao.querySelector('[data-trilho-ant]');
    var prox = secao.querySelector('[data-trilho-prox]');
    var passo = function () { var c = trilho.querySelector('li'); return c ? c.getBoundingClientRect().width + 16 : 320; };
    var estado = function () {
      if (ant) ant.disabled = trilho.scrollLeft < 8;
      if (prox) prox.disabled = trilho.scrollLeft + trilho.clientWidth >= trilho.scrollWidth - 8;
    };
    if (ant) ant.addEventListener('click', function () { trilho.scrollBy({ left: -passo(), behavior: reduzMovimento ? 'auto' : 'smooth' }); });
    if (prox) prox.addEventListener('click', function () { trilho.scrollBy({ left: passo(), behavior: reduzMovimento ? 'auto' : 'smooth' }); });
    trilho.addEventListener('scroll', estado, { passive: true });
    window.addEventListener('resize', estado);
    estado();

    /* Arrastar com o mouse (no toque, a rolagem nativa já funciona) */
    var arr = { ativo: false, moveu: false, x0: 0, s0: 0 };
    var assentar = function () {
      // leva ao card mais próximo e só então religa o snap
      var pad = parseFloat(getComputedStyle(trilho).paddingLeft) || 0;
      var base = trilho.getBoundingClientRect().left;
      var alvo = trilho.scrollLeft, menor = Infinity;
      trilho.querySelectorAll('li').forEach(function (li) {
        var x = li.getBoundingClientRect().left - base + trilho.scrollLeft - pad;
        if (Math.abs(x - trilho.scrollLeft) < menor) { menor = Math.abs(x - trilho.scrollLeft); alvo = x; }
      });
      trilho.scrollTo({ left: alvo, behavior: reduzMovimento ? 'auto' : 'smooth' });
      setTimeout(function () { trilho.classList.remove('arrastando'); }, reduzMovimento ? 0 : 450);
    };
    trilho.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      arr.ativo = true; arr.moveu = false; arr.x0 = e.clientX; arr.s0 = trilho.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!arr.ativo) return;
      var dx = e.clientX - arr.x0;
      if (!arr.moveu && Math.abs(dx) > 5) { arr.moveu = true; trilho.classList.add('arrastando'); }
      if (arr.moveu) { trilho.scrollLeft = arr.s0 - dx; e.preventDefault(); }
    });
    window.addEventListener('pointerup', function () {
      if (!arr.ativo) return;
      arr.ativo = false;
      if (arr.moveu) assentar();
    });
    // depois de arrastar, soltar sobre um card não abre o link
    trilho.addEventListener('click', function (e) {
      if (arr.moveu) { e.preventDefault(); e.stopPropagation(); arr.moveu = false; }
    }, true);
    trilho.addEventListener('dragstart', function (e) { e.preventDefault(); });
  });

  /* Índice da página de serviço: item ativo ------------------------ */
  var linksIndice = document.querySelectorAll('.indice a[href^="#"]');
  if (linksIndice.length && 'IntersectionObserver' in window) {
    var mapa = {};
    linksIndice.forEach(function (a) { mapa[a.getAttribute('href').slice(1)] = a; });
    var obs = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) {
          linksIndice.forEach(function (a) { a.classList.remove('ativo'); });
          var l = mapa[en.target.id];
          if (l) l.classList.add('ativo');
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    Object.keys(mapa).forEach(function (id) { var s = document.getElementById(id); if (s) obs.observe(s); });
  }

  /* Formulário de contato → WhatsApp ------------------------------- */
  var mini = document.querySelector('[data-mini-form]');
  if (mini) {
    mini.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(mini);
      var linhas = [
        'Olá, A Valoriza Sofá! Gostaria de um orçamento.',
        '',
        '*Nome:* ' + d.get('nome'),
        '*Cidade:* ' + d.get('cidade') + (d.get('bairro') ? ', bairro ' + d.get('bairro') : ''),
        '',
        '*O que preciso:* ' + d.get('msg'),
      ];
      var url = 'https://wa.me/' + document.body.dataset.waNumero + '?text=' + encodeURIComponent(linhas.join('\n'));
      window.open(url, '_blank', 'noopener');
    });
  }
})();
