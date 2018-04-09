import axios from 'axios';
import dompurify from 'dompurify';

function searchResultsHTML(attractions) {
  return attractions
    .map(
      attraction => `
      <a href="/attraction/${attraction.slug}" class="search__result">
        <strong>${attraction.name}</strong>
      </a>
    `
    )
    .join('');
}

function typeAhead(search) {
  if (!search) return;

  const searchInput = search.querySelector('input[name="search"');
  const searchResults = search.querySelector('.search__results');

  searchInput.on('input', function() {
    // if there's no value, quit it
    if (!this.value) {
      searchResults.style.display = 'none';
      return; // stop
    }

    // show the search results!
    searchResults.style.display = 'block';
    // don't display anything when there's no results
    searchResults.innerHTML = '';
    axios
      // first get attractions that match the search
      .get(`/api/search?q=${this.value}`)
      // then display them
      .then(res => {
        if (res.data.length) {
          searchResults.innerHTML = dompurify.sanitize(searchResultsHTML(res.data));
          return;
        }
        // tell them nothing came back
        searchResults.innerHTML = dompurify.sanitize(
          `<div class="search__result">No results for ${this.value} found!</div>`
        );
      })
      .catch(err => {
        console.error(err);
      });
  });

  // handle keyboard inputs
  searchInput.on('keyup', e => {
    // if they aren't pressing up, down or enter, ignore
    if (![38, 40, 13].includes(e.keyCode)) {
      return;
    }
    const activeClass = 'search__result--active';
    const current = search.querySelector(`.${activeClass}`);
    const items = search.querySelectorAll('.search__result');
    let next;
    // 40 = down arrow, 38 = up arrow, 13 = enter
    if (e.keyCode === 40 && current) {
      next = current.nextElementSibling || items[0];
    } else if (e.keyCode === 40) {
      [next] = items; // next = items[0];
    } else if (e.keyCode === 38 && current) {
      next = current.preiousElementsSibling || items[items.length - 1];
    } else if (e.keyCode === 38) {
      next = items[items.length - 1];
    } else if (e.keyCode === 13 && current.href) {
      window.location = current.href;
      return;
    }
    // if a search result is already active make it inactive to activate the next one
    if (current) {
      current.classList.remove(activeClass);
    }
    // make the next one active
    next.classList.add(activeClass);
  });
}

export default typeAhead;
