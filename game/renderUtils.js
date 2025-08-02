export function drawOutlinedImage(
  ctx,
  img,
  sx,
  sy,
  sw,
  sh,
  dx,
  dy,
  dw,
  dh,
  color = '#000'
) {
  ctx.save();
  for (let offY = -1; offY <= 1; offY++) {
    for (let offX = -1; offX <= 1; offX++) {
      if (offX === 0 && offY === 0) continue;
      ctx.drawImage(img, sx, sy, sw, sh, dx + offX, dy + offY, dw, dh);
    }
  }
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(dx - 1, dy - 1, dw + 2, dh + 2);
  ctx.restore();
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}
