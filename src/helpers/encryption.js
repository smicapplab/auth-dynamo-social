const bcrypt = require("bcryptjs");

const SaltRounds = 10;

const hashPassword = (password) => bcrypt.hashSync(password, bcrypt.genSaltSync(SaltRounds));

module.exports = { hashPassword };
