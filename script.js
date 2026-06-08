const themeToggle = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "💡 Light Mode";
} else {
  themeToggle.textContent = "💡 Dark Mode";
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    localStorage.setItem("theme", "dark");
    themeToggle.textContent = "💡 Light Mode";
  } else {
    localStorage.setItem("theme", "light");
    themeToggle.textContent = "💡 Dark Mode";
  }
});
