export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="hidden border-t border-line py-8 text-center text-xs tracking-[0.12em] text-dim uppercase md:block">
            <p>© {currentYear} FitTrack · Built for the work</p>
        </footer>
    );
}
