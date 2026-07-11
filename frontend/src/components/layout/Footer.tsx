export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer>
            <p>© {currentYear} Fit Track</p>
        </footer>
    );
}
