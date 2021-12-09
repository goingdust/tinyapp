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
  'b2xVn2': {
    longURL: 'http://www.lighthouselabs.ca',
    username: 'b2xVn2'
  },
  '9sm5xK': {
    longURL: 'http://www.google.com',
    username: '9sm5xK'
  }
};

const users = {
  'stevie': {
    username: 'stevie',
    email: 'steven@universe.com',
    password: '123',
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
    password: 'abc',
    urls: {
      '9sm5xK': {
        longURL: 'http://www.google.com',
        username: '9sm5xK'
      }
    }
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

const urlsForUser = (id, username) => {
  if (!username) {
    return;
  } else {
    for (const key in users[username].urls) {
      if (users[username].urls[key].username === id) {
        return id;
      }
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
  const username = req.cookies.username;
  
  if (username) {
    return res.redirect('/urls');
  }
  
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
  
  if (username) {
    return res.redirect('/urls');
  }

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
    password,
    urls: {}
  };

  res.cookie('username', users[username].username);
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  const username = req.cookies.username;
  
  for (const url in urlDatabase) {
    if (urlsForUser(url, username) !== url) {
      delete urlDatabase[url];
    }
  }
  
  console.log('users', users);
  console.log('urls', urlDatabase);
  const templateVars = {
    urls: urlDatabase,
    users,
    username: users[username]
  };
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  const username = req.cookies.username;

  if (!username) {
    return res.status(401).send('not logged in');
  }

  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  
  urlDatabase[shortURL] = {
    longURL,
    username: shortURL
  };

  users[username].urls[shortURL] = {
    longURL,
    username: shortURL
  };

  res.redirect(`/urls/${shortURL}`);
});

app.get('/urls/new', (req, res) => {
  const username = req.cookies.username;
  
  if (!username) {
    return res.redirect('/login');
  }
  
  const templateVars = {
    urls: urlDatabase,
    username: users[username]
  };
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  const username = req.cookies.username;

  if (!username) {
    return res.status(404).send('page not found - please login');
  }

  const shortURL = req.params.shortURL;

  for (const key in users[username].urls) {
    if (!urlsForUser(shortURL, username)) {
      return res.status(401).send('page not found');
    }
  }

  const templateVars = {
    shortURL,
    longURL: urlDatabase[shortURL].longURL,
    username: users[username]
  };
  res.render('urls_show', templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  
  if (!urlDatabase[shortURL]) {
    return res.status(404).send('page does not exist');
  }

  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

app.post('/urls/:shortURL', (req, res) => {
  for (const key in req.body) {
    urlDatabase[key].longURL = req.body[key];
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