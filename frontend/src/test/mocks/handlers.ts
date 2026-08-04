import {http, HttpResponse, type RequestHandler} from "msw";
import {API_URL} from "../constants";

export const handlers: RequestHandler[] = [
    http.get(`${API_URL}/auth/me`, () =>
        HttpResponse.json({message: "Authentication required"}, {status: 401}),
    ),
];
