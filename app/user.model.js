const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const User = new Schema({
    id: ObjectId,
    name: { type: String },
    username: { type: String, unique: true },
    password: { type: String}
});

module.exports = mongoose.model('UserModel', User);
