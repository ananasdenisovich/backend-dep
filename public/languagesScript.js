let selectedLanguage = 'english';
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('englishTab').addEventListener('click', function () {
    selectedLanguage = 'english'
    fetchBooks('english');
  });

  document.getElementById('frenchTab').addEventListener('click', function () {
    selectedLanguage = 'french'
    fetchBooks('french');
  });

  document.getElementById('russianTab').addEventListener('click', function () {
    selectedLanguage = 'russian'
    fetchBooks('russian');
  });

  fetchBooks(selectedLanguage);
});
function applySorting() {
  const selectedLanguage = getSelectedLanguage();
  const selectedSortOption = getSelectedSortOption();

  fetch(`/books?language=${selectedLanguage}&sortBy=${selectedSortOption}`)
      .then(response => response.json())
      .then(books => {
        updateTabContent(selectedLanguage, books);
      })
      .catch(error => {
        console.error('Error fetching books:', error);
      });
}
function getSelectedSortOption() {
  const sortOptions = document.getElementById('sortOptions');
  return sortOptions.options[sortOptions.selectedIndex].value;
}

function getSelectedLanguage() {
  return selectedLanguage;
}
function applyFilters() {
  const selectedLanguage = getSelectedLanguage();
  const selectedSortOption = getSelectedSortOption();
  const selectedLevel = document.getElementById('levelFilter').value;
  const selectedAuthor = document.getElementById('authorFilter').value;
  const selectedPublisher = document.getElementById('publisherFilter').value;

  fetch(`/books?language=${selectedLanguage}&sortBy=${selectedSortOption}&level=${selectedLevel}&author=${selectedAuthor}&publisher=${selectedPublisher}`)
      .then(response => response.json())
      .then(books => {
        updateTabContent(selectedLanguage, books);
      })
      .catch(error => {
        console.error('Error fetching books:', error);
      });
}




function fetchBooks(language, level, author, publisher) {
  const url = `/books/${language}?level=${level}&author=${author}&publisher=${publisher}`;

  fetch(url)
      .then(response => response.json())
      .then(books => {
        updateTabContent(language, books);
      })
      .catch(error => {
        console.error('Error fetching books:', error);
      });
}



function updateTabContent(language, books) {
  document.querySelectorAll('.tab-pane').forEach(tab => {
    tab.style.display = 'none';
  });

  const tabContent = document.getElementById(language);

  tabContent.innerHTML = '';

  if (books.length > 0) {
    const cardContainer = document.createElement('div');
    cardContainer.classList.add('card-container');

    books.forEach(book => {
      const card = document.createElement('div');
      card.classList.add('card');

      const image = document.createElement('img');
      image.classList.add('card-img');
      image.src = book.url;
      image.alt = book.title;

      const cardBody = document.createElement('div');
      cardBody.classList.add('card-body');

      const title = document.createElement('h5');
      title.classList.add('card-title');
      title.textContent = book.title;

      const author = document.createElement('p');
      author.classList.add('card-text');
      author.textContent = `Author: ${book.author}`;

      const level = document.createElement('p');
      level.classList.add('card-text');
      level.textContent = `Level: ${book.level}`;

      const publisher = document.createElement('p');
      publisher.classList.add('card-text');
      publisher.textContent = `Publisher: ${book.publisher}`;

      const link = document.createElement('a');
      console.log(book.link);
      link.href = book.link;
      link.target = '_blank';
      link.textContent = 'View PDF';

      cardBody.appendChild(title);
      cardBody.appendChild(author);
      cardBody.appendChild(level);
      cardBody.appendChild(publisher);
      cardBody.appendChild(link);

      card.appendChild(image);
      card.appendChild(cardBody);

      cardContainer.appendChild(card);
    });

    tabContent.appendChild(cardContainer);
  } else {
    tabContent.textContent = `No ${language.charAt(0).toUpperCase() + language.slice(1)} books available.`;
  }

  tabContent.style.display = 'block';
}