// Alexander Beck

window.onload = function () {
    const button = document.querySelector("#submit");
    button.onclick = submit;

    const clear = document.querySelector("#clear");
    clear.onclick = clearData;

    const date = document.getElementById("duedate");
    initDate(date);

    // Gets the data from the server (if there is any)
    fetchData();
};

/**
 * Sets the value of the given input element to be the current date
 * @param {HTMLInputElement} dateField A date input element
 */
function initDate(dateField) {
    // Initializes the date selector to the current date
    let date = new Date().toISOString("YYYY-MM-DD");
    dateField.value = date.substring(0, date.indexOf('T'));
}

async function fetchData() {
    // Used when the page first loads; it gets the data
    const body = JSON.stringify({ 'method': 'load' });
    const response = await fetch("/load", {
        body,
        method: "POST"
    });

    const data = await response.text();
    let json = null;
    try {
        json = JSON.parse(data);
        console.log("Data recieved from server.");
    } catch (e) {
        console.log("Failed to connect to server!");
    }

    // User is not logged in
    if (json.nocontent) {
        console.log("User not logged in");
        return;
    }
    const user = json.pop();
    greetUser(user);
    showElement(document.getElementById('todoForm'));
    createTable(json);
}

const submit = async function (event) {
    // stop form submission from trying to load
    // a new .html page for displaying results...
    // this was the original browser behavior and still
    // remains to this day
    event.preventDefault();

    let json = {};
    document.getElementById("todoForm").querySelectorAll("[data-send]").forEach(i => {
        // i is any element that has an element that is hard-coded to be sent with the data
        if (i.value === '') {
            // Ensure there are no empty fields
            alert("You must fill out all fields!");
            return;
        }
        if (i.id === undefined) {
            // Not necessary for this assignment, but will still prevent errors
            console.error("ID undefined in form element");
            return;
        }
        json[i.id] = i.value;
    });
    json.method = "submit";


    const body = JSON.stringify(json);

    const response = await fetch("/submit", {
        body,
        method: "POST"
    });

    // Change 'Update' to 'Submit', or do nothing if it is already 'Submit'
    if (document.getElementById('submit').textContent === 'Update') {
        document.getElementById('submit').textContent = 'Submit';
        document.getElementById('cancelButton').remove();
    }
    resetTaskName();

    const newTable = await response.text();
    console.log("Data recieved from server.");
    createTable(JSON.parse(newTable));
}

const clearData = async function (event) {
    event.preventDefault();
    let json = { method: 'clear' };
    const body = JSON.stringify(json);
    const response = await fetch("/clear", {
        body,
        method: "POST"
    });
    const status = await response.text();
    console.log(status);

    // Delete previous elements
    document.querySelector("#todo > table").childNodes.forEach(a => a.remove());
    createTableHeaders();
};

/**
 * Creates table headers for the table in #todo
 */
function createTableHeaders() {
    const table = document.querySelector("#todo > table");
    // Delete any existing headers
    if (document.getElementById("tableheaders")) {
        document.getElementById("tableheaders").remove();
    }

    // Create new headers
    let createNewTh = function (row, text) {
        const th = document.createElement('th');
        th.appendChild(document.createTextNode(text));
        row.appendChild(th);
    };

    // Add headers to table
    const headerTr = table.insertRow();
    headerTr.id = "tableheaders";
    headerTr.class = "tableheaders";
    createNewTh(headerTr, 'Task');
    createNewTh(headerTr, 'Priority');
    createNewTh(headerTr, 'Due Date');
    createNewTh(headerTr, 'Recommended Order');
}

/**
 * Given an Array of JSON objects, update the table in #todo to hold all the values in it.
 * Clears the table and creates headers it. 
 * @param {Array} newTable An array of JSON objects that represents the table's values
 */
function createTable(newTable) {
    const table = document.querySelector("#todo > table");

    // Delete previous elements
    table.childNodes.forEach(a => a.remove());

    createTableHeaders();

    for (let i = 0; i < newTable.length; i++) {
        const tr = table.insertRow();
        let name = tr.insertCell();
        let priority = tr.insertCell();
        let duedate = tr.insertCell();
        let order = tr.insertCell();

        name.appendChild(document.createTextNode(newTable[i].taskname));
        priority.appendChild(document.createTextNode(newTable[i].priority));
        duedate.appendChild(document.createTextNode(newTable[i].duedate));
        order.appendChild(document.createTextNode(newTable[i].ordernum));

        const editButton = createEditButton(newTable[i]);
        name.appendChild(editButton);

        // Show/hide edit button when hovering
        tr.onmouseover = function () {
            showElement(editButton);
        };

        tr.onmouseout = function () {
            hideElement(editButton);
        }

        // Clicking an element (other than the edit button) will delete it
        tr.onclick = async function () {
            const json = { taskname: newTable[i].taskname, method: 'delete' }
            const body = JSON.stringify(json);
            const response = await fetch('/delete', {
                body,
                method: "POST"
            });
            const status = await response.text();
            console.log(status);

            tr.remove();
        };
    }
}

/**
 * Returns an edit button for a specific row on a provided table.
 * Clicking the edit button puts all the edit values into the form, and changes 'Submit' to 'Update'
 * @param {JSON} table A JSON element representing a table
 * @returns An edit button
 */
function createEditButton(table) {
    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.id = table.taskname.replaceAll(' ', '_') + 'EditButton';
    editButton.classList = 'mini ui button right floated';
    editButton.title = 'Edit this task';
    hideElement(editButton);
    editButton.style.textDecoration = 'none';

    // When you click the edit button, it allows the user to edit the item
    editButton.onclick = function (e) {
        e.preventDefault();
        // Stops the tr from being deleted
        e.stopPropagation();
        const taskname = document.getElementById('taskname');
        taskname.value = table.taskname;
        taskname.disabled = true;
        taskname.classList = taskname.classList + 'disabled';
        taskname.ariaDisabled = 'true';

        document.getElementById('priority').value = table.priority;
        document.getElementById('duedate').value = table.duedate;

        // Change 'Submit' to 'Update'
        document.getElementById('submit').textContent = 'Update';

        // Create cancel button
        createCancelButton();
    };

    return editButton;
}

/**
 * Creates a cancel button and adds it to the form.
 * Clicking the cancel button causes the form to empty and removes the cancel button.
 * Also changes 'Update' to 'Submit'
 */
function createCancelButton() {
    if (document.getElementById('cancelButton') !== null) {
        // Cancel button already exists; don't keep making more
        return;
    }
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.id = 'cancelButton';
    cancelButton.classList = 'ui button';
    cancelButton.title = 'Cancel the current edit';

    cancelButton.onclick = function (e) {
        e.preventDefault();
        // Empty the form values
        resetTaskName();

        document.getElementById('priority').value = '';
        initDate(document.getElementById('duedate'));

        // Change 'Update' to 'Submit'
        document.getElementById('submit').textContent = 'Submit';

        // Remove cancel button
        cancelButton.remove();
    };

    // Add cancel button to form
    const form = document.getElementById('todoForm');
    const formContent = form.querySelector('div:first-of-type');
    formContent.appendChild(cancelButton);
}

function resetTaskName() {
    const taskname = document.getElementById('taskname');
    taskname.disabled = false;
    taskname.ariaDisabled = 'false';
    taskname.classList.remove('disabled');
    taskname.value = '';
}

/**
 * Says hi to the user.
 */
function greetUser(username) {
    // Get all the cookies
    const message = document.getElementById('welcomeMessage');
    message.innerText = message.innerText.replace('{User}', username['username']);

    showElement(document.getElementById('loggedIn'));
}

/**
 * Sets the element's display to none and sets the aria-hidden attribute to true
 * @param {HTMLElement} element The element to hide
 */
function hideElement(element) {
    element.style.display = 'none';
    element.ariaHidden = 'true';
}

/**
 * Sets the element's display to inherit and sets the aria-hidden attribute to false
 * @param {HTMLElement} element The element to show
 */
function showElement(element) {
    element.style.display = 'inherit';
    element.ariaHidden = 'false';
}