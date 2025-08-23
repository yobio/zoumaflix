let currentSource = "vidlink.pro"; // source par défaut

document.addEventListener("DOMContentLoaded", initFilmPage);

async function initFilmPage() {
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type'); // "movie" ou "tv"
  const id = params.get('id');

  if (!type || !id) {
    console.error("Missing type or id in URL");
    return;
  }

  // --- Charger les détails depuis TMDB ---
  const details = await extractDetails(type, id);

  document.getElementById('filmTitle').textContent = details.title;
  document.getElementById('filmDescription').textContent = details.description;
  document.getElementById('filmDuration').textContent = details.aliases;
  document.getElementById('filmDate').textContent = details.airdate;
  if (details.poster) {
    document.getElementById('filmPoster').src = details.poster;
  }

  // Changer le titre de l'onglet
  document.title = details.title + " - ZoumaFlix";

  // --- Charger épisodes (si TV) ---
  if (type === "tv") {
    const episodes = await extractEpisodes(type, id);

    const container = document.getElementById('episodesContainer');
    const seasonTabs = document.getElementById('seasonTabs');
    container.innerHTML = "";
    seasonTabs.innerHTML = "";

    // Regroupement par saison
    const grouped = {};
    episodes.forEach(ep => {
      if (!grouped[ep.season]) grouped[ep.season] = [];
      grouped[ep.season].push(ep);
    });

    // Créer onglets
    Object.keys(grouped).sort((a, b) => a - b).forEach((seasonNum, index) => {
      const tab = document.createElement("button");
      tab.className = "season-tab btn small glass accent";
      tab.textContent = `Saison ${seasonNum}`;
      if (index === 0) tab.classList.add("active");

      tab.addEventListener("click", () => {
        document.querySelectorAll(".season-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        renderEpisodes(seasonNum);
      });

      seasonTabs.appendChild(tab);
    });

    // Fonction pour afficher épisodes d’une saison
    function renderEpisodes(seasonNum) {
      container.innerHTML = "";
      grouped[seasonNum].forEach(ep => {
        const card = document.createElement('button');
        card.className = 'episode-card glass';
        card.dataset.season = ep.season;
        card.dataset.episode = ep.number;
        card.innerHTML = `
          <h4>Épisode ${ep.number}
          <span class="legend">${ep.duration ? formatDuration(ep.duration) : ""}</span>
          </h4>
          <p>${ep.title}</p>
        `;
        container.appendChild(card);
      });

      // attacher les listeners sur les nouveaux boutons
      const episodeCards = document.querySelectorAll('.episode-card');
      episodeCards.forEach(card => {
        card.addEventListener('click', () => {
          const season = card.dataset.season || 1;
          const episode = card.dataset.episode || 1;
          playEpisode(season, episode, type, id);
        });
      });
    }

    // Afficher saison 1 par défaut
    const firstSeason = Object.keys(grouped).sort((a, b) => a - b)[0];
    renderEpisodes(firstSeason);

    // Ajouter data-season / data-episode par défaut sur "Regarder"
    const btnWatch = document.getElementById('btnWatch');
    btnWatch.dataset.season = firstSeason;
    btnWatch.dataset.episode = "1";
  }

  setupPlayerButtons(type, id);
}

function playEpisode(season, episode, type, id) {
  const main = document.getElementById('main');
  const playerMain = document.getElementById('playerMain');
  const playerIframe = document.getElementById('playerIframe');

  console.log(`saison ${season} épisode ${episode}`);
  playerIframe.src = buildPlayerURL(currentSource, type, id, season, episode);
  playerIframe.dataset.type = type;
  playerIframe.dataset.id = id;
  playerIframe.dataset.season = season;
  playerIframe.dataset.episode = episode;

  main.style.display = 'none';
  playerMain.style.display = 'block';
}

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return "N/A";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) {
    return `${h} h ${m.toString().padStart(2, "0")} min`;
  }
  return `${m} min`;
}

function setupPlayerButtons(type, id) {
  const main = document.getElementById('main');
  const playerMain = document.getElementById('playerMain');
  const playerIframe = document.getElementById('playerIframe');
  const btnBack = document.getElementById('btnBack');
  const btnSource = document.getElementById('btnSource');
  const sourceDropdown = btnSource?.nextElementSibling;
  const currentSourceLabel = document.getElementById('currentSource');

  // Bouton retour
  btnBack?.addEventListener('click', () => {
    playerIframe.src = ""; // stoppe la lecture
    playerMain.style.display = 'none';
    main.style.display = 'block';
  });

  // Dropdown source
  if (btnSource && sourceDropdown) {
    btnSource.addEventListener('click', () => {
      sourceDropdown.style.display = sourceDropdown.style.display === 'block' ? 'none' : 'block';
    });

    sourceDropdown.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        currentSource = btn.dataset.source;
        currentSourceLabel.textContent = currentSource;
        sourceDropdown.style.display = 'none';

        // si le player est visible, recharge l'iframe avec la nouvelle source
        if (playerMain.style.display === 'block') {
          const season = playerIframe.dataset.season || 1;
          const episode = playerIframe.dataset.episode || 1;
          playEpisode(season, episode, type, id);
        }
      });
    });
  }

  // Bouton Regarder
  const btnWatch = document.getElementById('btnWatch');
  btnWatch?.addEventListener('click', () => {
    const season = btnWatch.dataset.season || 1;
    const episode = btnWatch.dataset.episode || 1;
    playEpisode(season, episode, type, id);
  });
}

function buildPlayerURL(source, type, id, season = 1, episode = 1) {
  switch(source) {
    case "vidlink.pro":
      return type === "movie"
        ? `https://vidlink.pro/movie/${id}`
        : `https://vidlink.pro/tv/${id}/${season}/${episode}`;
    case "vidsrc.me":
      return type === "movie"
        ? `https://vidsrc.xyz/embed/movie/${id}`
        : `https://vidsrc.xyz/embed/tv/${id}/${season}-${episode}`;
    case "embed.su":
      return type === "movie"
        ? `https://embed.su/embed/movie/${id}`
        : `https://embed.su/embed/tv/${id}/${season}/${episode}`;
    default:
      return "";
  }
}

async function extractDetails(type, id) {
  try {
    const tmdbUrl = type === "movie"
      ? `https://api.themoviedb.org/3/movie/${id}?api_key=ad301b7cc82ffe19273e55e4d4206885`
      : `https://api.themoviedb.org/3/tv/${id}?api_key=ad301b7cc82ffe19273e55e4d4206885`;

    const response = await fetch(tmdbUrl);
    const data = await response.json();

    return {
      description: data.overview || 'No description available',
      aliases: type === "movie"
        ? `Duration: ${data.runtime ? data.runtime + " minutes" : 'Unknown'}`
        : `Duration: ${data.episode_run_time && data.episode_run_time.length ? data.episode_run_time.join(', ') + " minutes" : 'Unknown'}`,
      airdate: type === "movie"
        ? `Released: ${data.release_date || 'Unknown'}`
        : `Aired: ${data.first_air_date || 'Unknown'}`,
      title: data.title || data.name || "Untitled",
      poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null
    };
  } catch (error) {
    console.error('extractDetails error:', error);
    return {
      description: 'Error loading description',
      aliases: 'Duration: Unknown',
      airdate: 'Aired/Released: Unknown',
      title: 'Unknown',
      poster: null
    };
  }
}

async function extractEpisodes(type, id) {
  try {
    if (type === "movie") {
      return [{
        href: `https://net3lix.world/watch/movie/${id}`,
        season: 1,
        number: 1,
        title: "Full Movie",
        duration: null
      }];
    }

    const showResponse = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=ad301b7cc82ffe19273e55e4d4206885`);
    const showData = await showResponse.json();

    let allEpisodes = [];
    for (const season of showData.seasons) {
      if (!season.season_number || season.season_number < 1) continue;

      const seasonNumber = season.season_number;
      const seasonResponse = await fetch(`https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}?api_key=ad301b7cc82ffe19273e55e4d4206885`);
      const seasonData = await seasonResponse.json();

      if (seasonData.episodes && seasonData.episodes.length) {
        const episodes = seasonData.episodes.map(ep => ({
          href: `https://net3lix.world/watch/tv/${id}/${seasonNumber}/${ep.episode_number}`,
          season: seasonNumber,
          number: ep.episode_number,
          title: ep.name || `Episode ${ep.episode_number}`,
          duration: ep.runtime || null
        }));
        allEpisodes = allEpisodes.concat(episodes);
      }
    }
    return allEpisodes;
  } catch (error) {
    console.error('extractEpisodes error:', error);
    return [];
  }
}
