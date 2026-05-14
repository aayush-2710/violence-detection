// frontend/src/app/api/proxy/[...path]/route.js
export async function POST(request, { params }) {
    const path = params.path.join('/');
    const backendUrl = process.env.BACKEND_URL; // server-side, not NEXT_PUBLIC

    const body = await request.arrayBuffer();
    const headers = Object.fromEntries(request.headers);
    delete headers['host'];

    const response = await fetch(`${backendUrl}/${path}`, {
        method: 'POST',
        headers,
        body,
    });

    const data = await response.arrayBuffer();
    return new Response(data, {
        status: response.status,
        headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/json' },
    });
}

export async function GET(request, { params }) {
    const path = params.path.join('/');
    const backendUrl = process.env.BACKEND_URL;

    const response = await fetch(`${backendUrl}/${path}`);
    const data = await response.arrayBuffer();
    return new Response(data, {
        status: response.status,
        headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/json' },
    });
}