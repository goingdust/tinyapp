const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  'stevie': {
    username: 'stevie',
    email: 'steven@universe.com',
    password: '123'
  },
  'pearly': {
    username: 'pearly',
    email: 'pearl@gems.com',
    password: 'abc'
  }
};

const findUserByEmailAndUsername = (email, username) => {
  for (const userID in users) {
    const user = users[userID];
    if (email === user.email) {
      return [user, 'email'];
    } else if (username === user.username) {
      return [user, 'username'];
    }
  }
  return null;
};

app.get('/', (req, res) => {
  res.redirect('/urls');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/login', (req, res) => {
  const username = req.cookies['username'];
  const templateVars = {
    urls: urlDatabase,
    username: users[username]
  };
  res.render('urls_login', templateVars);
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send('the fields cannot be blank');
  }

  const user = findUserByEmailAndUsername(email);

  if (!user) {
    return res.status(403).send('a user with that email does not exist');
  } else if (password !== user[0].password) {
    return res.status(403).send('password does not match the password saved');
  } 
    
  res.cookie('username', user[0].username);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  const username = req.cookies['username'];
  const templateVars = {
    urls: urlDatabase,
    username: users[username]
  };
  res.render('urls_register', templateVars);
});

app.post('/register', (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;

  if (!username || !email || !password) {
    return res.status(400).send('the fields cannot be blank');
  }

  const user = findUserByEmailAndUsername(email, username);

  if (user && user[1] === 'username') {
    return res.status(400).send('a user with that username already exists');
  } else if (user && user[1] === 'email') {
    return res.status(400).send('a user with that email already exists');
  }

  users[username] = {
    username,
    email,
    password
  };

  res.cookie('username', users[username].username);

  console.log('users', users);
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  const username = req.cookies['username'];
  const templateVars = {
    urls: urlDatabase,
    username: users[username]
  };
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get('/urls/new', (req, res) => {
  const username = req.cookies['username'];
  const templateVars = {
    urls: urlDatabase,
    username: users[username]
  };
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const username = req.cookies['username'];
  const templateVars = {
    shortURL,
    longURL: urlDatabase[shortURL],
    username: users[username]
  };
  res.render('urls_show', templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.post('/urls/:shortURL', (req, res) => {
  for (const key in req.body) {
    urlDatabase[key] = req.body[key];
    res.redirect(`/urls/${key}`);
  }
});

app.post('/urls/:shortURL/delete', (req, res) => {
  for (const key in req.body) {
    delete urlDatabase[key];
  }
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const generateRandomString = function(length=6) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};