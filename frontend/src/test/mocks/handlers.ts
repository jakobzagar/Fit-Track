import {http, HttpResponse, type HttpHandler} from "msw/http";
import {API_URL} from "../constants";

export const handlers: HttpHandler[] = [
    http.get(`${API_URL}/auth/me`, () =>
        HttpResponse.json({message: "Authentication required"}, {status: 401}),
    ),
];
