class ZOMATO {
    constructor() {
        this.APIKEY = `4e4c1ecf37d2943fc37784f7efa322a2`;
        this.header = {
            method: 'GET',
            headers: {
                'user-key': this.APIKEY,
                'content-type': 'application/json',
            },
            credentials: 'same-origin'
        };
    }

    async searchAPI(city, categoryID) {
        const categoryURL = 'https://developers.zomato.com/api/v2.1/categories';
        const cityURL = `https://developers.zomato.com/api/v2.1/cities?q=${city}`;

        const categoryInfo = await fetch(categoryURL, this.header);
        const categoryJSOn = await categoryInfo.json();
        const categories = await categoryJSOn.categories;

        const cityInfo = await fetch(cityURL, this.header);
        const cityJSON = await cityInfo.json();
        const cityLoaction = await cityJSON.location_suggestions;

        let cityID = 0;

        if (cityLoaction.length > 0) {
            cityID = await cityLoaction[0].id
        }

        const restaurantURL = `https://developers.zomato.com/api/v2.1/search?entity_id=${cityID}&entity_type=city&category=${categoryID}&sort=rating&order=desc`;

        const restaurantInfo = await fetch(restaurantURL, this.header);
        const restaurantJSON = await restaurantInfo.json();
        const restaurants = await restaurantJSON.restaurants;

        return {
            categories,
            cityID,
            restaurants
        };
    }

};

class UI {
    constructor() {
        this.loader = document.querySelector('.loader');
        this.restaurantList = document.getElementById('restaurant-list');
    }

    addSelectOptions(categories) {
        const search = document.getElementById('searchCategory');
        let output = `<option value='0' selected>selected category</option>`;
        categories.forEach(category => {
            output += `<option value='${category.categories.id}'>${category.categories.name}</option>`;
        });
        search.innerHTML = output;
    }

    showFeedback(text) {
        const feedback = document.querySelector('.feedback');
        feedback.innerHTML = `${text}`;
        feedback.classList.add('showItem');

        setTimeout(() => {
            feedback.classList.remove('showItem');
        }, 3000);
    }

    showLoader() {
        this.loader.classList.add('showItem');
    }

    hideLoader() {
        this.loader.classList.remove('showItem');
    }

    getRestaurants(restaurants) {
        this.hideLoader();
        if (restaurants.length === 0) {
            this.showFeedback('Category Is Currently Unavailable For The Selected City');
        } else {
            this.restaurantList.innerHTML = '';
            restaurants.forEach(restaurant => {
                const {
                    thumb: img,
                    name,
                    location: {
                        address
                    },
                    user_rating: {
                        aggregate_rating,
                        rating_text
                    },
                    cuisines,
                    average_cost_for_two: cost,
                    menu_url,
                    url
                } = restaurant.restaurant;
                if (img !== '') {
                    this.showRestaurant(img, name, address, aggregate_rating, rating_text, cuisines, cost, menu_url, url);
                }
            })
        }
    }

    showRestaurant(img, name, address, aggregate_rating, rating_text, cuisines, cost, menu_url, url) {
        const div = document.createElement('div');

        div.classList.add('col-11', 'mx-auto', 'my-3', 'col-md-4');
        div.innerHTML = `
        <div class="card">
      <div class="card">
       <div class="row p-3">
        <div class="col-5">
         <img src="${img}" class="img-fluid img-thumbnail" alt="">
        </div>
        <div class="col-5 text-capitalize">
         <h6 class="text-uppercase pt-2 redText">${name}</h6>
         <p>${address}</p>
        </div>
        <div class="col-1">
         <div class="badge badge-success">
          ${aggregate_rating}
         </div>
        </div>
        <div class="col-1">
        <div class="badge badge-success">
         ${rating_text}
        </div>
       </div>
       </div>
       <hr>
       <div class="row py-3 ml-1">
        <div class="col-5 text-uppercase ">
         <p>cousines : </p>
         <p>cost for two :</p>
        </div>
        <div class="col-7 text-uppercase">
         <p>${cuisines}</p>
         <p> ${cost}</p>
        </div>
       </div>
       <hr>
       <div class="row text-center no-gutters pb-3">
        <div class="col-6">
         <a href="${menu_url}" target="_blank" class="btn redBtn  text-uppercase"><i class="fas fa-book"></i> menu</a>
        </div>
        <div class="col-6">
         <a href="${url}" target="_blank" class="btn redBtn  text-uppercase"><i class="fas fa-book"></i> website</a>
        </div>
       </div>
      </div>`;
        this.restaurantList.appendChild(div);
    }
};

(() => {
    const searchForm = document.getElementById('searchForm');
    const searchCategory = document.getElementById('searchCategory');
    const searchCity = document.getElementById('searchCity');

    const zomato = new ZOMATO();
    const ui = new UI();

    document.addEventListener('DOMContentLoaded', e => {
        zomato.searchAPI().then(data => ui.addSelectOptions(data.categories)).catch(err => console.log(err));
    });


    searchForm.addEventListener('submit', e => {
        e.preventDefault();

        let city = searchCity.value.toLowerCase();
        let category = parseInt(searchCategory.value);

        if (city.length === 0 || category === 0) {
            ui.showFeedback('Invalid Input');
        } else {
            ui.showLoader();
            zomato.searchAPI(city).then(cityData => {
                if (cityData.cityID === 0) {
                    ui.showFeedback('Invalid City Name');
                    ui.hideLoader();
                } else {
                    zomato.searchAPI(city, category).then(data => ui.getRestaurants(data.restaurants));
                }
            })
        }
    })
})()