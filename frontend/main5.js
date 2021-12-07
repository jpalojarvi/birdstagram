'use strict';
const url = 'http://localhost:3000'; // change url when uploading to server

// select existing html elements
const loginWrapper = document.querySelector('#login-wrapper');
const navBarPublic = document.querySelector('#navbar-public');
const navBarUser = document.querySelector('#navbar-user');
const userInfo = document.querySelector('#user-info');
const logOut = document.querySelector('#log-out');
const otsikko = document.querySelector('#otsikko');
const loginForm = document.querySelector('#login-form');
const addUserForm = document.querySelector('#add-user-form');
const addForm = document.querySelector('#add-cat-form');
const modForm = document.querySelector('#mod-cat-form');
const ul = document.querySelector('ul');
const userList = document.querySelector('.add-owner');
const imageModal = document.querySelector('#image-modal');
const modalImage = document.querySelector('#image-modal img');
const close = document.querySelector('#image-modal a');

// luxon date libary
const dt = luxon.DateTime;

// get user from sessionStorage
let user = JSON.parse(sessionStorage.getItem('user'));

console.log(user);
const startApp = (logged) => {
  console.log(logged);
  // show/hide forms + cats
  navBarPublic.style.display = logged ? 'none' : 'block';
  navBarUser.style.display = logged ? 'block' : 'none';
  loginWrapper.style.display = logged ? 'none' : 'none';
  //logOut.style.display = logged ? 'flex' : 'none';
  otsikko.style.display = logged ? 'none' : 'block';
  userInfo.innerHTML = logged ? `<span id="nimi">Hei</span> ${user.name}` : '';
  if (logged) {
    if (user?.role > 0) {
      
      userList.remove();
    }
    getCat();
    getUsers();
  }else {
    getCats();
  }
  
};

// create cat cards
const createCatCards = (cats) => {
  console.log('cats from getCat or getCats ', cats);
  // clear ul
  ul.innerHTML = '';
  cats.forEach((cat) => {
    // create li with DOM methods
    console.log('one cat', cat);
    const img = document.createElement('img');
    img.src = cat.filename;
    img.alt = cat.name;
    img.classList.add('resp');

    // open large image when clicking image
    img.addEventListener('click', () => {
      modalImage.src = url + '/' + cat.filename;
      imageModal.alt = cat.name;
      imageModal.classList.toggle('hide');
      try {
        const coords = JSON.parse(cat.coords);
        // console.log(coords);
        addMarker(coords);
      } catch (e) {}
    });

    const figure = document.createElement('figure').appendChild(img);

    const h2 = document.createElement('h2');
    h2.innerHTML = cat.name;

    const p1 = document.createElement('p');
    p1.innerHTML = `Birthdate: ${dt
      .fromISO(cat.birthdate)
      .setLocale('fi')
      .toLocaleString()}`;
    const p1b = document.createElement('p');
    p1b.innerHTML = `Age: ${dt
      .now()
      .diff(dt.fromISO(cat.birthdate), ['year'])
      .toFormat('y')}`;

    const p2 = document.createElement('p');
    p2.innerHTML = `Weight: ${cat.weight}kg`;

    const p3 = document.createElement('p');
    p3.innerHTML = `Owner: ${cat.ownername}`;

    const li = document.createElement('li');
    li.classList.add('light-border');

    li.appendChild(figure);
    li.appendChild(h2);
    li.appendChild(p1);
    li.appendChild(p1b);
    li.appendChild(p2);
    li.appendChild(p3);
    ul.appendChild(li);
    if (user.role === 0 || user.user_id === cat.owner || user.role === 1) {    
      // add modify button
      const modButton = document.createElement('button');
      modButton.innerHTML = 'Modify';
      modButton.addEventListener('click', () => {
        const inputs = modForm.querySelectorAll('input');
        inputs[0].value = cat.name;
        inputs[1].value = cat.birthdate;
        inputs[2].value = cat.weight;
        modForm.action = `${url}/cat/${cat.cat_id}`;
        if (user.role === 0) modForm.querySelector('select').value = cat.owner;
      });

      // delete selected cat
      const delButton = document.createElement('button');
      delButton.innerHTML = 'Delete';
      delButton.addEventListener('click', async () => {
        const fetchOptions = {
          method: 'DELETE',
          headers: {
            Authorization: 'Bearer ' + sessionStorage.getItem('token'),
          },
        };
        try {
          const response = await fetch(
            url + '/cat/' + cat.cat_id,
            fetchOptions
          );
          const json = await response.json();
          console.log('delete response', json);
          getCat();
        } catch (e) {
          console.log(e.message());
        }
      });
      li.appendChild(modButton);
      li.appendChild(delButton);
    }
  });
};

// close modal
close.addEventListener('click', (evt) => {
  evt.preventDefault();
  imageModal.classList.toggle('hide');
});

// AJAX call

const getCat = async () => {
  console.log('getCat token ', sessionStorage.getItem('token'));
  try {
    const options = {
      headers: {
        Authorization: 'Bearer ' + sessionStorage.getItem('token'),
      },
    };
    const response = await fetch(url + '/cat', options); 
    const cats = await response.json();
    createCatCards(cats);
  } catch (e) {
    console.log(e.message);
  }
};

const getCats = async () => {
  try {
    const response = await fetch(url + '/cat');
    const cats = await response.json();
    createCatCards(cats);
  } catch (e) {
    console.log(e.message);
  }
};

// create user options to <select>
const createUserOptions = (users) => {
  // clear user list
  userList.innerHTML = '';
  users.forEach((user) => {
    // create options with DOM methods
    const option = document.createElement('option');
    option.value = user.user_id;
    option.innerHTML = user.name;
    option.classList.add('light-border');
    userList.appendChild(option);
  });
};

// get users to form options
const getUsers = async () => {
  try {
    const options = {
      headers: {
        Authorization: 'Bearer ' + sessionStorage.getItem('token'),
      },
    };
    const response = await fetch(url + '/user', options);
    const users = await response.json();
    createUserOptions(users);
  } catch (e) {
    console.log(e.message);
  }
};

// submit add cat form
addForm.addEventListener('submit', async (evt) => {
  evt.preventDefault();
  const fd = new FormData(addForm);
  const fetchOptions = {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + sessionStorage.getItem('token'),
    },
    body: fd,
  };
  const response = await fetch(url + '/cat', fetchOptions);
  const json = await response.json();
  console.log('add response', json);
  getCat();
});

// submit modify form
modForm.addEventListener('submit', async (evt) => {
  evt.preventDefault();
  const data = serializeJson(modForm);
  const fetchOptions = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + sessionStorage.getItem('token'),
    },
    body: JSON.stringify(data),
  };

  console.log(fetchOptions);
  const response = await fetch(modForm.action, fetchOptions);
  const json = await response.json();
  console.log('modify response', json);
  getCat();
});

// login
loginForm.addEventListener('submit', async (evt) => {
  evt.preventDefault();
  const data = serializeJson(loginForm);
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  };

  const response = await fetch(url + '/auth/login', fetchOptions);
  const json = await response.json();
  if (!json.user) {
    alert(json.error.message);
  } else {
    // save token and user
    sessionStorage.setItem('token', json.token);
    sessionStorage.setItem('user', JSON.stringify(json.user));
    user = JSON.parse(sessionStorage.getItem('user'));
    startApp(true);
  }
});

// logout
logOut.addEventListener('click', async (evt) => {
  evt.preventDefault();
  try {
    const options = {
      headers: {
        Authorization: 'Bearer ' + sessionStorage.getItem('token'),
      },
    };
    const response = await fetch(url + '/auth/logout', options);
    const json = await response.json();
    console.log(json);
    // remove token
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    alert('You have logged out');
    startApp(false);
    location.reload(); //ladataan sivu uudestaan
  } catch (e) {
    console.log(e.message);
  }
});

// submit register form
addUserForm.addEventListener('submit', async (evt) => {
  evt.preventDefault();
  const data = serializeJson(addUserForm);
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  };
  const response = await fetch(url + '/auth/register', fetchOptions);
  const json = await response.json();
  if (json.error) {
    alert(json.error.message);
  } else {
    alert(json.message);
  }
});

// when app starts, check if token exists and hide login form, show logout button and main content, get cats and users
(async () => {
  if (sessionStorage.getItem('token') && sessionStorage.getItem('user')) {
    // check if token valid
    try {
      const fetchOptions = {
        headers: {
          Authorization: 'Bearer ' + sessionStorage.getItem('token'),
        },
      };
      const response = await fetch(url + '/user/token', fetchOptions);
      if (!response.ok) {
        startApp(false);
      } else {
        startApp(true);
      }
    } catch (e) {
      console.log(e.message);
    }
  } else {
    // when starting app and nothing in sessionStorage  = false
    startApp(false);
  }
})();
