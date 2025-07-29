export default class Minimap {
  constructor(world, player) {
    this.world = world;
    this.player = player;
    this.scale = 2; // pixels per tile

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'minimap';
    this.canvas.width = world.width * this.scale;
    this.canvas.height = world.height * this.scale;
    // Use inline dimensions so CSS rules won't stretch the minimap
    this.canvas.style.width = `${this.canvas.width}px`;
    this.canvas.style.height = `${this.canvas.height}px`;
    this.ctx = this.canvas.getContext('2d');
  }

  attach(container) {
    container.appendChild(this.canvas);
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const pixelX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      const pixelY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
      const x = Math.floor(pixelX / this.scale);
      const y = Math.floor(pixelY / this.scale);
      if (this.world.isWithinBounds(x, y)) {
        this.player.moveTo(x, y);
      }
    });
  }

  draw() {
    const ctx = this.ctx;
    const { width, height } = this.world;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = this.world.tiles[y][x];
        let color = '#1a253a';
        if (tile.type && tile.type !== 'empty') {
          color = {
            ore: '#8888aa',
            logs: '#aa8844'
          }[tile.type] || color;
        }
        ctx.fillStyle = color;
        ctx.fillRect(x * this.scale, y * this.scale, this.scale, this.scale);
      }
    }
    // Draw player
    ctx.fillStyle = '#00ffab';
    ctx.fillRect(
      this.player.x * this.scale,
      this.player.y * this.scale,
      this.scale,
      this.scale
    );
  }
}
