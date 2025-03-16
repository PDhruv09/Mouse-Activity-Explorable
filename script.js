console.log("Navigation Loaded!");

// Helper function to select multiple elements
function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

// ✅ Ensure scripts run only after the DOM is fully loaded
document.addEventListener("DOMContentLoaded", async () => {
    generateNavigation();
});

// ✅ Function to generate the navigation bar
function generateNavigation() {
    const rootPath = "/Mouse-Activity-Explorable/";
    const pages = [
        { url: "index.html", title: "Home" },
        { url: "Activity Analysis/index.html", title: "Activity Levels" },
        { url: "Temperature Analysis/index.html", title: "Temperature Changes" },
        { url: "Estrus Cycle Impact/index.html", title: "Estrus Cycle Effect" },
        { url: "https://github.com/PDhruv09/Mouse-Activity-Explorable", title: "GitHub Repo"}
    ];

    const nav = document.createElement("nav");
    nav.id = "navbar";

    pages.forEach((page) => {
        let url = page.url.startsWith("http") ? page.url : rootPath + page.url;
        const a = document.createElement("a");
        a.href = url;
        a.textContent = page.title;
        if (new URL(a.href, location.origin).href === location.href) {
            a.classList.add("current");
        }
        if (a.host !== location.host) {
            a.target = "_blank";
        }
        nav.appendChild(a);
    });

    document.body.prepend(nav);
};

// ✅ Dark Mode Toggle Implementation
document.addEventListener("DOMContentLoaded", () => {
    document.body.insertAdjacentHTML(
        "afterbegin",
        `
        <label class="color-scheme" style="position: absolute; top: 10px; right: 10px;">
            Theme:
            <select id="theme-switcher">
                <option value="light dark">Automatic</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
            </select>
        </label>
    `);

    const select = document.getElementById("theme-switcher");

    if ("colorScheme" in localStorage) {
        setColorScheme(localStorage.colorScheme);
        select.value = localStorage.colorScheme;
    }

    select.addEventListener("input", (event) => {
        const colorScheme = event.target.value;
        setColorScheme(colorScheme);
        localStorage.colorScheme = colorScheme;
    });

    function setColorScheme(colorScheme) {
        document.documentElement.style.setProperty("color-scheme", colorScheme);
    }
});