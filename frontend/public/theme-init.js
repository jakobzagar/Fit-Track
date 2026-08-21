(() => {
    let savedTheme;

    try {
        savedTheme = localStorage.getItem("fittrack-theme");
    } catch {
        savedTheme = null;
    }

    const theme =
        savedTheme === "light" || savedTheme === "dark"
            ? savedTheme
            : matchMedia("(prefers-color-scheme: light)").matches
              ? "light"
              : "dark";

    document.documentElement.dataset.theme = theme;

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor instanceof HTMLMetaElement) {
        themeColor.content = theme === "light" ? "#f5f3ef" : "#080808";
    }
})();
