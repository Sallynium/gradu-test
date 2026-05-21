const sharp = require('sharp');
const path = require('path');

async function generateCert({ avatarPath, name, userId, certNum, outputPath }) {
  const TEMPLATE = path.join(__dirname, 'template.png');
  const SIZE = 2481;

  const AVATAR_D = 430;
  const AVATAR_R = AVATAR_D / 2;
  const AVATAR_LEFT = 1750 - AVATAR_R;  // 1535
  const AVATAR_TOP  =  900 - AVATAR_R;  //  685

  const circleMask = Buffer.from(
    `<svg width="${AVATAR_D}" height="${AVATAR_D}">
      <circle cx="${AVATAR_R}" cy="${AVATAR_R}" r="${AVATAR_R}" fill="white"/>
    </svg>`
  );

  const avatarBuf = await sharp(avatarPath)
    .resize(AVATAR_D, AVATAR_D, { fit: 'cover' })
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const textSvg = `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
    <text x="1750" y="1450" font-size="60" font-weight="bold" fill="black"
          text-anchor="middle" font-family="Arial, sans-serif">${esc(name)}</text>
    <text x="1750" y="1530" font-size="46" fill="#444444"
          text-anchor="middle" font-family="Arial, sans-serif">${esc(userId)}</text>
    <text x="1500" y="1930" font-size="36" fill="#888888"
          text-anchor="middle" font-family="Arial, sans-serif">畢業序號</text>
    <text x="1500" y="2030" font-size="100" font-weight="bold" fill="black"
          text-anchor="middle" font-family="Arial, sans-serif">${esc(certNum)}</text>
  </svg>`;

  await sharp(TEMPLATE)
    .resize(SIZE, SIZE, { fit: 'fill' })
    .composite([
      { input: avatarBuf, top: AVATAR_TOP, left: AVATAR_LEFT },
      { input: Buffer.from(textSvg), top: 0, left: 0 },
    ])
    .png()
    .toFile(outputPath || 'output_cert.png');

  console.log('done:', outputPath || 'output_cert.png');
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// 執行：node generate-cert.js <頭貼路徑> <名字> <ID> <序號>
generateCert({
  avatarPath: process.argv[2] || 'test_avatar.jpg',
  name:       process.argv[3] || 'Z量人',
  userId:     process.argv[4] || '@chenchen_powerman',
  certNum:    process.argv[5] || '# 144',
  outputPath: 'output_cert.png',
}).catch(console.error);
