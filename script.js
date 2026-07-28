/* =========================================================================
   FOXY'VIDEO — script.js
   Lê o array CATALOGO (definido em Notas.js) e monta o site inteiro.
   ========================================================================= */

(function () {
  "use strict";

  const VIDEOS_DIR = "videos/";
  const FOTOS_DIR  = "fotos/";

  const catalogo = (typeof CATALOGO !== "undefined") ? CATALOGO : [];

  /* -----------------------------------------------------------------------
     CONFIGURAÇÕES (guardadas no navegador)
  ----------------------------------------------------------------------- */
  const settings = Object.assign({
    autoplay: true,
    reduceMotion: false
  }, JSON.parse(localStorage.getItem("foxy_settings") || "{}"));

  function saveSettings() {
    localStorage.setItem("foxy_settings", JSON.stringify(settings));
  }

  /* -----------------------------------------------------------------------
     INTRO — abrir o olho da raposa
  ----------------------------------------------------------------------- */
  function runIntro() {
    const intro = document.getElementById("intro");
    const mask  = document.getElementById("irisMask");

    setTimeout(() => intro.classList.add("blink"), 250);
    setTimeout(() => { mask.classList.add("open"); }, 1550);
    setTimeout(() => {
      intro.classList.add("hide");
      document.body.classList.remove("locked");
    }, 2150);
    setTimeout(() => { intro.remove(); mask.remove(); }, 3200);
  }

  /* -----------------------------------------------------------------------
     HELPERS
  ----------------------------------------------------------------------- */
  function videoSrc(id) { return VIDEOS_DIR + id; }
  function capaSrc(capa) { return FOTOS_DIR + capa; }

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function agruparPorCategoria(lista) {
    const mapa = new Map();
    lista.forEach((v) => {
      const cat = v.categoria || "Outros";
      if (!mapa.has(cat)) mapa.set(cat, []);
      mapa.get(cat).push(v);
    });
    return mapa;
  }

  /* -----------------------------------------------------------------------
     PARSER DE TEMPORADAS
     Formato: "1,[A.mp4] 2,[B.mp4,C.mp4]"
     -> Map(1 -> ["A.mp4"], 2 -> ["B.mp4","C.mp4"])
  ----------------------------------------------------------------------- */
  function parseTemporadas(texto) {
    const resultado = new Map();
    if (!texto || typeof texto !== "string") return resultado;

    // encontra blocos "numero,[ep1,ep2,...]"
    const regex = /(\d+)\s*,\s*\[([^\]]*)\]/g;
    let match;
    while ((match = regex.exec(texto)) !== null) {
      const numero = parseInt(match[1], 10);
      const episodios = match[2]
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e.length > 0);
      resultado.set(numero, episodios);
    }
    return resultado;
  }

  function primeiroEpisodio(v) {
    if (v.serie) {
      const temporadas = parseTemporadas(v.temporadas);
      const primeiraChave = [...temporadas.keys()].sort((a, b) => a - b)[0];
      const eps = temporadas.get(primeiraChave) || [];
      return eps[0] || null;
    }
    return v.id || null;
  }

  /* -----------------------------------------------------------------------
     ESTADO VAZIO
  ----------------------------------------------------------------------- */
  function renderEmpty(msgTitulo, msgTexto) {
    const main = document.getElementById("mainContent");
    main.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
          <path d="M4 8l4-4 4 3 4-3 4 4M2 9h20M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h2>${escapeHtml(msgTitulo)}</h2>
        <p>${msgTexto}</p>
      </div>
    `;
  }

  /* -----------------------------------------------------------------------
     HERO
  ----------------------------------------------------------------------- */
  function renderHero(lista) {
    const hero = document.getElementById("hero");
    const destaque = lista.find((v) => v.destaque) || lista[0];
    if (!destaque) { hero.style.display = "none"; return; }
    hero.style.display = "";

    hero.innerHTML = `
      <div class="hero-media" id="heroMedia" style="background-image:url('${capaSrc(destaque.capa)}')"></div>
      <div class="hero-fade"></div>
      <div class="hero-content">
        <div class="hero-eyebrow">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2l1.9 5.9H20l-4.9 3.6L17 17.5 12 13.9 7 17.5l1.9-6L4 7.9h6.1z"/></svg>
          Em destaque no Foxy'Video
        </div>
        <h1 class="hero-title">${escapeHtml(destaque.titulo)}</h1>
        <div class="hero-meta">
          ${destaque.ano ? `<span>${destaque.ano}</span>` : ""}
          ${destaque.duracao ? `<span>${escapeHtml(destaque.duracao)}</span>` : ""}
          <span class="tag">${escapeHtml(destaque.categoria || "Geral")}</span>
          ${destaque.serie ? `<span class="tag">Série</span>` : ""}
        </div>
        <p class="hero-desc">${escapeHtml(destaque.descricao)}</p>
        <div class="hero-actions">
          <button class="btn btn-play" data-play="${destaque.id}">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            <span>Reproduzir</span>
          </button>
          <button class="btn btn-info" data-info="${destaque.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01" stroke-linecap="round"/></svg>
            <span>Mais informações</span>
          </button>
        </div>
      </div>
    `;
    requestAnimationFrame(() => {
      const m = document.getElementById("heroMedia");
      if (m) m.classList.add("show");
    });

    document.querySelector("[data-play]")?.addEventListener("click", (e) => {
      abrirPlayerParaVideo(destaque, primeiroEpisodio(destaque));
    });
    document.querySelector("[data-info]")?.addEventListener("click", () => abrirModal(destaque.id));
  }

  /* -----------------------------------------------------------------------
     CARTÕES E FILEIRAS
  ----------------------------------------------------------------------- */
  function cardHtml(v) {
    return `
      <article class="card" data-id="${escapeHtml(v.id)}" tabindex="0" aria-label="${escapeHtml(v.titulo)}">
        <img src="${capaSrc(v.capa)}" alt="Capa de ${escapeHtml(v.titulo)}" loading="lazy">
        <div class="card-shade"></div>
        <div class="card-play-badge">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <div class="card-info">
          <h4>${escapeHtml(v.titulo)}</h4>
          <div class="card-tags">
            ${v.ano ? `<span>${v.ano}</span><span class="dot">•</span>` : ""}
            <span>${escapeHtml(v.categoria || "Geral")}</span>
            ${v.serie ? `<span class="dot">•</span><span>Série</span>` : ""}
          </div>
        </div>
      </article>
    `;
  }

  function rowHtml(categoria, videos) {
    const trackId = "track-" + categoria.replace(/\s+/g, "-").toLowerCase();
    return `
      <section class="row">
        <div class="row-head">
          <h3 class="row-title">${escapeHtml(categoria)}</h3>
          <span class="row-count">${videos.length} título${videos.length !== 1 ? "s" : ""}</span>
        </div>
        <div class="row-wrap">
          <button class="row-arrow left" data-scroll="${trackId}:-1" aria-label="Recuar">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 4l-8 8 8 8z"/></svg>
          </button>
          <div class="row-track" id="${trackId}">
            ${videos.map(cardHtml).join("")}
          </div>
          <button class="row-arrow right" data-scroll="${trackId}:1" aria-label="Avançar">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 4l8 8-8 8z"/></svg>
          </button>
        </div>
      </section>
    `;
  }

  function renderRows(lista) {
    const main = document.getElementById("mainContent");
    if (lista.length === 0) {
      renderEmpty(
        "Sem resultados",
        "Não encontrámos nenhum vídeo com esse filtro ou pesquisa."
      );
      return;
    }
    const porCategoria = agruparPorCategoria(lista);
    let html = `<div class="rows">`;
    porCategoria.forEach((videos, categoria) => {
      html += rowHtml(categoria, videos);
    });
    html += `</div>`;
    main.innerHTML = html;
    ligarEventosCartoes();
  }

  /* -----------------------------------------------------------------------
     MODAL DE DETALHES (info do vídeo/série)
  ----------------------------------------------------------------------- */
  let likedIds = new Set(JSON.parse(localStorage.getItem("foxy_liked") || "[]"));

  function abrirModal(id) {
    const v = catalogo.find((x) => x.id === id);
    if (!v) return;

    const backdrop = document.getElementById("modalBackdrop");
    const gostou = likedIds.has(v.id);

    backdrop.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(v.titulo)}">
        <div class="modal-media" id="modalMedia">
          <img src="${capaSrc(v.capa)}" alt="">
          <div class="modal-media-fade"></div>
          <button class="modal-close" id="modalCloseBtn" aria-label="Fechar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>
          </button>
          <div class="modal-play-center" id="modalPlayCenter">
            <button aria-label="Reproduzir">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </button>
          </div>
        </div>
        <div class="modal-body">
          <div class="modal-actions">
            <button class="btn btn-play" id="modalPlayBtn">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              <span>Reproduzir</span>
            </button>
            <button class="icon-round ${gostou ? "liked" : ""}" id="modalLikeBtn" aria-label="Gostei">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-1 8H4a2 2 0 0 0-2 2l1.5 7a2 2 0 0 0 2 1.5H17a2 2 0 0 0 2-1.7l1-6A2 2 0 0 0 18 11h-4z"/></svg>
            </button>
          </div>
          <div class="modal-meta-row">
            <span class="match">98% compatível</span>
            ${v.ano ? `<span>${v.ano}</span>` : ""}
            ${v.duracao ? `<span>${escapeHtml(v.duracao)}</span>` : ""}
            <span class="tag">${escapeHtml(v.categoria || "Geral")}</span>
            ${v.serie ? `<span class="tag">Série</span>` : ""}
          </div>
          <p class="modal-desc">${escapeHtml(v.descricao)}</p>
          <div class="modal-category"><span>Categoria:</span> ${escapeHtml(v.categoria || "Geral")}</div>
        </div>
      </div>
    `;

    backdrop.classList.add("open");
    document.body.classList.add("locked");

    const media = document.getElementById("modalMedia");
    const playCenter = document.getElementById("modalPlayCenter");
    const playBtn = document.getElementById("modalPlayBtn");

    function play() { fecharModal(); abrirPlayerParaVideo(v, primeiroEpisodio(v)); }
    playCenter.addEventListener("click", play);
    playBtn.addEventListener("click", play);

    document.getElementById("modalCloseBtn").addEventListener("click", fecharModal);
    document.getElementById("modalLikeBtn").addEventListener("click", () => toggleLike(v.id));
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) fecharModal(); });
  }

  function fecharModal() {
    const backdrop = document.getElementById("modalBackdrop");
    backdrop.classList.remove("open");
    document.body.classList.remove("locked");
    setTimeout(() => { backdrop.innerHTML = ""; }, 300);
  }

  function toggleLike(id) {
    if (likedIds.has(id)) likedIds.delete(id);
    else likedIds.add(id);
    localStorage.setItem("foxy_liked", JSON.stringify([...likedIds]));
    const btn = document.getElementById("modalLikeBtn");
    if (btn) btn.classList.toggle("liked", likedIds.has(id));
    mostrarToast(likedIds.has(id) ? "Adicionado à tua lista" : "Removido da tua lista");
  }

  function mostrarToast(texto) {
    const toast = document.getElementById("toast");
    toast.querySelector("span").textContent = texto;
    toast.classList.add("show");
    clearTimeout(mostrarToast._t);
    mostrarToast._t = setTimeout(() => toast.classList.remove("show"), 2400);
  }

  /* -----------------------------------------------------------------------
     PLAYER FULLSCREEN CUSTOMIZADO
  ----------------------------------------------------------------------- */
  const player = {
    overlay: null, video: null, currentVideo: null, currentEpisodio: null,
    controlsTimer: null
  };

  function fmtTempo(segundos) {
    if (!isFinite(segundos) || segundos < 0) segundos = 0;
    const m = Math.floor(segundos / 60);
    const s = Math.floor(segundos % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function abrirPlayerParaVideo(v, episodioId) {
    if (!episodioId) {
      mostrarToast("Este título ainda não tem ficheiro de vídeo associado.");
      return;
    }
    player.currentVideo = v;
    player.currentEpisodio = episodioId;

    const overlay = document.getElementById("playerOverlay");
    const video = document.getElementById("playerVideo");
    const title = document.getElementById("playerTitle");

    title.textContent = v.titulo + (v.serie ? ` — ${episodioId.replace(/\.[^/.]+$/, "")}` : "");
    video.src = videoSrc(episodioId);
    video.volume = 1;
    document.getElementById("playerVolume").value = 1;

    overlay.classList.add("open");
    document.body.classList.add("locked");

    if (settings.autoplay) {
      video.play().catch(() => {});
    }
    montarPainelEpisodios(v);
    resetControlsTimer();
  }

  function fecharPlayer() {
    const overlay = document.getElementById("playerOverlay");
    const video = document.getElementById("playerVideo");
    video.pause();
    video.src = "";
    overlay.classList.remove("open");
    overlay.classList.remove("controls-hidden");
    document.getElementById("playerEpisodesPanel").classList.remove("open");
    document.body.classList.remove("locked");
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }

  function trocarEpisodio(episodioId, tituloEp) {
    const video = document.getElementById("playerVideo");
    const title = document.getElementById("playerTitle");
    player.currentEpisodio = episodioId;
    video.src = videoSrc(episodioId);
    title.textContent = player.currentVideo.titulo + (tituloEp ? ` — ${tituloEp}` : "");
    video.play().catch(() => {});
    montarPainelEpisodios(player.currentVideo);
  }

  function montarPainelEpisodios(v) {
    const panel = document.getElementById("playerEpisodesPanel");
    if (!v.serie) { panel.innerHTML = ""; return; }

    const temporadas = parseTemporadas(v.temporadas);
    const chaves = [...temporadas.keys()].sort((a, b) => a - b);

    if (chaves.length === 0) {
      panel.innerHTML = `<div class="ep-panel-head"><h3>Episódios</h3><button class="ep-panel-close" id="epPanelClose">✕</button></div><p style="color:var(--ink-faint);font-size:.85rem;">Sem temporadas definidas.</p>`;
      document.getElementById("epPanelClose")?.addEventListener("click", () => panel.classList.remove("open"));
      return;
    }

    function render(temporadaAtual) {
      const eps = temporadas.get(temporadaAtual) || [];
      panel.innerHTML = `
        <div class="ep-panel-head">
          <h3>Episódios</h3>
          <button class="ep-panel-close" id="epPanelClose" aria-label="Fechar">✕</button>
        </div>
        ${chaves.length > 1 ? `
          <select class="season-select" id="seasonSelect">
            ${chaves.map((k) => `<option value="${k}" ${k === temporadaAtual ? "selected" : ""}>Temporada ${k}</option>`).join("")}
          </select>` : ""}
        <div id="epList">
          ${eps.map((ep, i) => `
            <div class="ep-item ${ep === player.currentEpisodio ? "playing" : ""}" data-ep="${escapeHtml(ep)}" data-titulo="Temporada ${temporadaAtual} · Episódio ${i + 1}">
              <div class="ep-thumb">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              </div>
              <div class="ep-info">
                <h5>Episódio ${i + 1}</h5>
                <span>${escapeHtml(ep)}</span>
              </div>
            </div>
          `).join("")}
        </div>
      `;

      document.getElementById("epPanelClose")?.addEventListener("click", () => panel.classList.remove("open"));
      document.getElementById("seasonSelect")?.addEventListener("change", (e) => {
        render(parseInt(e.target.value, 10));
      });
      panel.querySelectorAll(".ep-item").forEach((item) => {
        item.addEventListener("click", () => {
          trocarEpisodio(item.dataset.ep, item.dataset.titulo);
        });
      });
    }

    // mostra a temporada que contém o episódio atual, ou a primeira
    let temporadaInicial = chaves[0];
    for (const [k, eps] of temporadas) {
      if (eps.includes(player.currentEpisodio)) { temporadaInicial = k; break; }
    }
    render(temporadaInicial);
  }

  function resetControlsTimer() {
    const overlay = document.getElementById("playerOverlay");
    overlay.classList.remove("controls-hidden");
    clearTimeout(player.controlsTimer);
    const video = document.getElementById("playerVideo");
    player.controlsTimer = setTimeout(() => {
      if (!video.paused) overlay.classList.add("controls-hidden");
    }, 3200);
  }

  function ligarPlayer() {
    const overlay = document.getElementById("playerOverlay");
    const video = document.getElementById("playerVideo");
    const centerBtn = document.getElementById("playerCenterBtn");
    const centerIcon = document.getElementById("playerCenterIcon");
    const playBtn = document.getElementById("playerPlayBtn");
    const backBtn = document.getElementById("playerBackBtn");
    const back10 = document.getElementById("playerBack10");
    const fwd10 = document.getElementById("playerFwd10");
    const muteBtn = document.getElementById("playerMuteBtn");
    const volIcon = document.getElementById("playerVolIcon");
    const volumeSlider = document.getElementById("playerVolume");
    const progressWrap = document.getElementById("playerProgressWrap");
    const progressFill = document.getElementById("playerProgressFill");
    const progressBuffer = document.getElementById("playerBuffer");
    const progressHandle = document.getElementById("playerProgressHandle");
    const timeLabel = document.getElementById("playerTime");
    const fullscreenBtn = document.getElementById("playerFullscreenBtn");
    const episodesBtn = document.getElementById("playerEpisodesBtn");
    const episodesPanel = document.getElementById("playerEpisodesPanel");

    const iconPlay = `<path d="M8 5v14l11-7z"/>`;
    const iconPause = `<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>`;

    function togglePlay() {
      if (video.paused) { video.play(); } else { video.pause(); }
    }

    function updatePlayIcons() {
      const paused = video.paused;
      centerIcon.innerHTML = paused ? iconPlay : iconPause;
      playBtn.querySelector("svg").innerHTML = paused ? iconPlay : iconPause;
      centerBtn.classList.toggle("show", paused);
    }

    centerBtn.addEventListener("click", () => { togglePlay(); resetControlsTimer(); });
    playBtn.addEventListener("click", () => { togglePlay(); resetControlsTimer(); });
    video.addEventListener("play", updatePlayIcons);
    video.addEventListener("pause", updatePlayIcons);
    video.addEventListener("click", () => { togglePlay(); resetControlsTimer(); });

    backBtn.addEventListener("click", fecharPlayer);

    back10.addEventListener("click", () => { video.currentTime = Math.max(0, video.currentTime - 10); resetControlsTimer(); });
    fwd10.addEventListener("click", () => { video.currentTime = Math.min(video.duration || 0, video.currentTime + 10); resetControlsTimer(); });

    muteBtn.addEventListener("click", () => {
      video.muted = !video.muted;
      volIcon.innerHTML = video.muted
        ? `<path d="M16.5 12c0-1.77-1-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.4.05-.63zM19 12c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>`
        : `<path d="M4 9v6h4l5 5V4L8 9H4z"/>`;
      resetControlsTimer();
    });
    volumeSlider.addEventListener("input", () => {
      video.volume = parseFloat(volumeSlider.value);
      video.muted = video.volume === 0;
      resetControlsTimer();
    });

    video.addEventListener("timeupdate", () => {
      const pct = (video.currentTime / (video.duration || 1)) * 100;
      progressFill.style.width = pct + "%";
      progressHandle.style.left = pct + "%";
      timeLabel.textContent = `${fmtTempo(video.currentTime)} / ${fmtTempo(video.duration)}`;
    });
    video.addEventListener("progress", () => {
      if (video.buffered.length > 0) {
        const end = video.buffered.end(video.buffered.length - 1);
        progressBuffer.style.width = ((end / (video.duration || 1)) * 100) + "%";
      }
    });

    function seekFromEvent(e) {
      const rect = progressWrap.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      video.currentTime = pct * (video.duration || 0);
    }
    let seeking = false;
    progressWrap.addEventListener("mousedown", (e) => { seeking = true; seekFromEvent(e); });
    window.addEventListener("mousemove", (e) => { if (seeking) seekFromEvent(e); });
    window.addEventListener("mouseup", () => { seeking = false; });
    progressWrap.addEventListener("touchstart", (e) => { seeking = true; seekFromEvent(e); });
    progressWrap.addEventListener("touchmove", (e) => { if (seeking) seekFromEvent(e); });
    progressWrap.addEventListener("touchend", () => { seeking = false; });

    fullscreenBtn.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        overlay.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
      resetControlsTimer();
    });

    episodesBtn.addEventListener("click", () => {
      episodesPanel.classList.toggle("open");
    });

    // vídeo termina -> tenta avançar para o próximo episódio automaticamente
    video.addEventListener("ended", () => {
      const v = player.currentVideo;
      if (!v || !v.serie) return;
      const temporadas = parseTemporadas(v.temporadas);
      for (const [, eps] of temporadas) {
        const idx = eps.indexOf(player.currentEpisodio);
        if (idx !== -1 && idx < eps.length - 1) {
          trocarEpisodio(eps[idx + 1], null);
          return;
        }
      }
    });

    overlay.addEventListener("mousemove", resetControlsTimer);
    overlay.addEventListener("touchstart", resetControlsTimer);

    document.addEventListener("keydown", (e) => {
      if (!overlay.classList.contains("open")) return;
      if (e.key === "Escape") { fecharPlayer(); }
      if (e.key === " ") { e.preventDefault(); togglePlay(); resetControlsTimer(); }
      if (e.key === "ArrowRight") { video.currentTime += 10; resetControlsTimer(); }
      if (e.key === "ArrowLeft") { video.currentTime -= 10; resetControlsTimer(); }
    });
  }

  /* -----------------------------------------------------------------------
     PESQUISA (corrigida: pesquisa em todo o catálogo, sempre)
  ----------------------------------------------------------------------- */
  function aplicarFiltrosEPesquisa() {
    const input = document.getElementById("searchInput");
    const termo = (input?.value || "").trim().toLowerCase();

    let lista = catalogo;

    if (estadoFiltro.categoria) {
      lista = lista.filter((v) => (v.categoria || "Outros") === estadoFiltro.categoria);
    }

    if (termo) {
      lista = lista.filter((v) =>
        (v.titulo || "").toLowerCase().includes(termo) ||
        (v.categoria || "").toLowerCase().includes(termo) ||
        (v.descricao || "").toLowerCase().includes(termo)
      );
    }

    renderRows(lista);
  }

  function ligarPesquisa() {
    const input = document.getElementById("searchInput");
    if (!input) return;
    input.addEventListener("input", aplicarFiltrosEPesquisa);
  }

  /* -----------------------------------------------------------------------
     FILTRO POR CATEGORIA (menu "Filtrar")
  ----------------------------------------------------------------------- */
  const estadoFiltro = { categoria: null };

  function montarPainelFiltro() {
    const panel = document.getElementById("filterPanel");
    const porCategoria = agruparPorCategoria(catalogo);

    if (porCategoria.size === 0) {
      panel.innerHTML = `<div class="filter-empty">Sem categorias ainda.</div>`;
      return;
    }

    let html = `<div class="filter-option ${!estadoFiltro.categoria ? "active" : ""}" data-cat="">
      <span>Todas as categorias</span><span class="count">${catalogo.length}</span>
    </div>`;

    porCategoria.forEach((videos, categoria) => {
      html += `<div class="filter-option ${estadoFiltro.categoria === categoria ? "active" : ""}" data-cat="${escapeHtml(categoria)}">
        <span>${escapeHtml(categoria)}</span><span class="count">${videos.length}</span>
      </div>`;
    });

    panel.innerHTML = html;
    panel.querySelectorAll(".filter-option").forEach((opt) => {
      opt.addEventListener("click", () => {
        estadoFiltro.categoria = opt.dataset.cat || null;
        montarPainelFiltro();
        aplicarFiltrosEPesquisa();
        panel.classList.remove("open");
        document.getElementById("hero").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function ligarFiltro() {
    const wrap = document.querySelector(".nav-filter-wrap");
    const panel = document.getElementById("filterPanel");
    const mobileBtn = document.getElementById("mobileFilterBtn");

    mobileBtn?.addEventListener("click", () => {
      panel.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target)) panel.classList.remove("open");
    });
  }

  /* -----------------------------------------------------------------------
     PAINÉIS: SOBRE NÓS / DEFINIÇÕES
  ----------------------------------------------------------------------- */
  function ligarPainelSimples(backdropId, abrirBtnIds, fecharBtnId) {
    const backdrop = document.getElementById(backdropId);
    abrirBtnIds.forEach((id) => {
      document.getElementById(id)?.addEventListener("click", (e) => {
        e.preventDefault();
        backdrop.classList.add("open");
        document.body.classList.add("locked");
      });
    });
    function fechar() {
      backdrop.classList.remove("open");
      document.body.classList.remove("locked");
    }
    document.getElementById(fecharBtnId)?.addEventListener("click", fechar);
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) fechar(); });
  }

  function ligarSettings() {
    const autoplayInput = document.getElementById("settingAutoplay");
    const reduceInput = document.getElementById("settingReduceMotion");
    const clearBtn = document.getElementById("settingClearLikes");

    autoplayInput.checked = settings.autoplay;
    reduceInput.checked = settings.reduceMotion;
    document.body.classList.toggle("reduce-motion", settings.reduceMotion);

    autoplayInput.addEventListener("change", () => {
      settings.autoplay = autoplayInput.checked;
      saveSettings();
    });
    reduceInput.addEventListener("change", () => {
      settings.reduceMotion = reduceInput.checked;
      document.body.classList.toggle("reduce-motion", settings.reduceMotion);
      saveSettings();
    });
    clearBtn.addEventListener("click", () => {
      likedIds = new Set();
      localStorage.setItem("foxy_liked", "[]");
      mostrarToast("Lista de gostos limpa");
    });
  }

  /* -----------------------------------------------------------------------
     EVENTOS GERAIS
  ----------------------------------------------------------------------- */
  function ligarEventosCartoes() {
    document.querySelectorAll(".card").forEach((card) => {
      card.addEventListener("click", () => abrirModal(card.dataset.id));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter") abrirModal(card.dataset.id);
      });
    });
    document.querySelectorAll("[data-scroll]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const [trackId, dir] = btn.dataset.scroll.split(":");
        const track = document.getElementById(trackId);
        track.scrollBy({ left: Number(dir) * track.clientWidth * 0.85, behavior: "smooth" });
      });
    });
  }

  function ligarNavHome() {
    function irParaInicio(e) {
      e.preventDefault();
      estadoFiltro.categoria = null;
      const input = document.getElementById("searchInput");
      if (input) input.value = "";
      montarPainelFiltro();
      renderHero(catalogo);
      renderRows(catalogo);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    document.getElementById("navHome")?.addEventListener("click", irParaInicio);
    document.getElementById("brandHome")?.addEventListener("click", irParaInicio);
  }

  function ligarNavbarScroll() {
    const nav = document.getElementById("navbar");
    window.addEventListener("scroll", () => {
      nav.classList.toggle("scrolled", window.scrollY > 30);
    }, { passive: true });
  }

  /* -----------------------------------------------------------------------
     ARRANQUE
  ----------------------------------------------------------------------- */
  function init() {
    document.body.classList.add("locked");
    runIntro();
    document.body.classList.toggle("reduce-motion", settings.reduceMotion);

    if (catalogo.length === 0) {
      document.getElementById("hero").style.display = "none";
      renderEmpty(
        "Ainda não há vídeos aqui",
        `Põe um ficheiro de vídeo na pasta <code>videos</code>, uma imagem de capa na pasta <code>fotos</code>, e depois copia um bloco de exemplo no ficheiro <code>Notas.js</code> com o mesmo nome de ficheiro no campo <code>id</code>.`
      );
    } else {
      renderHero(catalogo);
      renderRows(catalogo);
    }

    montarPainelFiltro();
    ligarPesquisa();
    ligarFiltro();
    ligarNavHome();
    ligarNavbarScroll();
    ligarPlayer();
    ligarSettings();
    ligarPainelSimples("aboutBackdrop", ["navAbout", "footAbout"], "aboutCloseBtn");
    ligarPainelSimples("settingsBackdrop", ["navSettings", "footSettings"], "settingsCloseBtn");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
