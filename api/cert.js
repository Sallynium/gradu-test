const sharp = require('sharp');
const path = require('path');

module.exports = async (req, res) => {
  const { user, name, num } = req.query;
  if (!user || !num) {
    res.status(400).json({ error: 'missing user or num' });
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');

  try {
    const TEMPLATE = path.join(process.cwd(), 'template.png');

    // 抓頭貼
    const avatarRes = await fetch(`https://www.threads.net/@${encodeURIComponent(user)}`, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html,application/xhtml+xml',
      }
    });
    const html = await avatarRes.text();
    const m = html.match(/property="og:image"\s+content="([^"]+)"/);

    let avatarBuf;
    if (m) {
      const imgUrl = m[1].replace(/&amp;/g, '&');
      const imgRes = await fetch(imgUrl);
      if (imgRes.ok) {
        avatarBuf = Buffer.from(await imgRes.arrayBuffer());
      }
    }

    // 解析顯示名稱（若未傳 name 參數）
    let displayName = name || user;
    if (!name) {
      const titleMatch = html.match(/property="og:title"\s+content="([^"]+)"/);
      if (titleMatch) {
        const raw = titleMatch[1]
          .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
          .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
          .replace(/&amp;/g, '&');
        const nm = raw.match(/^(.+?)\s*[\(@•｜|]/);
        displayName = nm ? nm[1].trim() : raw.split(' on ')[0].trim();
      }
    }

    // 圓形頭貼
    const AVATAR_D = 430;
    const AVATAR_R = AVATAR_D / 2;
    const circleMask = Buffer.from(
      `<svg width="${AVATAR_D}" height="${AVATAR_D}">
        <circle cx="${AVATAR_R}" cy="${AVATAR_R}" r="${AVATAR_R}" fill="white"/>
      </svg>`
    );

    const composites = [];

    if (avatarBuf) {
      const circleAvatar = await sharp(avatarBuf)
        .resize(AVATAR_D, AVATAR_D, { fit: 'cover' })
        .composite([{ input: circleMask, blend: 'dest-in' }])
        .png()
        .toBuffer();
      composites.push({ input: circleAvatar, top: 755, left: 1415 });
    }

    const { width, height } = await sharp(TEMPLATE).metadata();
    const textSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <text x="1630" y="1250" font-size="60" font-weight="bold" fill="black"
            text-anchor="middle" font-family="Arial, sans-serif">${esc(displayName)}</text>
      <text x="1630" y="1340" font-size="46" fill="#444444"
            text-anchor="middle" font-family="Arial, sans-serif">${esc('@' + user)}</text>
      <text x="1560" y="2005" font-size="46" fill="black"
            text-anchor="middle" font-family="Arial, sans-serif">${esc(num)}</text>
    </svg>`;
    composites.push({ input: Buffer.from(textSvg), top: 0, left: 0 });

    const output = await sharp(TEMPLATE)
      .composite(composites)
      .png()
      .toBuffer();

    res.setHeader('Content-Type', 'image/png');
    res.end(output);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
