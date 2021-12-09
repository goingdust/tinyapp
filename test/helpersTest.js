const { assert } = require('chai');

const { findUserByEmailAndUsername } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    username: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
    urls: {
      '9sm5xK': {
        longURL: 'http://www.google.com',
        username: '9sm5xK'
      }
    }
  },
  "user2RandomID": {
    username: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
    urls: {
      'j3h2lf': {
        longURL: 'http://www.lighthouselabs.ca',
        username: 'j3h2lf'
      }
    }
  }
};

describe('getUserByEmailAndUsername', () => {
  it('should return a user with valid email', () => {
    const user = findUserByEmailAndUsername(testUsers, "user@example.com");
    const expectedUserID = "userRandomID";
    assert.equal(user[0].username, expectedUserID);
  });
  it('should return null if the email is non-existent', () => {
    const user = findUserByEmailAndUsername(testUsers, "pineapple@mail.com");
    assert.isNull(user);
  });
});
