import type { ColorSource, IRenderer } from '@pixi/webworker';
import { Application, Graphics, ParticleContainer, Sprite } from '@pixi/webworker';
import init, { Universe } from '../../pkg/game_of_life.js';
import type { InitPayload, MsgData, TogglePayload } from './payload.js';
import { createMsgData, MsgDataEnum } from './payload.js';

let universe: Universe;
let tickTimer = 0;

let app: Application;

function startTick() {
    clearInterval(tickTimer);
    tickTimer = setInterval(() => universe.tick(), 1000 / 30);
}

function createRectTexture(renderer: IRenderer, color: ColorSource, size: number) {
    const graphics = new Graphics();
    graphics.beginFill(color);
    graphics.drawRect(0, 0, size, size);
    graphics.endFill();
    const texture = renderer.generateTexture(graphics);
    graphics.clear();
    return texture;
}

async function start(initPayload: InitPayload): Promise<void> {
    const { width, height, canvas, cellSize, deadColor = '#FFFFFF', aliveColor = '#000000' } = initPayload;

    await init();
    app = new Application({
        view: canvas,
        hello: true,
    });
    app.renderer.background.color = deadColor;
    app.renderer.resize((cellSize + 1) * width + 1, (cellSize + 1) * height + 1);

    const maxSize = width * height;
    const texture = createRectTexture(app.renderer, aliveColor, cellSize);

    const sprites = new ParticleContainer(maxSize, {
        scale: false,
        position: false,
        rotation: false,
        uvs: false,
        alpha: true,
    });
    for (let i = 0; i < maxSize; i++) {
        const cell = new Sprite(texture);
        const row = Math.floor(i / width);
        const col = i % width;
        cell.position.set(col * (cellSize + 1) + 1, row * (cellSize + 1) + 1);
        cell.alpha = 0;
        sprites.addChild(cell);
    }
    app.stage.addChild(sprites);

    universe = Universe.new(width, height);

    const drawCells = () => {
        const cells = universe.cells();
        for (let i = 0; i < cells.length; i++) {
            sprites.children[i].alpha = cells[i];
        }
    };
    app.ticker.add(() => {
        drawCells();
        self.postMessage(createMsgData(MsgDataEnum.render, Math.round(app.ticker.FPS)));
    });
    startTick();
}

function toggle(toggle: TogglePayload) {
    universe.toggle_cell(toggle.row, toggle.col);
}

function pause(value: boolean) {
    if (value) {
        clearInterval(tickTimer);
    } else {
        startTick();
    }
}

self.addEventListener('message', (ev) => {
    const { type, payload } = ev.data as MsgData;
    switch (type) {
        case MsgDataEnum.init: {
            start(payload);
            break;
        }
        case MsgDataEnum.toggle: {
            toggle(payload);
            break;
        }
        case MsgDataEnum.pause: {
            pause(payload);
            break;
        }
    }
});
