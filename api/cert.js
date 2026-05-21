const { createCanvas, loadImage, registerFont } = require('canvas');
const sharp = require('sharp');
const path = require('path');

registerFont(path.join(process.cwd(), 'fonts', 'NotoSansTC-Regular.otf'), { family: 'Noto Sans CJK TC' });

const SIZE = 2481;
const AVATAR_D = 430;
const AVATAR_R = AVATAR_D / 2;
const AVATAR_CX = 1750;
const AVATAR_CY = 900;

module.exports = async (req, res) => {
  const { user, name, num } = req.query;
  if (!user || !num) {
    res.status(400).json({ error: 'missing user or num' });
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');

  try {
    // 抓 Threads 資料
    const pageRes = await fetch(`https://www.threads.net/@${encodeURIComponent(user)}`, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html,application/xhtml+xml',
      }
    });
    const html = await pageRes.text();

    let avatarBuf = null;
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

    // 建 canvas
    const canvas = createCanvas(SIZE, SIZE);
    const ctx = canvas.getContext('2d');

    // 畫底圖
    const template = await loadImage(path.join(process.cwd(), 'template.png'));
    ctx.drawImage(template, 0, 0, SIZE, SIZE);

    // 畫圓形頭貼
    if (avatarBuf) {
      const avatarImg = await loadImage(avatarBuf);
      ctx.save();
      ctx.beginPath();
      ctx.arc(AVATAR_CX, AVATAR_CY, AVATAR_R, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatarImg, AVATAR_CX - AVATAR_R, AVATAR_CY - AVATAR_R, AVATAR_D, AVATAR_D);
      ctx.restore();
    }

    // 畫文字
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    ctx.font = 'bold 110px "Noto Sans CJK TC"';
    ctx.fillStyle = '#000000';
    ctx.fillText(displayName, 1750, 1450);

    ctx.font = '75px "Noto Sans CJK TC"';
    ctx.fillStyle = '#444444';
    ctx.fillText('@' + user, 1750, 1530);

    ctx.font = 'bold 200px "Noto Sans CJK TC"';
    ctx.fillStyle = '#000000';
    ctx.fillText(num, 1580, 1980);

    const buf = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.end(buf);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};
