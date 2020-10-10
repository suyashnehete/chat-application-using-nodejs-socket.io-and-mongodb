const express = require("express");
const app = express();
const server = require("http").Server(app);
const bodyparser = require("body-parser");
const db = require("./app/db");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser")
const UserModel = require("./app/user.model");
const ChatModel = require("./app/room.model");
const { render } = require("ejs");
const io = require("socket.io")(server);


app.use(bodyparser.urlencoded({extended: true}));
app.use(bodyparser.json());
app.use(cookieParser());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.set("views", "./views");
app.set("view engine", "ejs");
app.set("static", "./public");

app.get("/", (req, res) => {
    console.log(req.cookies.id);
    if (req.cookies.id !== undefined) {
        UserModel.find((err, list) => {
            UserModel.findById(req.cookies.id, (err, doc) => {
                res.render("index", {
                    name: doc.name,
                    "list": list,
                    id: doc._id
                });
            });
        });
    } else {
        res.redirect("login");
    }
})

app.get("/register", (req, res) => {
    res.render("register",{err: ""})
})

app.get("/login", (req, res) => {
    res.render("login", {
        err: ""
    })
})

app.post("/", (req, res) => {
    var type = req.body.type;
    if (type === "logout") {
        res.clearCookie("id");
        res.redirect("/login");
    } else {
        UserModel.find((err, list) => {
var username = req.body.username;
var password = req.body.password;
if (type === "register") {
    if (password.length >= 6) {
        bcrypt.hash(password, 10, (err, hash) => {
            if (!err) {
                var userModel = new UserModel();
                userModel.username = username;
                userModel.password = hash;
                userModel.name = req.body.name;
                userModel.save((err, doc) => {
                    if (!err) {
                        res.cookie("id", doc._id);
                        res.render("index", {
                            name: req.body.name,
                            "list": list,
                            id: doc._id
                        });
                    } else {
                        res.render("register", {
                            "err": "User Name Already Exists"
                        });
                    }
                });
            } else {
                res.render("register", {
                    "err": err.message
                });
            }
        });
    } else {
        res.render("register", {
            "err": "Minimum password length should be greater than 5"
        });
    }
} else if (type === "login") {
    UserModel.exists({
        "username": username
    }, (err, isAvailable) => {
        if (isAvailable) {
            UserModel.findOne({
                "username": username
            }, (err, doc) => {
                if (!err) {
                    bcrypt.compare(password, doc.password, (err, same) => {
                        if (!err) {
                            if (same) {
                                res.cookie("id", doc._id);
                                res.render("index", {
                                    name: doc.name,
                                    "list": list,
                                    id: doc._id
                                });
                            } else {
                                res.render("login", {
                                    "err": "Incorrect Password"
                                });
                            }
                        } else {
                            res.render("login", {
                                "err": err
                            });
                        }
                    });
                } else {
                    res.render("login", {
                        "err": "Username Doesn't Exists"
                    });
                }
            });
        } else {
            res.render("login", {
                "err": "Username Doesn't Exists"
            });
        }
    });
}
        });
    }
})

server.listen(3000, () => {
    console.log("Listening on http://localhost:3000");
})

io.on("connection", socket => {
    socket.on("getData", data => {
        var sender = data.sender;
        var receiver = data.receiver;

        ChatModel.exists({ room: sender + receiver }, (err, isAvailable) => {
            if (isAvailable) {
                socket.join(sender + receiver);
                ChatModel.find({
                    room: sender + receiver
                }, (err, doc) => {
                    socket.emit("setData", {
                        room: sender + receiver,
                        messages: doc
                    })
                })
            } else {
                socket.join(receiver + sender);
                ChatModel.exists({ room: receiver + sender }, (err, isAvailable) => {
                    if (isAvailable) {
                        ChatModel.find({
                            room: receiver + sender
                        }, (err, doc) => {
                            socket.emit("setData", {
                                room: receiver + sender,
                                messages: doc
                            })
                        })
                    } else {
                        console.log("false");
                        socket.emit("setData", {
                            room: receiver + sender,
                            messages: []
                        })
                    }
                });
            }
        });
    })

    socket.on("storeMessage", data => {
        socket.to(data.room).broadcast.emit("appendMessage", data);
        var chat = new ChatModel();
        chat.message = data.message;
        chat.senderId = data.id;
        chat.room = data.room;
        chat.save();
    })

})