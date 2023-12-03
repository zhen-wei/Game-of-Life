import 'virtual:uno.css';
import type { MsgData } from './payload.js';
import { createMsgData, MsgDataEnum } from './payload.js';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const controlButton = document.getElementById('controlButton') as HTMLButtonElement;
const fpsDisplay = document.getElementById('fpsDisplay') as HTMLDivElement;
const ctx = canvas.getContext('bitmaprenderer')!;

const width = 640;
const height = 360;
const cellSize = 2;

const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

worker.postMessage(
    createMsgData(MsgDataEnum.init, {
        width,
        height,
        cellSize,
    }),
);

worker.addEventListener('message', (ev) => {
    const { type, payload } = ev.data as MsgData;
    if (type === MsgDataEnum.render) {
        const { bitmap, fps } = payload;
        ctx.transferFromImageBitmap(bitmap);
        fpsDisplay.textContent = fps.toString();
    }
});

canvas.addEventListener('click', (event) => {
    const boundingRect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / boundingRect.width;
    const scaleY = canvas.height / boundingRect.height;

    const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
    const canvasTop = (event.clientY - boundingRect.top) * scaleY;

    const row = Math.min(Math.floor(canvasTop / (cellSize + 1)), height - 1);
    const col = Math.min(Math.floor(canvasLeft / (cellSize + 1)), width - 1);
    worker.postMessage(createMsgData(MsgDataEnum.toggle, { row, col }));
});

controlButton.addEventListener('click', () => {
    const pause = controlButton.value === 'true';
    worker.postMessage(createMsgData(MsgDataEnum.pause, pause));
    controlButton.value = pause ? 'false' : 'true';
    controlButton.textContent = pause ? '恢復' : '暫停';
});

const resizeObserver = new ResizeObserver((entrys) => {
    for (const entry of entrys) {
        const { width, height } = entry.contentRect;
        canvas.width = width;
        canvas.height = height;
    }
});

resizeObserver.observe(canvas);
