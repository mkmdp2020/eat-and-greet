export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  const provider = searchParams.get('provider');

  if (provider !== 'github') {
    return new Response('Invalid provider', { status: 400 });
  }

  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubAuthUrl.searchParams.set('client_id', context.env.GITHUB_CLIENT_ID);
  githubAuthUrl.searchParams.set('scope', 'repo,user');

  return Response.redirect(githubAuthUrl.toString(), 302);
}
