// instantiate idb variable for promises
// idb promise library by https://github.com/jakearchibald/idb
var dbPromise = idb.open('restaurant-idb', 2, function(upgradeDB) {
    switch (upgradeDB.oldVersion) {
        case 0: {
            upgradeDB.createObjectStore('restaurants', {keypath: 'id'});
        }
        case 1: {
            const reviewDB = upgradeDB.createObjectStore('reviews', {autoIncrement: true});
            reviewDB.createIndex('restaurant_id', 'restaurant_id')
        }
    }

});

/**
 * Common database helper functions
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static get DATABASE_URL_REVIEWS() {
    const port = 1337
    return `http://localhost:${port}/reviews`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    dbPromise.then(function(db) {
      var tx = db.transaction("restaurants");
      var restStore = tx.objectStore("restaurants");
      return restStore.getAll();
    }).then(function(restaurants) {
        if (restaurants.length !== 0) {
          callback(null, restaurants)
        } else {
          fetch(DBHelper.DATABASE_URL)
            .then(response => response.json())
            .then(restaurants => {
              dbPromise.then(function(db) {
                var tx = db.transaction("restaurants", "readwrite");
                var restStore = tx.objectStore("restaurants");
                for (let restaurant of restaurants) {
                  restStore.put(restaurant, restaurant.id)
                }
                return tx.complete;
              }).then(console.log("Index DB populated."))
                .catch(function(err) {
                  console.log(err);
                })
                .finally(function(error) {
                  callback(null, restaurants)
                })
            })
            .catch(error => callback(error, null));
        }
    })
  }

  /**
   * Fetch a restaurant by its ID.
   */
   static fetchRestaurantById(id, callback) {
     dbPromise.then(function (db) {
       var tx = db.transaction("restaurants");
       var restStore = tx.objectStore("restaurants");
       return restStore.get(parseInt(id))
     }).then(function (restaurant) {
       if (restaurant) {
         callback(null, restaurant)
       } else { 
         fetch(DBHelper.DATABASE_URL + '/' + id)
           .then(response => response.json())
           .then(restaurants => callback(null, restaurants))
           .catch(error => callback(error, null))
       }
     })
   }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
 * Fetch all reviews
 */
  static fetchReviews(id, callback) {
    fetch(DBHelper.DATABASE_URL_REVIEWS + `/?restaurant_id=${id}`)
      .then(response => response.json())
      .then(data => callback(null, data))
      .catch(e => callback(e, null));
  }

  /**
   * Create restaurant review
   */
  static createRestaurantReview(id, name, rating, comments, callback) {
    const data = {
      'restaurant_id': id,
      'name': name,
      'rating': rating,
      'comments': comments
    };
    fetch(DBHelper.DATABASE_URL_REVIEWS + '/', {
      headers: { 'Content-Type': 'application/form-data' },
      method: 'POST',
      body: JSON.stringify(data)
    })
      .then(response => response.json())
      .then(data => callback(null, data))
      .catch(err => callback(err, null));
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.id}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

  static setToFavorite(id) {
    fetch(`${DBHelper.DATABASE_URL}/${id}/?is_favorite=true`, {
      method: 'PUT'
    });
  }

// http://localhost:1337/restaurants/<restaurant_id>/?is_favorite=false
static removeFromFavorites(id) {
    fetch(`${DBHelper.DATABASE_URL}/${id}/?is_favorite=false`, {
      method: 'PUT'
    });
  }

}

window.DBHelper = DBHelper;
