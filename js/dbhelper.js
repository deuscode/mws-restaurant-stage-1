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
    dbPromise.then(function(db) {
      var tx = db.transaction("reviews");
      var restStore = tx.objectStore("reviews");
      return restStore.getAll();
    }).then(function(reviews) {
        if (reviews.length !== 0) {
          callback(null, reviews)
        } else {
          fetch(DBHelper.DATABASE_URL_REVIEWS + `/?restaurant_id=${id}`)
          .then(response => response.json())
          .then(reviews => {
            dbPromise.then(function(db) {
              var tx = db.transaction("reviews", "readwrite");
              var restStore = tx.objectStore("reviews");
              for (let review of reviews) {
                restStore.put(review, review.id)
              }
              return tx.complete;
            }).then(console.log("review DB populated."))
              .catch(function(err) {
                console.log(err);
              })
              .finally(function(error) {
                callback(null, reviews)
              })
          })
          .catch(error => callback(error, null))
        }
    })
  }

  static createOfflineReview(review) {
    return dbPromise.then(db => {
      var tx = db.transaction('reviews', 'readwrite');
      var offlineStore = tx.objectStore('reviews');
      offlineStore.put(review);
      console.log("Review submitted!");
      return tx.complete;
    });
  }

  /**
   * Create restaurant review
   */
  static createRestaurantReview(id, name, rating, comments, callback) {
    const url = DBHelper.DATABASE_URL_REVIEWS + '/';
    const headers = {'Content-Type' : 'application/form-data'};
    const method = 'POST';

    const data = {
      'restaurant_id': id,
      'name': name,
      'rating': rating,
      'comments': comments
    };

    const body = JSON.stringify(data);

    fetch(url, {
      headers: headers,
      method: method,
      body: body
    })
      .then(response => response.json())
      .then(data => callback(null, data))
      .catch(err => {
        DBHelper.createOfflineReview(data)
          .then(review_id => {
            console.log('Review ID retrieved', review_id);
            DBHelper.queueData(url, headers, method, data, review_id)
            .then(offline_id => console.log('returned offline id', offline_id))
          })
      });
  }

  static queueData(url, headers, method, data, review_id) {
    const request = {
      url: url,
      headers: headers,
      method: method,
      data: data,
      review_key: review_id
    };
    return dbPromise.then(db => {
      const tx = db.transaction('offlineData', 'readwrite');
      const reviewStore = tx.objectStore('offlineData')
      reviewStore.put(request);
      tx.complete;
    }).then(offlineId => {
        console.log("Saved to offline store", request);
        return offlineId;
        });
  }

  static processOfflineData() {
    dbPromise.then(db => {
      if (!db) return;
      const tx = db.transaction(['offlineData'], 'readwrite');
      const store = tx.objectStore('offlineData');
      return store.openCursor();
    })
      .then(function nextRequest (cursor) {
        if (!cursor) {
          console.log('cursor completed');
          return;
        }
        console.log(cursor.value.data.name, cursor.value.data);
  
        const offline_id = cursor.id;
        const url = cursor.value.url;
        const headers = cursor.value.headers;
        const method = cursor.value.method;
        const data = cursor.value.data;
        const review_id = cursor.value.review_id;
        const body = JSON.stringify(data);
  
        fetch(url, {
          headers: headers,
          method: method,
          body: body
        })
          .then(response => response.json())
          .then(data => {
            console.log('Received updated record from DB Server', data);
            dbPromise.then(db => {
              const tx = db.transaction(['offlineData'], 'readwrite');
              tx.objectStore('offlineData').delete(offline_id);
              return tx.complete;
            })
              .then(() => {
                // 2. Add new review record to reviews store
                // 3. Delete old review record from reviews store 
                dbPromise.then(db => {
                  const tx = db.transaction(['reviews'], 'readwrite');
                  return tx.objectStore('reviews').put(data)
                    .then(() => tx.objectStore('reviews').delete(review_id))
                    .then(() => {
                      console.log('tx complete reached.');
                      return tx.complete;
                    })
                    .catch(err => {
                      tx.abort();
                      console.log('transaction error: tx aborted', err);
                    });
                })
                  .then(() => console.log('review transaction success!'))
                  .catch(err => console.log('reviews store error', err));
              })
              .then(() => console.log('offline rec delete success!'))
              .catch(err => console.log('offline store error', err));
          }).catch(err => {
            console.log('fetch error. we are offline.');
            console.log(err);
            return;
          });
        return cursor.continue().then(nextRequest);
      })
      .then(() => console.log('Done cursoring'))
      .catch(err => console.log('Error opening cursor', err));
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

  static removeFromFavorites(id) {
    fetch(`${DBHelper.DATABASE_URL}/${id}/?is_favorite=false`, {
      method: 'PUT'
    });
  }
}

window.DBHelper = DBHelper;
