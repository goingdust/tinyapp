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
        username: 'b2xVn2',
        dateCreated: 'Thu, 09 Dec 2021 21:33:53 GMT'
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
        username: '9sm5xK',
        dateCreated: 'Thu, 09 Dec 2021 21:34:02 GMT'
      }
    }
  }
};

app.get('/', (req, res) => {
  const username = req.session.username;
  
  // if not logged in, go to /login, otherwise go to /urls
  if (!username) {
    return res.redirect('/login');
  }
  res.redirect('/urls');
});

app.get('/login', (req, res) => {
  const username = req.session.username;
  
  // if logged in, go to /urls
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

  // if email or password fields are blank, send error page
  if (!email || !password) {
    return res.status(400).send('the fields cannot be blank');
  }

  // get the user object and confirmation of email
  const user = findUserByEmailAndUsername(users, email);

  // if the email belongs to no user, send error page
  if (!user) {
    return res.status(400).send('a user with that email does not exist');
  
  // if the password does not match, send error page
  } else if (!bcrypt.compareSync(password, user[0].password)) {
    return res.status(400).send('password does not match the password saved');
  }
  
  // set cookie
  req.session.username = user[0].username;
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  // remove cookie
  delete req.session.username;
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  const username = req.session.username;
  
  // if logged in, go to /urls
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

  // if any fields are blank, send error page
  if (!username || !email || !password) {
    return res.status(400).send('the fields cannot be blank');
  }

  // get the user object and confirmation of email and/or username
  const user = findUserByEmailAndUsername(users, email, username);

  // if the username or email are already in database, send error page
  if (user && user[1] === 'username') {
    return res.status(400).send('a user with that username already exists');
  } else if (user && user[1] === 'email') {
    return res.status(400).send('a user with that email already exists');
  }

  // create new user
  users[username] = {
    username,
    email,
    password: hashedPassword,
    urls: {}
  };

  // set cookie
  req.session.username = users[username].username;
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  const username = req.session.username;
  
  const templateVars = {
    username: users[username]
  };
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  const username = req.session.username;
  const dateCreated = new Date(Date.now()).toUTCString();

  // if not logged in, send error page
  if (!username) {
    return res.status(401).send('not logged in');
  }

  // create new shortURL and grab longURL
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;

  // create new urls object inside user
  users[username].urls[shortURL] = {
    longURL,
    username: shortURL,
    dateCreated
  };

  res.redirect(`/urls/${shortURL}`);
});

app.get('/urls/new', (req, res) => {
  const username = req.session.username;
  
  // if not logged in, to go /login
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

  // if not logged in, or the shortURL or user are not in database, send error page
  if (!username || !shortURL || !urlsForUser(users, shortURL, username)) {
    return res.status(404).send('page not found');
  }

  const templateVars = {
    shortURL,
    longURL: users[username].urls[shortURL].longURL,
    username: users[username],
  };
  res.render('urls_show', templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  
  // if the shortURL exists in database
  if (urlsForUser(users, shortURL)) {
    
    // grab user from the first index of returned array
    const user = urlsForUser(users, shortURL)[0];
    
    // get longURL with user key and redirect there
    const longURL = users[user].urls[shortURL].longURL;
    return res.redirect(longURL);
  }

  // else send error page
  return res.status(404).send('page not found');
});

app.post('/urls/:shortURL', (req, res) => {
  const username = req.session.username;

  // if not logged in, send error page
  if (!username) {
    return res.status(401).send('unauthorized');
  }

  // grab the shortURL as key
  for (const key in req.body) {
    
    // if logged in user does not have this shortURL, send error page
    if (!urlsForUser(users, key, username)) {
      return res.status(401).send('unauthorized');
    }

    // else update the longURL and refresh page
    users[username].urls[key].longURL = req.body[key];
    res.redirect(`/urls/${key}`);
  }
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const username = req.session.username;
  
  // if not logged in, send error page
  if (!username) {
    return res.status(401).send('unauthorized');
  }

  // grab the shortURL as key
  for (const key in req.body) {

    // if logged in user does not have this shortURL, send error page
    if (!urlsForUser(users, key, username)) {
      return res.status(401).send('unauthorized');
    }

    // else delete the url
    delete users[username].urls[key];
  }

  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});