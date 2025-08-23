const searchInput = document.getElementById('searchInput');
const filmGrid = document.getElementById('filmGrid');

updateResults();
searchInput.addEventListener('input', updateResults);

async function updateResults() {
  const keyword = searchInput.value.trim();

  if (!keyword) {
    filmGrid.innerHTML = '';
    return;
  }

  try {
    const results = await searchResults(keyword);

    filmGrid.innerHTML = results
      .filter(r => r)
      .map(film => {
        // Extraire type et id depuis href (ex: /watch/movie/123)
        const idMatch = film.href.match(/\/(movie|tv)\/(\d+)/);
        const filmType = idMatch ? idMatch[1] : '';
        const filmId = idMatch ? idMatch[2] : '';

        return `
          <div class="film" title="${film.title}">
            <a href="./film.html?type=${filmType}&id=${filmId}">
              <img src="${film.image || 'placeholder.png'}" alt="${film.title}">
              <h3>${film.title}</h3>
            </a>
          </div>
        `;
      })
      .join('');
  } catch (error) {
    console.error('Erreur affichage films :', error);
  }
}

async function searchResults(keyword) {
  try {
    const encodedKeyword = encodeURIComponent(keyword);
    const response = await fetch(
      `https://api.themoviedb.org/3/search/multi?api_key=9801b6b0548ad57581d111ea690c85c8&query=${encodedKeyword}&include_adult=false`
    );
    const data = await response.json();

    return data.results
      .map(result => {
        const image = result.poster_path
          ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
          : '';

        if (result.media_type === 'movie') {
          return {
            title: result.title || result.original_title || "Untitled",
            image,
            href: `/watch/movie/${result.id}`,
          };
        }

        if (result.media_type === 'tv') {
          return {
            title: result.name || result.original_name || "Untitled",
            image,
            href: `/watch/tv/${result.id}/1/1`,
          };
        }

        return null;
      })
      .filter(Boolean);
  } catch (error) {
    console.error('Fetch error in searchResults:', error);
    return [];
  }
}
