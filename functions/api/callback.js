export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  const code = searchParams.get('code');

  if (!code) {
    return new Response('No code provided', { status: 400 });
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id:     context.env.GITHUB_CLIENT_ID,
      client_secret: context.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data = await tokenRes.json();
  const token = data.access_token;

  const message = token
    ? { token, provider: 'github' }
    : { error: data.error_description || 'Authentication failed' };

  const status = token ? 'success' : 'error';

  const html = `<!DOCTYPE html><html><body><script>
    window.opener.postMessage(
      'authorization:github:${status}:' + JSON.stringify(${JSON.stringify(message)}),
      '*'
    );
    window.close();
  </script></body></html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
