// instantiate idb variable for promises
// idb promise library by https://github.com/jakearchibald/idb
var dbPromise = idb.open('restaurant-idb', 3, function(upgradeDB) {
    switch (upgradeDB.oldVersion) {
        case 0: {
            upgradeDB.createObjectStore('restaurants', {keypath: 'id'});
        }
        case 1: {
            upgradeDB.createObjectStore('reviews', {autoIncrement: true});
        }
        case 2: {
            upgradeDB.createObjectStore('offlineData', {autoIncrement: true});
        }
    }
})

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