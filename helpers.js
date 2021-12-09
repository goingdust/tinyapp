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

module.exports = {
  findUserByEmailAndUsername
};