module.exports = async (req, res) => {
  const { user } = req.query;
  if (!user) { res.status(400).end(); return; }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');

  try {
    const pageRes = await fetch(`https://www.threads.net/@${encodeURIComponent(user)}`, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html,application/xhtml+xml',
      }
    });
    const html = await pageRes.text();

    const m = html.match(/property="og:image"\s+content="([^"]+)"/);
    if (!m) { res.status(404).end(); return; }

    const imgUrl = m[1].replace(/&amp;/g, '&');
    const imgRes = await fetch(imgUrl);
    if (!imgRes.ok) { res.status(imgRes.status).end(); return; }

    const buf = await imgRes.arrayBuffer();
    res.setHeader('Content-Type', imgRes.headers.get('content-type') || 'image/jpeg');
    res.end(Buffer.from(buf));
  } catch (e) {
    res.status(500).end();
  }
};
