
export async function GET(request: Request) {
    const url = new URL(request.url);

    // 清除 session cookie
    const response = Response.redirect(`${url.origin}`, 302);
    response.headers.set('Set-Cookie', 'session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');

    return response;
}
