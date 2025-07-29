export default class Minimap {
  constructor(world, player) {
    this.world = world;
    this.player = player;

    // Pixel size of one tile when fully zoomed in (one chunk visible)
    this.baseScale = 6;
    this.zoom = 1; // 1 => one chunk visible, 2 => two chunks, etc.

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'minimap';
    this.canvas.width = world.chunkWidth * this.baseScale;
    this.canvas.height = world.chunkHeight * this.baseScale;
    // Use inline dimensions so CSS rules won't stretch the minimap
    this.canvas.style.width = `${this.canvas.width}px`;
    this.canvas.style.height = `${this.canvas.height}px`;
    this.ctx = this.canvas.getContext('2d');

    this.dragging = false;
    this.selectionStart = null;
    this.selectionEnd = null;

    this.maxZoom = Math.max(
      world.width / world.chunkWidth,
      world.height / world.chunkHeight
    );
    this.minZoom = 0.5;
  }

  attach(container) {
    container.appendChild(this.canvas);
    this.canvas.addEventListener('click', (e) => {
      // Left click moves the player within the minimap region
      if (e.button !== 0) return;
      const rect = this.canvas.getBoundingClientRect();
      const pixelX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      const pixelY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
      const { x, y } = this.pixelToWorld(pixelX, pixelY);
      if (this.world.isWithinBounds(x, y)) {
        this.player.moveTo(x, y);
      }
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const dir = Math.sign(e.deltaY);
      if (dir > 0) {
        this.zoom = Math.min(this.maxZoom, this.zoom * 1.2);
      } else if (dir < 0) {
        this.zoom = Math.max(this.minZoom, this.zoom / 1.2);
      }
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 2) {
        this.dragging = true;
        const rect = this.canvas.getBoundingClientRect();
        this.selectionStart = {
          x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
          y: (e.clientY - rect.top) * (this.canvas.height / rect.height),
        };
        this.selectionEnd = null;
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.dragging) {
        const rect = this.canvas.getBoundingClientRect();
        this.selectionEnd = {
          x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
          y: (e.clientY - rect.top) * (this.canvas.height / rect.height),
        };
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (e.button === 2 && this.dragging) {
        this.dragging = false;
        if (this.selectionEnd &&
            (Math.abs(this.selectionEnd.x - this.selectionStart.x) > 3 ||
             Math.abs(this.selectionEnd.y - this.selectionStart.y) > 3)) {
          // Zoom to the selected rectangle
          const start = this.pixelToWorld(this.selectionStart.x, this.selectionStart.y);
          const end = this.pixelToWorld(this.selectionEnd.x, this.selectionEnd.y);
          const width = Math.abs(end.x - start.x) || 1;
          const height = Math.abs(end.y - start.y) || 1;
          const zoomX = width / this.world.chunkWidth;
          const zoomY = height / this.world.chunkHeight;
          this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, Math.max(zoomX, zoomY)));
        } else {
          // Single right click resets zoom
          this.zoom = 1;
        }
        this.selectionStart = null;
        this.selectionEnd = null;
      }
    });
  }

  pixelToWorld(px, py) {
    const tileSize = this.baseScale / this.zoom;
    const viewWidth = this.world.chunkWidth * this.zoom;
    const viewHeight = this.world.chunkHeight * this.zoom;
    const startX = Math.floor(this.player.x - viewWidth / 2);
    const startY = Math.floor(this.player.y - viewHeight / 2);
    const x = Math.floor(px / tileSize) + startX;
    const y = Math.floor(py / tileSize) + startY;
    return { x, y };
  }

  draw() {
    const ctx = this.ctx;
    const tileSize = this.baseScale / this.zoom;
    const viewWidth = Math.ceil(this.world.chunkWidth * this.zoom);
    const viewHeight = Math.ceil(this.world.chunkHeight * this.zoom);
    const startX = Math.floor(this.player.x - viewWidth / 2);
    const startY = Math.floor(this.player.y - viewHeight / 2);

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let vy = 0; vy < viewHeight; vy++) {
      const wy = startY + vy;
      if (!this.world.tiles[wy]) continue;
      for (let vx = 0; vx < viewWidth; vx++) {
        const wx = startX + vx;
        const tile = this.world.tiles[wy][wx];
        if (!tile) continue;
        let color = '#1a253a';
        if (tile.type && tile.type !== 'empty') {
          color = {
            ore: '#8888aa',
            logs: '#aa8844'
          }[tile.type] || color;
        }
        ctx.fillStyle = color;
        ctx.fillRect(vx * tileSize, vy * tileSize, tileSize, tileSize);
      }
    }

    // Selection rectangle while dragging
    if (this.dragging && this.selectionStart && this.selectionEnd) {
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 1;
      const x = Math.min(this.selectionStart.x, this.selectionEnd.x);
      const y = Math.min(this.selectionStart.y, this.selectionEnd.y);
      const w = Math.abs(this.selectionEnd.x - this.selectionStart.x);
      const h = Math.abs(this.selectionEnd.y - this.selectionStart.y);
      ctx.strokeRect(x, y, w, h);
    }

    // Draw player at center of map
    ctx.fillStyle = '#00ffab';
    const px = (this.player.x - startX) * tileSize;
    const py = (this.player.y - startY) * tileSize;
    ctx.fillRect(px, py, tileSize, tileSize);
  }
}
