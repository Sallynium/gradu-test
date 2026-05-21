const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

registerFont(path.join(__dirname, 'fonts', 'Iansui-Regular.ttf'), { family: 'Iansui' });

const SIZE = 2481;
const AVATAR_D = 430;
const AVATAR_R = AVATAR_D / 2;
const AVATAR_CX = 1750;
const AVATAR_CY = 900;

async function generateCert({ avatarPath, name, userId, certNum, outputPath }) {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');

  const template = await loadImage(path.join(__dirname, 'template.png'));
  ctx.drawImage(template, 0, 0, SIZE, SIZE);

  const avatarImg = await loadImage(avatarPath);
  ctx.save();
  ctx.beginPath();
  ctx.arc(AVATAR_CX, AVATAR_CY, AVATAR_R, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(avatarImg, AVATAR_CX - AVATAR_R, AVATAR_CY - AVATAR_R, AVATAR_D, AVATAR_D);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  ctx.font = 'bold 60px Iansui';
  ctx.fillStyle = '#000000';
  ctx.fillText(name, 1750, 1450);

  ctx.font = '46px Iansui';
  ctx.fillStyle = '#444444';
  ctx.fillText(userId, 1750, 1530);

  ctx.font = 'bold 100px Iansui';
  ctx.fillStyle = '#000000';
  ctx.fillText(certNum, 1580, 1980);

  fs.writeFileSync(outputPath || 'output_cert.png', canvas.toBuffer('image/png'));
  console.log('done:', outputPath || 'output_cert.png');
}

generateCert({
  avatarPath: process.argv[2] || 'test_avatar.jpg',
  name:       process.argv[3] || 'Z量人',
  userId:     process.argv[4] || '@chenchen_powerman',
  certNum:    process.argv[5] || '# 144',
  outputPath: 'output_cert.png',
}).catch(console.error);
