export async function POST(request, { params }) {
    const path = (await params).path.join('/')
    const backendUrl = process.env.BACKEND_URL

    const body = await request.arrayBuffer()
    const headers = Object.fromEntries(request.headers)
    delete headers['host']
    delete headers['content-length']

    const response = await fetch(`${backendUrl}/${path}`, {
        method: 'POST',
        headers,
        body,
    })

    const data = await response.arrayBuffer()
    return new Response(data, {
        status: response.status,
        headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/json' },
    })
}

export async function GET(request, { params }) {
    const path = (await params).path.join('/')
    const backendUrl = process.env.BACKEND_URL

    const response = await fetch(`${backendUrl}/${path}`)
    const data = await response.arrayBuffer()
    return new Response(data, {
        status: response.status,
        headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/json' },
    })
}