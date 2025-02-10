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
    }).then((response) => {
        if (response.ok) {
            localStorage.setItem('username', info['username']);
            localStorage.setItem('password', info['password']);
            if (response.status === 201) {
                alert("Created new account!");
            }
            window.location.href = '/';
        } else {
            if (response.status === 401) {
                response.json().then((res) => {
                    showMessage(res.message);
                });
            }
        }
    });
}

function showMessage(messages) {
    const messageDiv = document.getElementById("messageDiv");
    messageDiv.childNodes.forEach(child => {
        messageDiv.removeChild(child);
    });
    if (!Array.isArray(messages)) {
        messages = [messages];
    }

    if (messages.length < 1) {
        messageDiv.classList.add('hidden');
        return;
    }
    const ul = document.createElement("ul");
    messages.forEach(message => {
        const li = document.createElement("li");
        li.innerText = message;
        ul.appendChild(li);
    });
    messageDiv.appendChild(ul);
    messageDiv.classList.remove('hidden');
}