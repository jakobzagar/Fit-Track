import {useEffect, useRef} from "react";
import {Outlet, useLocation} from "react-router";

function getRouteTitle(pathname: string) {
    if (pathname === "/") return "FitTrack · Train with purpose";
    if (pathname === "/login") return "Sign in · FitTrack";
    if (pathname === "/register") return "Register · FitTrack";
    if (pathname === "/workouts") return "Workouts · FitTrack";
    if (pathname === "/exercises") return "Exercises · FitTrack";
    if (/^\/workouts\/[^/]+\/session$/.test(pathname)) return "Active workout · FitTrack";
    if (/^\/workouts\/[^/]+$/.test(pathname)) return "Workout details · FitTrack";
    return "Page not found · FitTrack";
}

export function RouteExperience() {
    const {pathname} = useLocation();
    const announcementRef = useRef<HTMLParagraphElement>(null);
    const isInitialRender = useRef(true);

    useEffect(() => {
        const title = getRouteTitle(pathname);
        document.title = title;

        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }

        window.scrollTo({top: 0, behavior: "instant"});
        const frame = window.requestAnimationFrame(() => {
            const heading = document.querySelector<HTMLElement>("main h1");
            heading?.setAttribute("tabindex", "-1");
            heading?.focus({preventScroll: true});
            if (announcementRef.current) {
                announcementRef.current.textContent = title.replace(" · FitTrack", "");
            }
        });

        return () => window.cancelAnimationFrame(frame);
    }, [pathname]);

    return (
        <>
            <p ref={announcementRef} className="sr-only" aria-live="polite" aria-atomic="true" />
            <Outlet />
        </>
    );
}
