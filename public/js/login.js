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