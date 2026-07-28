import {http, HttpResponse, type RequestHandler} from "msw";

const API_URL = "http://localhost:3001/api";

export const handlers: RequestHandler[] = [
    http.get(`${API_URL}/auth/me`, () =>
        HttpResponse.json({message: "Authentication required"}, {status: 401}),
    ),
];
