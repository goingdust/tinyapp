const findUserByEmailAndUsername = (database, email, username) => {
  for (const userID in database) {
    const user = database[userID];
    if (email === user.email) {
      return [user, 'email'];
    } else if (username === user.username) {
      return [user, 'username'];
    }
  }
  return null;
};

const urlsForUser = (database, id, username) => {
  if (!username) {
    for (const user in database) {
      for (const url in database[user].urls) {
        if (id === url) {
          return [user, id];
        }
      }
    }
  } else {
    for (const url in database[username].urls) {
      if (id === url) {
        return id;
      }
    }
  }
  return null;
};

const generateRandomString = function(length = 6) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

module.exports = {
  findUserByEmailAndUsername,
  urlsForUser,
  generateRandomString
};