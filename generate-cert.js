const sharp = require('sharp');
const path = require('path');

async function generateCert({ avatarPath, name, userId, certNum, outputPath }) {
  const TEMPLATE = path.join(__dirname, 'template.png');

  const AVATAR_D = 430;
  const AVATAR_R = AVATAR_D / 2;
  const AVATAR_LEFT = 1630 - AVATAR_R;  // 1415
  const AVATAR_TOP  =  970 - AVATAR_R;  //  755

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

  const { width, height } = await sharp(TEMPLATE).metadata();

  const textSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <text x="1630" y="1250" font-size="60" font-weight="bold" fill="black"
          text-anchor="middle" font-family="Arial, sans-serif">${esc(name)}</text>
    <text x="1630" y="1340" font-size="46" fill="#444444"
          text-anchor="middle" font-family="Arial, sans-serif">${esc(userId)}</text>
    <text x="1560" y="2005" font-size="46" fill="black"
          text-anchor="middle" font-family="Arial, sans-serif">${esc(certNum)}</text>
  </svg>`;

  await sharp(TEMPLATE)
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
  name:       process.argv[3] || '測試名字',
  userId:     process.argv[4] || 'testuser',
  certNum:    process.argv[5] || 'LOL-2024-00001',
  outputPath: 'output_cert.png',
}).catch(console.error);
