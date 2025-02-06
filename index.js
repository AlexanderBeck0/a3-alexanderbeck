const express = require('express');
const app = express();
const port = 3000;
const dotenv = require('dotenv').config();
const { MongoClient, Collection } = require('mongodb');
const passport = require('passport');
const session = require('express-session')
const GitHubStrategy = require('passport-github2').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const cookieParser = require('cookie-parser');

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

// Use a cookie parser with a secret code
app.use(cookieParser('CS4241'));

const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@${process.env.HOST}`;
const client = new MongoClient(uri);

// Connect to the DB
/**
 * @type {Collection}
 */
let TodoCollection = null;

/**
 * @type {Collection}
 */
let User = null;

/**
 * Connects to the MongoDB database
 */
async function connectToDB() {
    await client.connect();
    const db = client.db(process.env.DBNAME);
    TodoCollection = db.collection(process.env.TODOCOLLECTION);
    User = db.collection(process.env.USERCOLLECTION);
    debugPrint('Connected to DB');
}

connectToDB();

// Middleware to check connection to DB
app.use((req, res, next) => {
    if (TodoCollection !== null && User !== null) {
        next();
    } else {
        res.status(503).send();
    }
});

let appdata = []
const doDebug = false;

passport.serializeUser(function (user, done) {
    done(null, { username: user.username, id: user._id || user.id });
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

/**
 * Prints a message only if {@link doDebug} is on
 * @param {String} msg The message to print if {@link doDebug} is on
 */
function debugPrint(msg) {
    if (doDebug) {
        console.log(msg);
    }
}

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    // callbackURL: "http://localhost:3000/auth/github/callback"
    callbackURL: "http://a3-alexanderbeck-sa.onrender.com/auth/github/callback"
},
    async function (accessToken, refreshToken, profile, done) {
        debugPrint("Successfully connected to Github");
        process.nextTick(function () {
            return done(null, profile);
        });
    }
));

/**
 * Hacky way of alerting the user if an account was created. This is NOT scalable. 
 */
let newAccount = false;
// Create a LocalStrategy
// https://github.com/jaredhanson/passport-local?tab=readme-ov-file#configure-strategy
passport.use(new LocalStrategy({ session: true }, async function (username, password, done) {
    const user = await User.findOne({ username: username });
    if (!user) {
        // User not found
        await User.insertOne({ username: username, password: password });
        const new_user = await User.findOne({ username: username });
        newAccount = true;
        return done(null, new_user, { message: "Created new user!" });
    }

    if (user.password !== password) return done(null, false, { message: "Incorrect username or password." }); // Incorrect password
    return done(null, user);
}));

app.get('/auth/github/callback',
    passport.authenticate('github', { session: true, failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
    });


app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));


app.get('/', (req, res) => {
    // User is not logged in
    if (!req.user) {
        return res.redirect("/login");
    }
    // User is logged in
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/getmessages", (req, res) => {
    if (newAccount) {
        let newMessage = "Created new account!";
        if (req.session.messages === undefined) req.session.messages = [];
        req.session.messages.push(newMessage);
        newAccount = false;
    }

    res.json({ messages: req.session.messages || [] });
    req.session.messages = [];
    req.session.save(); // Clear the messages
});

app.get("/login", (req, res) => {
    // User is logged in
    if (req.user) {
        res.redirect("/");
    } else {
        res.sendFile(__dirname + "/public/login.html");
    }
});

app.post("/login",
    passport.authenticate('local',
        { session: true, failureRedirect: '/login', successRedirect: "/", failureMessage: true, successMessage: true }),
    function (req, res) {
        // Note: This is having some pretty annoying bugs and won't actually redirect properly...
    }
);

app.get("/logout", (req, res) => {
    req.logout(() => { });
    res.redirect('/');
});

app.use(express.static('public'));


/**
 * Sorts the data in appData according to priority, and then by date. Also reassigns ordernum.
 */
function sortData() {
    const MS_TO_HOURS = 1000 * 60 * 60;

    // Rank with priority first. Then, smaller the number, the greater the priority
    const priorities = {
        'verylow': 1,
        'low': 2,
        'medium': 3,
        'high': 4,
        'veryhigh': 5
    };

    appdata.sort((a, b) => {
        let priorityDifference = priorities[b.priority] - priorities[a.priority];
        if (priorityDifference !== 0) {
            return priorityDifference;
        }
        // They have the same priority, so sort by date instead
        return Math.floor((new Date(b.duedate).getTime() - new Date(a.duedate).getTime()) / MS_TO_HOURS);
    });

    // Update recommended order
    for (let i = 0; i < appdata.length; i++) {
        appdata[i].ordernum = i;
    }
}


// Load the data from appdata
app.post('/load', async (req, res) => {
    if (req.user === undefined) {
        // Ensure that no database objects can be accessed without logging in
        debugPrint("Not logged in");
        res.writeHead(200, "OK", { "Content-Type": "application/json" });
        res.end(JSON.stringify({ nocontent: true }));
        return;
    }

    // User is logged in. Send the data
    debugPrint("Data requested");
    // Get the data from the DB for the user
    appdata = await TodoCollection.find({ username: req.user.username }).toArray();

    res.writeHead(200, "OK", { "Content-Type": "application/json" });
    res.end(JSON.stringify([{ username: req.user.username }, ...appdata]));
    debugPrint("Data sent");
});

// Clear the data
app.post('/clear', (req, res) => {
    // Ensure that no database objects can be accessed without logging in
    if (req.user === undefined) {
        return;
    }
    // Clear the DB
    TodoCollection.deleteMany({ username: req.user.username });
    appdata = [];
    debugPrint("Cleared data!");
    res.writeHead(200, "OK", { "Content-Type": "text/plain" });
    res.end("Data cleared!");
});

app.post('/delete', (req, res) => {
    let dataString = "";

    req.on("data", function (data) {
        dataString += data;
    })

    req.on("end", function () {
        if (req.user === undefined) {
            // Ensure that no database objects can be accessed without logging in
            return;
        }

        // Server crashes when dataString is not valid
        let newData = null;
        try {
            newData = JSON.parse(dataString);
        } catch {
            if (newData === '') {
                console.warn("Empty string given");
            } else {
                console.warn("INVALID JSON GIVEN");
            }
            return;
        }
        debugPrint("Recieved request to delete item");
        TodoCollection.deleteOne({ username: req.user.username, taskname: newData.taskname });
        appdata.splice(appdata.indexOf(task => task.taskname === newData.taskname), 1);

        debugPrint("Item deleted!");
        res.writeHead(200, "OK", { "Content-Type": "text/plain" });
        res.end("Item deleted!");
    });
});


const new_post = (req, res, next) => {
    let dataString = "";

    req.on("data", function (data) {
        dataString += data;
    })

    req.on("end", function () {
        if (req.user === undefined) {
            // Ensure that no database objects can be accessed without logging in
            return;
        }
        // Server crashes when dataString is not valid
        let newData = null;
        try {
            newData = JSON.parse(dataString);
        } catch {
            if (newData === '' || newData === ' ') {
                console.warn("Empty string given");
            } else {
                console.warn("INVALID JSON GIVEN");
            }
            return;
        }

        if (!newData.taskname) {
            // No taskname found
            debugPrint("No task name given");
            return;
        }

        // Edits the existing value if the name is already there
        for (let i = 0; i < appdata.length; i++) {
            if (appdata[i].taskname === newData.taskname) {
                newData.ordernum = appdata[i].ordernum;
                // Update item in DB
                const result = TodoCollection.updateOne(
                    { _id: appdata[i]._id },
                    {
                        $set: {
                            taskname: appdata[i].taskname,
                            priority: newData.priority,
                            duedate: newData.duedate,
                            username: req.user.username,
                            ordernum: newData.ordernum
                        }
                    }
                );
                debugPrint("Updated item in DB");

                // Replace the existing value in appdata with the new data
                appdata.splice(i, 1, newData);
                sortData();
                debugPrint("Updated data!");

                if (newData.taskname === "undefined") {
                    console.warn("Undefined task name");
                }
                // Send data to front end
                res.writeHead(200, "OK", { "Content-Type": "application/json" });
                res.end(JSON.stringify(appdata));
                next();
                return;
            }
        }

        // Add githubID to entry
        newData.username = req.user.username;
        appdata.push(newData);

        // Update all the order nums
        sortData();

        // Add item to DB
        const result = TodoCollection.insertOne(newData);
        debugPrint("Added item to DB");

        // // Return the new table
        res.writeHead(200, "OK", { "Content-Type": "application/json" });
        res.end(JSON.stringify(appdata));
        next();
    });
}

app.use(new_post);


app.listen(process.env.PORT || port, () => {
    console.log("Server listening on port " + port);
});
