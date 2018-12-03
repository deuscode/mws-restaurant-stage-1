// instantiate idb variable for promises
// idb promise library by https://github.com/jakearchibald/idb
var dbPromise = idb.open('restaurant-idb', 3, function(upgradeDB) {
    switch (upgradeDB.oldVersion) {
        case 0: {
            upgradeDB.createObjectStore('restaurants', {keypath: 'id',  unique: true});
        }
        case 1: {
            upgradeDB.createObjectStore('reviews', {autoIncrement: true});
        }
        case 2: {
            upgradeDB.createObjectStore('offlineData', {autoIncrement: true});
        }
    }
})

const favoriteHandler = (event, favorite, restaurant) => {
    event.preventDefault();
    const is_favorite = JSON.parse(restaurant.is_favorite); 
  
    DBHelper.setFavorites(restaurant, (error, restaurant) => {
      if (error) {
        showOffline();
      } else {
        DBHelper.updateRestIDB(restaurant); 
      }
    });
  
    // set ARIA, text, & labels
    if (is_favorite) {
      favorite.setAttribute('aria-pressed', 'false');
      favorite.innerHTML = `Make ${restaurant.name} your Fav!`;
      favorite.title = `Make ${restaurant.name} your Fav!`;
    } else {
      favorite.setAttribute('aria-pressed', 'true');
      favorite.innerHTML = `Un-Fav ${restaurant.name} :(`;
      favorite.title = `Un-Fav ${restaurant.name} :(`;
    }
    favorite.classList.toggle('active');
 };

const presentOffline = () => {
    document.querySelector('#offline').setAttribute('aria-hidden', false);
    document.querySelector('#offline').setAttribute('aria-live', 'assertive');
    document.querySelector('#offline').classList.add('show');
  
    wait(8000).then(() => {
      document.querySelector('#offline').setAttribute('aria-hidden', true);
      document.querySelector('#offline').setAttribute('aria-live', 'off');
      document.querySelector('#offline').classList.remove('show');
    });
  };