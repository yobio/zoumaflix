document.addEventListener("DOMContentLoaded", initFilmPage);


async function initFilmPage() {
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type'); // "movie" ou "tv"
  const id = params.get('id');

  if (!type || !id) {
    console.error("Missing type or id in URL");
    return;
  }

  const apiUrl = `https://net3lix.world/watch/${type}/${id}`;

  // --- Charger les détails ---
  const detailsJSON = await extractDetails(apiUrl);
  const details = JSON.parse(detailsJSON)[0];

  document.getElementById('filmTitle').textContent = "Titre";
  document.getElementById('filmDescription').textContent = details.description;
  document.getElementById('filmDuration').textContent = details.aliases;
  document.getElementById('filmDate').textContent = details.airdate;

  // Affiche via TMDB
  const tmdbUrl = type === "movie"
    ? `https://api.themoviedb.org/3/movie/${id}?api_key=ad301b7cc82ffe19273e55e4d4206885`
    : `https://api.themoviedb.org/3/tv/${id}?api_key=ad301b7cc82ffe19273e55e4d4206885`;

  const response = await fetch(tmdbUrl);
  const data = await response.json();

  // Changer le titre de l'onglet
  document.title = (data.title || data.name || "Film") + " - ZoumaFlix";

  document.getElementById('filmTitle').textContent = data.title || data.name;
  document.getElementById('filmPoster').src = `https://image.tmdb.org/t/p/w500${data.poster_path}`;

  // --- Charger épisodes (si TV) ---
  if (type === "tv") {
    const episodesJSON = await extractEpisodes(apiUrl);
    const episodes = JSON.parse(episodesJSON);

    const container = document.getElementById('episodesContainer');
    container.innerHTML = ""; // reset

    // Regroupement par saison
    const grouped = {};
    episodes.forEach(ep => {
      if (!grouped[ep.season]) grouped[ep.season] = [];
      grouped[ep.season].push(ep);
    });

    // Affichage
    Object.keys(grouped).sort((a, b) => a - b).forEach(seasonNum => {
      const seasonHeader = document.createElement("h3");
      seasonHeader.textContent = `Saison ${seasonNum}`;
      container.appendChild(seasonHeader);

      grouped[seasonNum].forEach(ep => {
        const card = document.createElement('button');
        card.className = 'episode-card';
        card.dataset.season = ep.season;   // Ajout season
        card.dataset.episode = ep.number;  // Ajout episode
        card.innerHTML = `
          <h4>Épisode ${ep.number}
          <span class="legend">${ep.duration ? formatDuration(ep.duration) : ""}</span>
          </h4>
          <p>${ep.title}</p>
        `;
        container.appendChild(card);
      });
    });

    // Ajouter data-season / data-episode par défaut sur "Regarder"
    const btnWatch = document.getElementById('btnWatch');
    btnWatch.dataset.season = "1";
    btnWatch.dataset.episode = "1";
  }

  setupPlayerButtons(type, id);
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

  function playEpisode(season, episode) {
    if (type === "movie") {
      playerIframe.src = `https://vidlink.pro/movie/${id}`;
    } else { // type tv
      playerIframe.src = `https://vidlink.pro/tv/${id}/${season}/${episode}`;
    }

    // bascule affichage
    main.style.display = 'none';
    playerMain.style.display = 'block';
  }

  // Bouton retour
  if (btnBack) {
    btnBack.addEventListener('click', () => {
      playerIframe.src = ""; // stoppe la lecture
      playerMain.style.display = 'none';
      main.style.display = 'block';
    });
  }

  // Bouton Regarder
  const btnWatch = document.getElementById('btnWatch');
  if (btnWatch) {
    btnWatch.addEventListener('click', () => {
      const season = btnWatch.dataset.season || 1;
      const episode = btnWatch.dataset.episode || 1;
      playEpisode(season, episode);
    });
  }

  // Tous les episode-card
  const episodeCards = document.querySelectorAll('.episode-card');
  episodeCards.forEach(card => {
    card.addEventListener('click', () => {
      const season = card.dataset.season || 1;
      const episode = card.dataset.episode || 1;
      playEpisode(season, episode);
    });
  });
}



async function extractDetails(url) {
    try {
        if(url.includes('/movie/')) {
            const match = url.match(/https:\/\/net3lix\.world\/watch\/movie\/([^\/]+)/);
            if (!match) throw new Error("Invalid URL format");

            const movieId = match[1];
            const responseText = await soraFetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=ad301b7cc82ffe19273e55e4d4206885`);
            const data = await responseText.json();

            const transformedResults = [{
                description: data.overview || 'No description available',
                aliases: `Duration: ${data.runtime ? data.runtime + " minutes" : 'Unknown'}`,
                airdate: `Released: ${data.release_date ? data.release_date : 'Unknown'}`
            }];

            return JSON.stringify(transformedResults);
        } else if(url.includes('/tv/')) {
            const match = url.match(/https:\/\/net3lix\.world\/watch\/tv\/([^\/]+)/);
            if (!match) throw new Error("Invalid URL format");

            const showId = match[1];
            const responseText = await soraFetch(`https://api.themoviedb.org/3/tv/${showId}?api_key=ad301b7cc82ffe19273e55e4d4206885`);
            const data = await responseText.json();

            const transformedResults = [{
                description: data.overview || 'No description available',
                aliases: `Duration: ${data.episode_run_time && data.episode_run_time.length ? data.episode_run_time.join(', ') + " minutes" : 'Unknown'}`,
                airdate: `Aired: ${data.first_air_date ? data.first_air_date : 'Unknown'}`
            }];

            console.log(JSON.stringify(transformedResults));
            return JSON.stringify(transformedResults);
        } else {
            throw new Error("Invalid URL format");
        }
    } catch (error) {
        console.log('Details error: ' + error);
        return JSON.stringify([{
            description: 'Error loading description',
            aliases: 'Duration: Unknown',
            airdate: 'Aired/Released: Unknown'
        }]);
    }
}

async function extractEpisodes(url) {
    try {
        if (url.includes('/movie/')) {
            const match = url.match(/https:\/\/net3lix\.world\/watch\/movie\/([^\/]+)/);
            if (!match) throw new Error("Invalid URL format");

            const movieId = match[1];

            return JSON.stringify([
                {
                    href: `https://net3lix.world/watch/movie/${movieId}`,
                    season: 1,
                    number: 1,
                    title: "Full Movie",
                    duration: null // tu peux mettre null ou la durée si tu veux la chercher aussi via TMDB
                }
            ]);
        } else if (url.includes('/tv/')) {
            const match = url.match(/https:\/\/net3lix\.world\/watch\/tv\/([^\/]+)/);
            if (!match) throw new Error("Invalid URL format");

            const showId = match[1];
            const showResponseText = await soraFetch(`https://api.themoviedb.org/3/tv/${showId}?api_key=ad301b7cc82ffe19273e55e4d4206885`);
            const showData = await showResponseText.json();

            let allEpisodes = [];
            for (const season of showData.seasons) {
                if (!season.season_number || season.season_number < 1) continue;

                const seasonNumber = season.season_number;
                const seasonResponseText = await soraFetch(
                    `https://api.themoviedb.org/3/tv/${showId}/season/${seasonNumber}?api_key=ad301b7cc82ffe19273e55e4d4206885`
                );
                const seasonData = await seasonResponseText.json();

                if (seasonData.episodes && seasonData.episodes.length) {
                    const episodes = seasonData.episodes.map((episode) => {
                        return {
                            href: `https://net3lix.world/watch/tv/${showId}/${seasonNumber}/${episode.episode_number}`,
                            season: seasonNumber,
                            number: episode.episode_number,
                            title: episode.name || "",
                            duration: episode.runtime || null // runtime en minutes
                        };
                    });
                    allEpisodes = allEpisodes.concat(episodes);
                }
            }

            console.log('All Episodes: ' + JSON.stringify(allEpisodes));
            return JSON.stringify(allEpisodes);
        } else {
            throw new Error("Invalid URL format");
        }
    } catch (error) {
        console.log('Fetch error in extractEpisodes: ' + error);
        return JSON.stringify([]);
    }
}

async function soraFetch(url, options = { headers: {}, method: 'GET', body: null, encoding: 'utf-8' }) {
    try {
        return await fetchv2(
            url,
            options.headers ?? {},
            options.method ?? 'GET',
            options.body ?? null,
            true,
            options.encoding ?? 'utf-8'
        );
    } catch(e) {
        try {
            return await fetch(url, options);
        } catch(error) {
            return null;
        }
    }
}
