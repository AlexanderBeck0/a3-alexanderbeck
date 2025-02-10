const express = require('express');
const app = express();
const port = 3000;
const dotenv = require('dotenv').config();
const { MongoClient, Collection } = require('mongodb');

app.use(express.json());

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
const doDebug = true;

/**
 * Prints a message only if {@link doDebug} is on
 * @param {String} msg The message to print if {@link doDebug} is on
 */
function debugPrint(msg) {
    if (doDebug) {
        console.log(msg);
    }
}

/**
 * Hacky way of alerting the user if an account was created. This is NOT scalable. 
 */
let newAccount = false;

app.get('/', (req, res) => {
    // User is not logged in
    res.sendFile(__dirname + "/public/index.html");
});

// app.get("/getmessages", (req, res) => {
//     if (newAccount) {
//         let newMessage = "Created new account!";
//         if (req.session.messages === undefined) req.session.messages = [];
//         req.session.messages.push(newMessage);
//         newAccount = false;
//     }

//     res.json({ messages: req.session.messages || [] });
//     req.session.messages = [];
//     req.session.save(); // Clear the messages
// });

app.get("/login", (req, res) => {
    // User is logged in
    res.sendFile(__dirname + "/public/login.html");
});

app.post("/login", async function (req, res) {
    // req will have username, password
    const { username, password } = req.body;
    // Check if account exists
    const user = await User.findOne({ username: username });
    if (!user) {
        // User not found
        await User.insertOne({ username: username, password: password });
        const new_user = await User.findOne({ username: username });
        newAccount = true;
        // 201: Created
        const message = {
            message: "Created new user!",
            loggedIn: true
        };
        res.status(201).json(message);
        return;
    }

    if (user.password !== password) {
        // Incorrect password
        // 401: Unauthorized
        const message = {
            message: "Incorrect username or password.",
            loggedIn: false
        };
        res.status(401).json(message);
        return;
    }

    const message = {
        loggedIn: true
    };

    res.status(200).json(message);
    return;
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
    if (req.body.username === undefined || req.body.username === null) {
        // Ensure that no database objects can be accessed without logging in
        debugPrint("Not logged in");
        res.status(401).json({ nocontent: true });
        return;
    }

    // User is logged in. Send the data
    debugPrint("Data requested");
    // Get the data from the DB for the user
    appdata = await TodoCollection.find({ username: req.body.username }).toArray();
    res.status(200).json(appdata);

    // res.status(200).json([{ username: req.body.username }, ...appdata]);
    debugPrint("Data sent");
});

// Clear the data
app.post('/clear', (req, res) => {
    // Ensure that no database objects can be accessed without logging in
    if (req.body.username === undefined || req.body.username === null) {
        return;
    }
    // Clear the DB
    TodoCollection.deleteMany({ username: req.body.username });
    appdata = [];
    debugPrint("Cleared data!");
    res.writeHead(200, "OK", { "Content-Type": "text/plain" });
    res.end("Data cleared!");
    // res.status(200).end("Data cleared!");
});

app.post('/delete', async (req, res) => {
    if (req.body.username === undefined || req.body.username === null) {
        // Ensure that no database objects can be accessed without logging in
        return;
    }

    debugPrint("Recieved request to delete item");
    await TodoCollection.deleteOne({ username: req.body.username, taskname: req.body.taskname });
    appdata.splice(appdata.indexOf(task => task.taskname === req.body.taskname), 1);

    debugPrint("Item deleted!");
    res.sendStatus(200);
});

const new_post = async (req, res, next) => {
    let newData = req.body;

    if (!newData || Object.keys(newData).length === 0) {
        console.warn("Empty or invalid JSON received");
        return res.status(400).json({ error: "Invalid JSON" });
    }

    if (!newData.taskname) {
        console.warn("No task name provided.");
        return res.status(400).json({ error: "Task name is required" });
    }

    for (let i = 0; i < appdata.length; i++) {
        if (appdata[i].taskname === newData.taskname) {
            newData.ordernum = appdata[i].ordernum;
            // Update item in DB
            await TodoCollection.updateOne(
                { _id: appdata[i]._id },
                {
                    $set: {
                        taskname: appdata[i].taskname,
                        priority: newData.priority,
                        duedate: newData.duedate,
                        username: req.body.username,
                        ordernum: newData.ordernum
                    }
                }
            );

            debugPrint("Updated item in DB");

            // Replace the existing value in appdata with the new data
            appdata.splice(i, 1, newData);
            sortData();
            debugPrint("Updated data!");
            return res.status(200).json(appdata);
        }
    }
    // Add githubID to entry
    newData.username = req.body.username;
    appdata.push(newData);

    // Update all the order nums
    sortData();

    // Add item to DB
    await TodoCollection.insertOne(newData);
    debugPrint("Added item to DB");

    res.status(200).json(appdata);
};

app.use(new_post);


app.listen(process.env.PORT || port, () => {
    console.log("Server listening on port " + port);
});
