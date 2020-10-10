const mongoose = require("mongoose");

mongoose.connect('mongodb://localhost:27017/nodejs-chat-application', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: true,
    useCreateIndex: true
}, err => {
        if (!err) {
            console.log("DB connected");
        } else {
            console.log("DB Connection Error: " + err);
        }
});