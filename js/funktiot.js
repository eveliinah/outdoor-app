function maakuntaTarkastaja() { //tarkistetaan haetaanko koko Suomen kohteet vai tietty maakunta
  if (valittuMaakunta.value === '--Valitse maakunta--' ||
      valittuMaakunta.value === '--Etelä-Suomi--' || valittuMaakunta.value ===
      '--Pohjois-Suomi--' || valittuMaakunta.value === '--Länsi-Suomi--' ||
      valittuMaakunta.value === '--Itä-Suomi--') {
    maakunta = 'ei valintaa';
  } else if (valittuMaakunta.value === 'Koko Suomi') {
    maakunta = '';
  } else {
    maakunta = valittuMaakunta.value;
  }
}

function markkerienPoisto() {
  if (markkeriLista.length > 0) {
    for (let i = 0; i < markkeriLista.length; i++) { //käydään markkerilista läpi ja poistetaan ne kaikki
      markkeriLista[i].remove();
    }
  }
}

function error(err) {
  alert('Salli sijainnin käyttö nähdäksesi oman sijaintisi kartalla!');
  crd = {
    latitude: 60.166640739, longitude: 24.943536799,
  };
  map.setView([crd.latitude, crd.longitude], 13);
  const sijainti = lisaaMarker(crd, 'Helsinki', sijaintiIkoni);
  sijainti.openPopup();
}

function success(pos) {
  crd = pos.coords;
  map.setView([crd.latitude, crd.longitude], 13);
  const sijainti = lisaaMarker(crd, 'Olet tässä', sijaintiIkoni);
  sijainti.openPopup();
}

function reitinPoistaja() {
  if (routingControl !== '') {
    map.removeControl(routingControl);
    routingControl = '';
  }
}

function navigointi() {

  if (routingControl === '') {
    routingControl = L.Routing.control({
      waypoints: [
        L.latLng(crd.latitude, crd.longitude),
        L.latLng(viimeksiKlikatutKoordinaatit.latitude,
            viimeksiKlikatutKoordinaatit.longitude),
      ],
    }).addTo(map);
  } else {
    map.removeControl(routingControl);
    routingControl = L.Routing.control({
      waypoints: [
        L.latLng(crd.latitude, crd.longitude),
        L.latLng(viimeksiKlikatutKoordinaatit.latitude,
            viimeksiKlikatutKoordinaatit.longitude),
      ],
    }).addTo(map);
    window.addEventListener('resize', naytonKokoMuuttui);
  }
}

//Valitsee oikean ikonin luotavalle markkerille
function ikoninValitsin() {
  switch (tyyppi) {
    case 'Nuotiopaikka':
      ikoni = nuotioIkoni;
      break;
    case 'Lintutorni':
      ikoni = lintutorniIkoni;
      break;
    case 'Luola':
      ikoni = luolaIkoni;
      break;
    case 'Sauna':
      ikoni = saunaIkoni;
      break;
    case 'Lähde':
      ikoni = lahdeIkoni;
      break;
    case 'Nähtävyys':
      ikoni = nahtavyysIkoni;
      break;
    case 'Varaustupa':
      ikoni = varaustupaIkoni;
      break;
    case 'Autiotupa':
      ikoni = tupaIkoni;
      break;
    case 'Päivätupa':
      ikoni = tupaIkoni;
      break;
    case 'Kammi':
      ikoni = kammiIkoni;
      break;
    case 'Laavu':
      ikoni = laavuIkoni;
      break;
    case 'Kota':
      ikoni = kotaIkoni;
      break;
    case 'Ruokailukatos':
      ikoni = ruokailukatosIkoni;
      break;
  }
}


function haeNaytettavatKohteet() {
  haettavatKohteet = [];
  checkBoxVaihtoehdot.forEach(kohde => {
    if (kohde.checked) {
      haettavatKohteet.push(kohde.value);
    }
  });
}

//hakee lintuhavainnot 50 kilometrin säteellä koordinaateista, käytetään lintutornin klikkauksen yhteydessä
function haeLintuHavainnot(crd) {
  const key = 'yourKeyHere';
  const proxy = 'https://api.allorigins.win/get?url=';
  const haku = `https://api.ebird.org/v2/data/obs/geo/recent?lat=${crd.latitude}&lng=${crd.longitude}&key=${key}&sppLocale=FI&dist=50&includeProvisional=true`;
  const url = proxy + encodeURIComponent(haku);

  return fetch(url).then(function(vastaus) {
    return vastaus.json();
  }).then(function(data) {
    const lintuHavainnot = JSON.parse(data.contents);
    return lintuHavainnot;
  });
}

//lintuhavaintojen markkerit poistuvat kartalta uutta tornia klikattaessa
function poistaLinnut() {
  if (markkeriListaLinnut.length > 0) {
    for (let i = 0; i < markkeriListaLinnut.length; i++) { //käydään markkerilista läpi ja poistetaan ne kaikki
      markkeriListaLinnut[i].remove();
    }
  }
}

//fetchaa kohteet haun mukaan, palauttaa nullin jos niitä ei löydy
function haeKohteet() {
  const proxy = 'https://api.allorigins.win/get?url=';
  const haku = `https://tulikartta.fi/api-json2.php?tyyppi=${tyyppi}&maakunta=${maakunta}`;
  const url = proxy + encodeURIComponent(haku);
  return fetch(url).then(function(vastaus) {
    return vastaus.json();
  }).then(function(data) {
    const kohteet = JSON.parse(data.contents);
    if (kohteet.length == 0) {
      return null;
    } else {
      return kohteet;
    }
  });
}

function lisaaMarker(crd, teksti, ikoni) {
  return L.marker([crd.latitude, crd.longitude], {icon: ikoni}).
      addTo(map).
      bindPopup(teksti);
}

function avaaSivuvalikko() {
  document.getElementById('sivuvalikko').style.width = '300px';
  document.getElementById('sivuvalikko').style.paddingLeft = '15px';
}

function suljeSivuvalikko() {
  document.getElementById('sivuvalikko').style.width = '0';
  document.getElementById('sivuvalikko').style.paddingLeft = '0';
}

function naytonKokoMuuttui() {

  if (window.innerWidth > 1000) {
    document.querySelector('aside').classList.replace('sivuvalikko', 'iso');
    document.querySelector('aside').style.width = '300px';
  } else {
    document.querySelector('aside').classList.replace('iso', 'sivuvalikko');
    document.getElementById('sivuvalikko').style.paddingLeft = '15px';
  }
}
