"use server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {jwtVerify, decodeJwt} from "jose";
import { request } from "http";


export async function middleware(req: NextRequest) {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
    try {
        if (!req.url.includes("/login")) {
            const token = request.cookies.get("access_token");
            if (token) {
                if (!jwtVerify(token?.value, secret)) {
                    return NextResponse.redirect(new URL("/login?msg= 'JWT expired'", req.url));
                }
                const { isAdmin } = decodeJwt(token?.value);
                if (isAdmin) {
                    return NextResponse.next();
                } else {
                    return NextResponse.redirect(new URL("/?msg='Not Admin'", req.url));
                }
            } else {
                return NextResponse.redirect(new URL("/admin/login", req.url));
            }
        } else {
            return NextResponse.next();
        }
    } catch (err) {
        if (err instanceof Error && err.message === "jwt expired") {
            return NextResponse.redirect(new URL("/login?msg= 'JWT expired'", req.url));
        }
        return NextResponse.json({ message: "Internal Server Error" },
            {
                status: 500,
            }
        );
    }
}

export const config = {
    matcher: ["/admin/:path*", "/admin"],
};