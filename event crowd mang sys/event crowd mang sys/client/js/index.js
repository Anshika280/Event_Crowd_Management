/* ============================================
   Event Crowd Management System
   index.js
============================================ */

console.log("Event Crowd Management System Loaded");

/* ============================================
   API Base URL
============================================ */

const API_URL = "http://localhost:5000/api";

/* ============================================
   Counter Animation
============================================ */

function animateCounter(id, target, speed = 20) {

    const element = document.getElementById(id);

    if (!element) return;

    let count = 0;

    const increment = Math.ceil(target / 100);

    const timer = setInterval(() => {

        count += increment;

        if (count >= target) {

            element.innerText = target;
            clearInterval(timer);

        } else {

            element.innerText = count;

        }

    }, speed);

}

/* ============================================
   Initialize Counter
============================================ */

window.addEventListener("load", () => {

    animateCounter("eventsCount", 25);
    animateCounter("usersCount", 450);
    animateCounter("ticketsCount", 1200);

});

/* ============================================
   Contact Form Validation
============================================ */

const contactForm = document.querySelector(".contact form");

if (contactForm) {

    contactForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const inputs = contactForm.querySelectorAll("input");
        const textarea = contactForm.querySelector("textarea");

        const name = inputs[0].value.trim();
        const email = inputs[1].value.trim();
        const message = textarea.value.trim();

        if (name === "" || email === "" || message === "") {

            alert("Please fill all fields.");
            return;

        }

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {

            alert("Invalid Email Address");
            return;

        }

        alert("Message Sent Successfully");

        contactForm.reset();

    });

}

/* ============================================
   Book Now Buttons
============================================ */

const bookButtons =
    document.querySelectorAll(".event-card button");

bookButtons.forEach(button => {

    button.addEventListener("click", () => {

        window.location.href = "booking.html";

    });

});

/* ============================================
   Fetch Events from Backend
============================================ */

async function loadEvents() {

    try {

        const response =
            await fetch(`${API_URL}/events`);

        if (!response.ok) {

            throw new Error("Unable to Load Events");

        }

        const data =
            await response.json();

        console.log("Events:", data);

    }

    catch (error) {

        console.error(error);

    }

}

// Uncomment when backend is ready

// loadEvents();

/* ============================================
   Smooth Scroll
============================================ */

const links =
    document.querySelectorAll('a[href^="#"]');

links.forEach(link => {

    link.addEventListener("click", function (e) {

        e.preventDefault();

        const section =
            document.querySelector(this.getAttribute("href"));

        if (section) {

            section.scrollIntoView({

                behavior: "smooth"

            });

        }

    });

});

/* ============================================
   Highlight Active Navigation
============================================ */

window.addEventListener("scroll", () => {

    let current = "";

    document.querySelectorAll("section").forEach(section => {

        const sectionTop = section.offsetTop - 150;

        if ((window.pageYOffset || window.scrollY) >= sectionTop) {

            current = section.getAttribute("id");

        }

    });

    document.querySelectorAll(".nav-links a").forEach(link => {

        link.classList.remove("active");

        if (link.getAttribute("href") === "#" + current) {

            link.classList.add("active");

        }

    });

});

/* ============================================
   Fetch Dashboard Statistics
============================================ */

async function loadStatistics() {

    try {

        const response =
            await fetch(`${API_URL}/dashboard/stats`);

        if (!response.ok) {

            throw new Error("Server Error");

        }

        const stats =
            await response.json();

        document.getElementById("eventsCount").innerText =
            stats.events;

        document.getElementById("usersCount").innerText =
            stats.users;

        document.getElementById("ticketsCount").innerText =
            stats.tickets;

    }

    catch (error) {

        console.log(error.message);

    }

}

// Uncomment when backend is ready

// loadStatistics();

/* ============================================
   Notification Popup
============================================ */

function showNotification(message) {

    const div =
        document.createElement("div");

    div.innerText = message;

    div.style.position = "fixed";
    div.style.right = "20px";
    div.style.top = "20px";
    div.style.padding = "15px";
    div.style.background = "#0b5ed7";
    div.style.color = "white";
    div.style.borderRadius = "8px";
    div.style.zIndex = "999";

    document.body.appendChild(div);

    setTimeout(() => {

        div.remove();

    }, 3000);

}

/* ============================================
   Online / Offline Detection
============================================ */

window.addEventListener("offline", () => {

    showNotification("Internet Connection Lost");

});

window.addEventListener("online", () => {

    showNotification("Connected Successfully");

});

/* ============================================
   Dark Mode (Optional)
============================================ */

const darkModeButton =
    document.getElementById("darkMode");

if (darkModeButton) {

    darkModeButton.addEventListener("click", () => {

        document.body.classList.toggle("dark");

    });

}

/* ============================================
   End of File
============================================ */

console.log("JavaScript Loaded Successfully");