const searchInput = document.getElementById('searchInput');
const filmGrid = document.getElementById('filmGrid');


updateResults();
searchInput.addEventListener('input', updateResults);

async function updateResults() {
  const keyword = searchInput.value.trim();

  // Si rien n'est tapé, on peut vider la grille
  if (!keyword) {
    filmGrid.innerHTML = '';
    return;
  }

  try {
    // Appelle la fonction searchResults fournie
    const resultsJSON = await searchResults(keyword);
    const results = JSON.parse(resultsJSON);

    // Transforme les résultats en HTML
    filmGrid.innerHTML = results
      .filter(r => r) // filtre les résultats nuls ou undefined
      .map(film => {
        // Extraire un id depuis href (ex: /watch/movie/123)
        let idMatch = film.href.match(/\/(movie|tv)\/(\d+)/);
		let filmType = idMatch ? idMatch[1] : '';
        let filmId = idMatch ? idMatch[2] : '';

        return `
        <div class="film">
          <img src="${film.image || 'placeholder.png'}" alt="${film.title}">
          <h3><a href="./film.html?type=${filmType}&id=${filmId}">${film.title}</a></h3>
        </div>
        `;
      })
        .join('');
  } catch (error) {
    console.error('Erreur affichage films :', error);
  }

  // Récupère tous les éléments de film 
  const films = document.querySelectorAll('.film'); 
   
  // Pour chaque élément de film 
  films.forEach(film => { 
    // Récupère le titre du film 
    const titre = film.querySelector('h3 a').textContent; 
    // Récupère l'URL du film 
    const url = film.querySelector('h3 a').getAttribute('href'); 
  
    // Ajoute l'attribut title au film 
    film.setAttribute('title', titre); 
  
    // Ajoute un événement de clic sur l'élément de film 
    film.addEventListener('click', () => { 
      // Redirige vers la page du film 
      window.location.href = url; 
    }); 
  });
}


async function searchResults(keyword) {
    try {
        const encodedKeyword = encodeURIComponent(keyword);
        const responseText = await soraFetch(`https://api.themoviedb.org/3/search/multi?api_key=9801b6b0548ad57581d111ea690c85c8&query=${encodedKeyword}&include_adult=false`);
        const data = await responseText.json();

        const transformedResults = [
            ...data.results.map(result => {
                const image = result.poster_path
                    ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
                    : "";

                if (result.media_type === "movie") {
                    return {
                        title: result.title || result.original_title || result.name || result.original_name || "Untitled",
                        image,
                        href: `https://net3lix.world/watch/movie/${result.id}`
                    };
                }

                if (result.media_type === "tv") {
                    return {
                        title: result.name || result.original_name || result.title || result.original_title || "Untitled",
                        image,
                        href: `https://net3lix.world/watch/tv/${result.id}/1/1`
                    };
                }
            })
        ];

        console.log('Transformed Results: ' + transformedResults);
        return JSON.stringify(transformedResults);
    } catch (error) {
        console.log('Fetch error in searchResults:' + error);
        return JSON.stringify([{ title: 'Error', image: '', href: '' }]);
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
