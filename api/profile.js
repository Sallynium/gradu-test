module.exports = async (req, res) => {
  const { user } = req.query;
  if (!user) { res.status(400).json({ error: 'missing user' }); return; }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  try {
    const pageRes = await fetch(`https://www.threads.net/@${encodeURIComponent(user)}`, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html,application/xhtml+xml',
      }
    });
    const html = await pageRes.text();

    const titleMatch = html.match(/property="og:title"\s+content="([^"]+)"/);
    let displayName = user;
    if (titleMatch) {
      const raw = titleMatch[1]
        .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
        .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      const m = raw.match(/^(.+?)\s*[\(@•｜|]/);
      displayName = m ? m[1].trim() : raw.split(' on ')[0].trim();
    }

    res.json({ displayName, username: user });
  } catch (e) {
    res.json({ displayName: user, username: user });
  }
};
