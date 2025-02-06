const form = document.getElementById("loginForm");

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const inputs = form.querySelectorAll('#loginForm input');
    const values = {};
    inputs.forEach(input => {
        const name = input.getAttribute('name');
        const value = input.value;
        values[name] = value;
    });
    login(values);
});

function login(info) {
    const body = JSON.stringify(info);
    fetch("/login", {
        body,
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    }).then(response => {
        if (!response.ok) {
            console.error(response)
        } else {
            location.reload();
        }
    });
}

function fetchMessages() {
    const messageDiv = document.getElementById("messageDiv");
    fetch("/getmessages", {
        method: "GET"
    }).then(response => response.json()).then(data => {
        messageDiv.childNodes.forEach(child => {
            messageDiv.removeChild(child);
        });
        if (data.messages.length < 1) {
            messageDiv.classList.add('hidden');
            return;
        }
        const ul = document.createElement("ul");
        data.messages.forEach(message => {
            const li = document.createElement("li");
            li.innerText = message;
            ul.appendChild(li);
        });
        messageDiv.appendChild(ul);
        messageDiv.classList.remove('hidden');
    });
}

window.onload = () => {
    fetchMessages();
}