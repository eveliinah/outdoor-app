'use strict';
if (window.innerWidth > 1000) {
  document.querySelector('aside').classList.replace('sivuvalikko', 'iso');
}

const map = L.map('map', {zoomControl: false});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

const options = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0,
};

let routingControl = '';
const sijaintiIkoni = L.divIcon({className: 'sijainti-ikoni'}); //sijainti
const lintuIkoni = L.divIcon({className: 'lintu-ikoni'}); //lintuhavainto
const nuotioIkoni = L.divIcon({className: 'nuotio-ikoni'}); //nuotiopaikka
const lintutorniIkoni = L.divIcon({className: 'lintutorni-ikoni'}); //lintutorni
const luolaIkoni = L.divIcon({className: 'luola-ikoni'}); //luola
const lahdeIkoni = L.divIcon({className: 'lahde-ikoni'}); //lähde
const nahtavyysIkoni = L.divIcon({className: 'nahtavyys-ikoni'}); //nähtävyys
const saunaIkoni = L.divIcon({className: 'sauna-ikoni'}); //sauna
const tupaIkoni = L.divIcon({className: 'tupa-ikoni'}); //tupa
const laavuIkoni = L.divIcon({className: 'laavu-ikoni'}); //laavu
const ruokailukatosIkoni = L.divIcon({className: 'ruokailukatos-ikoni'}); //ruokailukatos
const kotaIkoni = L.divIcon({className: 'kota-ikoni'}); //kota
const kammiIkoni = L.divIcon({className: 'kammi-ikoni'}); //kammi
const varaustupaIkoni = L.divIcon({className: 'varaustupa-ikoni'}); //varaustupa

let tyyppi = '';
let maakunta = '';
let crd;
let viimeksiKlikatutKoordinaatit;
let ikoni;
let kordinaatitLista;

navigator.geolocation.getCurrentPosition(success, error, options);

const lomake = document.querySelector('form');
const valittuMaakunta = document.querySelector('select');
let haettavatKohteet = [];
const markkeriLista = [];
const markkeriListaLinnut = [];
const checkBoxVaihtoehdot = lomake.querySelectorAll('input[type=checkbox]');

lomake.addEventListener('submit', function(evt) { //nappia painaessa lomakkeelta maakunnan ja kohteiden haku ja niiden lisääminen kartalle
  evt.preventDefault();
  reitinPoistaja();
  markkerienPoisto();
  poistaLinnut();
  maakuntaTarkastaja();
  if (maakunta === 'ei valintaa') {
    alert('Valitse maakunta');
  } else {
    haeNaytettavatKohteet();

    for (let i = 0; i < haettavatKohteet.length; i++) { //tehdään haku yhtä monta kertaa kuin näytettäviä kohteita on valittu checkboksiin
      tyyppi = haettavatKohteet[i];

      haeKohteet().then(function(kohteet) {

        if (kohteet !== null) {

          for (let i = 0; i < kohteet.length; i++) {
            let sijainti = kohteet[i].koordinaatti;
            const nimi = kohteet[i].nimi;
            kordinaatitLista = sijainti.split(',');
            const koordinaatit = {
              latitude: kordinaatitLista[0],
              longitude: kordinaatitLista[1],
            };

            const koordinaatitPopup = '<details>' +
                '<summary>koordinaatit</summary>' +
                '<b>' + 'lat: ' + '</b>' + koordinaatit.latitude +
                '<br>' + '<b>' + 'lon: ' + '</b>' + koordinaatit.longitude +
                '</details>';
            const teksti = '<br><b>' + nimi + '</b>' + '<br>' +
                koordinaatitPopup;

            tyyppi = kohteet[i].tyyppi;

            ikoninValitsin();

            const markkeri = lisaaMarker(koordinaatit, teksti, ikoni);
            markkeriLista.push(markkeri);   //lisätään markkeri markkerilistalle

            markkeri.on('click', function() {
              viimeksiKlikatutKoordinaatit = koordinaatit;
              poistaLinnut();

              const key = 'yourKeyHere';
              const proxy = 'https://api.allorigins.win/get?url=';
              const saaLat = Number(koordinaatit.latitude).toFixed(6);
              const saaLong = Number(koordinaatit.longitude).toFixed(6);
              const haku = `https://api.openweathermap.org/data/2.5/weather?lat=${saaLat}&lon=${saaLong}&appid=${key}&units=metric&lang=FI`;
              const url = proxy + encodeURIComponent(haku);

              return fetch(url).then(function(vastaus) {
                return vastaus.json();
              }).then(function(data) {
                const keli = JSON.parse(data.contents);
                const saaIkoni = keli.weather[0].icon;
                const saaKuva = '<img src="http://openweathermap.org/img/wn/' +
                    saaIkoni + '@2x.png"</img>';
                const saa = keli.weather[0].description.charAt(0).
                        toUpperCase() +
                    keli.weather[0].description.slice(1);
                const lampotila = keli.main.temp;
                const tuntuuKuin = keli.main.feels_like;
                const tuulenNopeus = 'Tuulen nopeus: ' + keli.wind.speed +
                    ' m/s';
                const navigointiNappi = '<button id="nappi", onclick= \'navigointi()\'>Navigoi</button>';

                markkeri._popup.setContent(
                    teksti + '<br>'
                    + saaKuva + '<h2>' + lampotila + ' °C</h2>' + saa +
                    '<br><br>'
                    + 'Tuntuu kuin: ' + tuntuuKuin + ' °C<br>'
                    + tuulenNopeus + '<br><br>'
                    + navigointiNappi);
                markkeri.getPopup().update();

                if (ikoni.options.className === 'lintutorni-ikoni') {
                  haeLintuHavainnot(koordinaatit).
                      then(function(lintuHavainnot) {

                        for (let i = 0; i < lintuHavainnot.length; i++) {
                          const nimi = lintuHavainnot[i].comName.charAt(0).
                                  toUpperCase() +
                              lintuHavainnot[i].comName.slice(1); //vakiosti nimi alkaa pienellä alkukirjaimella
                          const lkm = 'lukumäärä: ' + lintuHavainnot[i].howMany;
                          const koskaHavaittu = 'havaittu: ' +
                              lintuHavainnot[i].obsDt;
                          const teksti = '<br><b>' + nimi + '</b>' + '<p>' +
                              lkm +
                              '<br>' + koskaHavaittu + '</p>';

                          const koordinaatit = {
                            latitude: lintuHavainnot[i].lat,
                            longitude: lintuHavainnot[i].lng,
                          };

                          const markkeri = lisaaMarker(koordinaatit, teksti,
                              lintuIkoni);

                          markkeriListaLinnut.push(markkeri);
                        }
                      });
                }
              });
            });
          }
        } else {
          alert('Valitsemaltasi alueelta ei löydy kohdetta: ' +
              haettavatKohteet[i]);
        }
        map.setView([kordinaatitLista[0], kordinaatitLista[1]], 7);
        window.addEventListener('resize', naytonKokoMuuttui);
      });
    }
  }
});

window.addEventListener('resize', naytonKokoMuuttui);
