const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const Chat = new Schema({
    id: ObjectId,
    message: { type: String },
    room: { type: String },
    senderId: {type: String}
});

module.exports = mongoose.model('ChatModel', Chat);
