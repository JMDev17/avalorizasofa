/* ==================================================================
   A VALORIZA SOFÁ — trabalhos.js (Vanilla JS)
   Página /trabalhos-realizados/: filtro por categoria e visualizador
   de fotos em tamanho inteiro (<dialog>). Sem JS, cada card abre a
   imagem diretamente.
   ================================================================== */
(function () {
  'use strict';

  var dadosEl = document.getElementById('dados-trabalhos');
  var grade = document.querySelector('[data-trabalhos]');
  if (!dadosEl || !grade) return;
  var dados = JSON.parse(dadosEl.textContent);
  var porId = {};
  dados.forEach(function (t) { porId[t.id] = t; });

  /* Filtros ------------------------------------------------------- */
  var filtros = document.querySelector('[data-filtros]');
  if (filtros) {
    filtros.addEventListener('click', function (e) {
      var b = e.target.closest('[data-filtro]');
      if (!b) return;
      var cat = b.getAttribute('data-filtro');
      filtros.querySelectorAll('[data-filtro]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      grade.querySelectorAll('li[data-categoria]').forEach(function (li) {
        li.hidden = cat !== 'todos' && li.getAttribute('data-categoria') !== cat;
      });
    });
  }

  /* Visualizador -------------------------------------------------- */
  var visor = document.querySelector('[data-visor]');
  if (!visor || typeof visor.showModal !== 'function') return;
  var img = visor.querySelector('[data-visor-img]');
  var tEl = visor.querySelector('[data-visor-t]');
  var dEl = visor.querySelector('[data-visor-d]');
  var servEl = visor.querySelector('[data-visor-servico]');
  var nav = visor.querySelector('[data-visor-nav]');
  var cont = visor.querySelector('[data-visor-cont]');
  var atual = null, indice = 0, origem = null;

  function mostrar() {
    var foto = atual.imagens[indice];
    img.src = atual.base + foto.arquivo;
    img.alt = foto.alt;
    var n = atual.imagens.length;
    nav.hidden = n < 2;
    cont.textContent = (indice + 1) + ' de ' + n;
  }

  function abrir(id, gatilho) {
    var t = porId[id];
    if (!t) return;
    var card = gatilho.closest('.aw-card');
    var link = card && card.querySelector('.aw-card__link');
    // caminho base das imagens a partir do próprio link (funciona com caminhos relativos)
    t.base = gatilho.getAttribute('href').replace(/[^/]*$/, '');
    atual = t; indice = 0; origem = gatilho;
    tEl.textContent = t.titulo + (t.cidade ? ' · ' + t.cidade : '');
    dEl.textContent = t.descricao;
    if (link) { servEl.href = link.href; servEl.textContent = link.textContent; }
    mostrar();
    visor.showModal();
  }

  grade.addEventListener('click', function (e) {
    var a = e.target.closest('[data-abrir]');
    if (!a) return;
    e.preventDefault();
    abrir(a.getAttribute('data-abrir'), a);
  });

  visor.querySelector('[data-visor-fechar]').addEventListener('click', function () { visor.close(); });
  visor.querySelector('[data-visor-ant]').addEventListener('click', function () { indice = (indice - 1 + atual.imagens.length) % atual.imagens.length; mostrar(); });
  visor.querySelector('[data-visor-prox]').addEventListener('click', function () { indice = (indice + 1) % atual.imagens.length; mostrar(); });
  visor.addEventListener('keydown', function (e) {
    if (!atual || atual.imagens.length < 2) return;
    if (e.key === 'ArrowRight') { indice = (indice + 1) % atual.imagens.length; mostrar(); }
    if (e.key === 'ArrowLeft') { indice = (indice - 1 + atual.imagens.length) % atual.imagens.length; mostrar(); }
  });
  // clique no fundo escuro fecha
  visor.addEventListener('click', function (e) { if (e.target === visor) visor.close(); });
  visor.addEventListener('close', function () { if (origem) origem.focus(); });

  // Link direto da home (/trabalhos-realizados/#id): destaca o trabalho
  if (location.hash) {
    var alvo = document.getElementById(location.hash.slice(1));
    if (alvo) alvo.classList.add('trabalho--alvo');
  }
})();
