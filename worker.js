export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ── OAuth: redirect to GitHub login ──
    if (url.pathname === '/api/auth') {
      const provider = url.searchParams.get('provider');
      if (provider !== 'github') {
        return new Response('Invalid provider', { status: 400 });
      }
      const authUrl = new URL('https://github.com/login/oauth/authorize');
      authUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
      authUrl.searchParams.set('scope', 'repo,user');
      return Response.redirect(authUrl.toString(), 302);
    }

    // ── OAuth: exchange code for token ──
    if (url.pathname === '/api/callback') {
      const code = url.searchParams.get('code');
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
          client_id:     env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const data = await tokenRes.json();
      const token = data.access_token;
      const status = token ? 'success' : 'error';
      const payload = token
        ? { token, provider: 'github' }
        : { error: data.error_description || 'Authentication failed' };

      // Post message back to Decap CMS opener window
      const postMsg = JSON.stringify(
        'authorization:github:' + status + ':' + JSON.stringify(payload)
      );

      const html = `<!DOCTYPE html><html><body><script>
        window.opener.postMessage(${postMsg}, '*');
        window.close();
      </script></body></html>`;

      return new Response(html, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // ── Everything else: serve static assets ──
    return env.ASSETS.fetch(request);
  },
};
