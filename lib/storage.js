const fs = require('fs');
const path = require('path');

// Storage file path
const STORAGE_FILE = path.join(__dirname, '../data/storage.json');

// Default storage structure
const defaultStorage = {
  users: {},
  bannedUsers: []
};

// Load storage from file
function loadStorage() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading storage:', error.message);
  }
  return { ...defaultStorage };
}

// Save storage to file
function saveStorage(storage) {
  try {
    const dir = path.dirname(STORAGE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(storage, null, 2));
  } catch (error) {
    console.error('Error saving storage:', error.message);
  }
}

// In-memory storage with file persistence
let storage = loadStorage();

// User management
function addUser(userId, username) {
  const id = userId.toString();
  if (!storage.users[id]) {
    storage.users[id] = {
      id: userId,
      username: username || 'Unknown',
      joinedAt: new Date().toISOString()
    };
    saveStorage(storage);
  }
}

function getUser(userId) {
  return storage.users[userId.toString()];
}

function getAllUsers() {
  return storage.users;
}

function getTotalUsers() {
  return Object.keys(storage.users).length;
}

// Ban management
function banUser(userId) {
  const id = userId.toString();
  if (!storage.bannedUsers.includes(id)) {
    storage.bannedUsers.push(id);
    saveStorage(storage);
  }
}

function unbanUser(userId) {
  const id = userId.toString();
  storage.bannedUsers = storage.bannedUsers.filter(uid => uid !== id);
  saveStorage(storage);
}

function isBanned(userId) {
  return storage.bannedUsers.includes(userId.toString());
}

module.exports = {
  addUser,
  getUser,
  getAllUsers,
  getTotalUsers,
  banUser,
  unbanUser,
  isBanned
};
