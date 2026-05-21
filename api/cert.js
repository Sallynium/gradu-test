const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const FONT_B64 = fs.readFileSync(path.join(process.cwd(), 'fonts', 'NotoSansTC.ttf')).toString('base64');
const FONT_SRC = `data:font/ttf;base64,${FONT_B64}`;

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
    const SIZE = 2481;

    const avatarRes = await fetch(`https://www.threads.net/@${encodeURIComponent(user)}`, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html,application/xhtml+xml',
      }
    });
    const html = await avatarRes.text();

    let avatarBuf;
    const imgMatch = html.match(/property="og:image"\s+content="([^"]+)"/);
    if (imgMatch) {
      const imgUrl = imgMatch[1].replace(/&amp;/g, '&');
      const imgRes = await fetch(imgUrl);
      if (imgRes.ok) avatarBuf = Buffer.from(await imgRes.arrayBuffer());
    }

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
      composites.push({ input: circleAvatar, top: 685, left: 1535 });
    }

    const textSvg = `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @font-face {
            font-family: 'NotoSansTC';
            src: url('${FONT_SRC}');
          }
        </style>
      </defs>
      <text x="1750" y="1450" font-size="60" font-weight="bold" fill="black"
            text-anchor="middle" font-family="NotoSansTC, sans-serif">${esc(displayName)}</text>
      <text x="1750" y="1530" font-size="46" fill="#444444"
            text-anchor="middle" font-family="NotoSansTC, sans-serif">${esc('@' + user)}</text>
      <text x="1580" y="1980" font-size="100" font-weight="bold" fill="black"
            text-anchor="middle" font-family="NotoSansTC, sans-serif">${esc(num)}</text>
    </svg>`;
    composites.push({ input: Buffer.from(textSvg), top: 0, left: 0 });

    const output = await sharp(TEMPLATE)
      .resize(SIZE, SIZE, { fit: 'fill' })
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
