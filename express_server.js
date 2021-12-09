const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const { findUserByEmailAndUsername, urlsForUser, generateRandomString } = require('./helpers');

app.set('view engine', 'ejs');
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['username']
}));

const users = {
  'stevie': {
    username: 'stevie',
    email: 'steven@universe.com',
    password: bcrypt.hashSync('123', 10),
    urls: {
      'b2xVn2' : {
        longURL: 'http://www.lighthouselabs.ca',
        username: 'b2xVn2'
      }
    }
  },
  'pearly': {
    username: 'pearly',
    email: 'pearl@gems.com',
    password: bcrypt.hashSync('abc', 10),
    urls: {
      '9sm5xK': {
        longURL: 'http://www.google.com',
        username: '9sm5xK'
      }
    }
  }
};

app.get('/', (req, res) => {
  const username = req.session.username;
  
  if (!username) {
    return res.redirect('/login');
  } 
  res.redirect('/urls');
});

app.get('/login', (req, res) => {
  const username = req.session.username;
  
  if (username) {
    return res.redirect('/urls');
  }
  
  const templateVars = {
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

  const user = findUserByEmailAndUsername(users, email);

  if (!user) {
    return res.status(400).send('a user with that email does not exist');
  } else if (!bcrypt.compareSync(password, user[0].password)) {
    return res.status(400).send('password does not match the password saved');
  } 
    
  req.session.username = user[0].username;
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  delete req.session.username;
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  const username = req.session.username;
  
  if (username) {
    return res.redirect('/urls');
  }

  const templateVars = {
    username: users[username]
  };
  res.render('urls_register', templateVars);
});

app.post('/register', (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!username || !email || !password) {
    return res.status(400).send('the fields cannot be blank');
  }

  const user = findUserByEmailAndUsername(users, email, username);

  if (user && user[1] === 'username') {
    return res.status(400).send('a user with that username already exists');
  } else if (user && user[1] === 'email') {
    return res.status(400).send('a user with that email already exists');
  }

  users[username] = {
    username,
    email,
    password: hashedPassword,
    urls: {}
  };

  req.session.username = users[username].username;
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  const username = req.session.username;
  
  console.log('users', users);
  const templateVars = {
    username: users[username]
  };
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  const username = req.session.username;

  if (!username) {
    return res.status(401).send('not logged in');
  }

  const shortURL = generateRandomString();
  const longURL = req.body.longURL;

  users[username].urls[shortURL] = {
    longURL,
    username: shortURL
  };

  res.redirect(`/urls/${shortURL}`);
});

app.get('/urls/new', (req, res) => {
  const username = req.session.username;
  
  if (!username) {
    return res.redirect('/login');
  }
  
  const templateVars = {
    username: users[username]
  };
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  const username = req.session.username;
  const shortURL = req.params.shortURL;

  if (!username || !shortURL || !urlsForUser(users, shortURL, username)) {
    return res.status(404).send('page not found');
  }

  const templateVars = {
    shortURL,
    longURL: users[username].urls[shortURL].longURL,
    username: users[username]
  };
  res.render('urls_show', templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  
  if (urlsForUser(users, shortURL)) {
    const user = urlsForUser(users, shortURL)[0];
    const longURL = users[user].urls[shortURL].longURL;
    return res.redirect(longURL);
  }

  return res.status(404).send('page not found');
});

app.post('/urls/:shortURL', (req, res) => {
  const username = req.session.username;

  if (!username) {
    return res.status(401).send('unauthorized');
  }

  for (const key in req.body) {
    if (!urlsForUser(users, key, username)) {
      return res.status(401).send('unauthorized');
    }
    users[username].urls[key].longURL = req.body[key];
    res.redirect(`/urls/${key}`);
  }
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const username = req.session.username;
  
  if (!username) {
    return res.status(401).send('unauthorized');
  }

  for (const key in req.body) {
    if (!urlsForUser(users, key, username)) {
      return res.status(401).send('unauthorized');
    }
    delete users[username].urls[key];
  }

  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});