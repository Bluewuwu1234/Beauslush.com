(() => {
    if (!window.Matter) {
        document.getElementById('shapeStatus').textContent = 'Physics could not load. Refresh to try again.';
        return;
    }

    const { Engine, Bodies, Body, Composite, Sleeping } = Matter;
    const engine = Engine.create();
    const canvas = document.getElementById('shapesCanvas');
    const paper = document.getElementById('canvasPaper');
    const layer = document.getElementById('shapeLayer');
    const stage = canvas.parentElement;
    const inspector = document.getElementById('shapeInspector');
    const colorInput = document.getElementById('shapeColor');
    const scaleInput = document.getElementById('shapeScale');
    const rotationInput = document.getElementById('shapeRotation');
    const status = document.getElementById('shapeStatus');
    const bodyElements = new Map();
    let bounds = [];
    let selectedBody = null;
    let draggedBody = null;
    let paletteDrag = null;
    let suppressPaletteClick = false;
    let worldWidth = 800;
    let worldHeight = 450;
    let lastFrame = performance.now();

    engine.gravity.y = 1;
    engine.gravity.scale = 0.001;
    engine.enableSleeping = true;

    function polygonPoints(sides, outerRadius, innerRadius = outerRadius) {
        return Array.from({ length: sides }, (_, index) => {
            const angle = -Math.PI / 2 + index * Math.PI * 2 / sides;
            const radius = index % 2 === 0 ? outerRadius : innerRadius;
            return `${Math.cos(angle) * radius},${Math.sin(angle) * radius}`;
        }).join(' ');
    }

    function makeBody(type, x, y) {
        const options = { friction: 0.78, frictionStatic: 0.95, restitution: 0.04, density: 0.0015 };
        let body;
        if (type === 'square') body = Bodies.rectangle(x, y, 64, 64, options);
        else if (type === 'circle' || type === 'star') body = Bodies.circle(x, y, 33, { ...options, friction: 0.68 });
        else {
            const sides = { triangle: 3, pentagon: 5, hexagon: 6 }[type];
            body = Bodies.polygon(x, y, sides, 37, options);
        }
        if (type === 'triangle') Body.setAngle(body, Math.PI / 2);
        body.plugin.shapeType = type;
        body.plugin.shapeScale = 1;
        body.plugin.color = '#477be0';
        return body;
    }

    function makeSvgShape(type, body) {
        const shape = document.createElementNS('http://www.w3.org/2000/svg', type === 'square' ? 'rect' : type === 'circle' ? 'circle' : 'polygon');
        if (type === 'square') {
            shape.setAttribute('x', '-32'); shape.setAttribute('y', '-32');
            shape.setAttribute('width', '64'); shape.setAttribute('height', '64');
        } else if (type === 'circle') {
            shape.setAttribute('r', '33');
        } else {
            if (type === 'star') {
                shape.setAttribute('points', polygonPoints(10, 39, 18));
            } else {
                const cos = Math.cos(body.angle);
                const sin = Math.sin(body.angle);
                const points = body.vertices.map(vertex => {
                    const dx = vertex.x - body.position.x;
                    const dy = vertex.y - body.position.y;
                    return `${dx * cos + dy * sin},${-dx * sin + dy * cos}`;
                });
                shape.setAttribute('points', points.join(' '));
            }
        }
        return shape;
    }

    function selectBody(body) {
        selectedBody = body;
        bodyElements.forEach((group, item) => {
            group.lastElementChild.setAttribute('visibility', item === body ? 'visible' : 'hidden');
        });
        inspector.disabled = !body;
        if (!body) {
            status.textContent = '';
            return;
        }
        colorInput.value = body.plugin.color;
        scaleInput.value = body.plugin.shapeScale;
        rotationInput.value = String(Math.round(body.angle * 180 / Math.PI));
        document.getElementById('scaleValue').value = `${Number(body.plugin.shapeScale).toFixed(2)}x`;
        document.getElementById('rotationValue').value = `${rotationInput.value}°`;
        status.textContent = '';
        Sleeping.set(body, false);
    }

    function addShape(type, x, y) {
        const body = makeBody(type, x, y);
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.classList.add('shape-item');
        group.dataset.type = type;
        group.append(makeSvgShape(type, body));
        const outline = makeSvgShape(type, body);
        outline.classList.add('selection-outline');
        group.append(outline);
        layer.append(group);
        bodyElements.set(body, group);
        Composite.add(engine.world, body);
        selectBody(body);
    }

    function drawBody(body, group) {
        const position = body.position;
        const angle = body.angle * 180 / Math.PI;
        const scale = body.plugin.shapeScale;
        group.setAttribute('transform', `translate(${position.x} ${position.y}) rotate(${angle}) scale(${scale})`);
        group.firstElementChild.setAttribute('fill', body.plugin.color);
    }

    function resizeWorld() {
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(240, rect.width);
        const height = Math.max(120, rect.height);
        if (Math.abs(width - worldWidth) < 1 && Math.abs(height - worldHeight) < 1) return;
        worldWidth = width;
        worldHeight = height;
        canvas.setAttribute('viewBox', `0 0 ${worldWidth} ${worldHeight}`);
        paper.setAttribute('width', String(worldWidth));
        paper.setAttribute('height', String(worldHeight));
        bounds.forEach(bound => Composite.remove(engine.world, bound));
        bounds = [
            Bodies.rectangle(width / 2, height + 21, width + 100, 48, { isStatic: true, friction: 0.9 }),
            Bodies.rectangle(-24, height / 2, 48, height + 100, { isStatic: true }),
            Bodies.rectangle(width + 24, height / 2, 48, height + 100, { isStatic: true })
        ];
        Composite.add(engine.world, bounds);
        bodyElements.forEach((_, body) => {
            Body.setPosition(body, {
                x: Math.max(34, Math.min(width - 34, body.position.x)),
                y: Math.max(20, Math.min(height - 20, body.position.y))
            });
        });
    }

    function pointFromEvent(event) {
        const rect = canvas.getBoundingClientRect();
        return { x: (event.clientX - rect.left) * worldWidth / rect.width, y: (event.clientY - rect.top) * worldHeight / rect.height };
    }

    function animate(now) {
        resizeWorld();
        Engine.update(engine, Math.min(now - lastFrame, 1000 / 60));
        lastFrame = now;
        bodyElements.forEach((group, body) => drawBody(body, group));
        requestAnimationFrame(animate);
    }

    document.querySelectorAll('[data-shape]').forEach(button => {
        button.addEventListener('click', () => {
            if (suppressPaletteClick) { suppressPaletteClick = false; return; }
            addShape(button.dataset.shape, worldWidth / 2, Math.min(55, worldHeight * 0.18));
        });
    });

    document.addEventListener('pointerdown', event => {
        const button = event.target.closest('[data-shape]');
        if (button) paletteDrag = { type: button.dataset.shape, startX: event.clientX, startY: event.clientY, moved: false };
    });
    document.addEventListener('pointermove', event => {
        if (!paletteDrag) return;
        if (Math.hypot(event.clientX - paletteDrag.startX, event.clientY - paletteDrag.startY) > 7) paletteDrag.moved = true;
    });
    document.addEventListener('pointerup', event => {
        if (!paletteDrag) return;
        if (paletteDrag.moved) {
            suppressPaletteClick = true;
            const rect = canvas.getBoundingClientRect();
            if (event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom) {
                const point = pointFromEvent(event);
                addShape(paletteDrag.type, point.x, point.y);
            }
            window.setTimeout(() => { suppressPaletteClick = false; }, 0);
        }
        paletteDrag = null;
    });
    document.addEventListener('pointercancel', () => { paletteDrag = null; });

    canvas.addEventListener('pointerdown', event => {
        const group = event.target.closest('.shape-item');
        if (!group) { selectBody(null); return; }
        const body = [...bodyElements.entries()].find(([, element]) => element === group)?.[0];
        if (!body) return;
        selectBody(body);
        draggedBody = body;
        const point = pointFromEvent(event);
        draggedBody.plugin.dragOffset = { x: point.x - body.position.x, y: point.y - body.position.y };
        canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', event => {
        if (!draggedBody) return;
        const point = pointFromEvent(event);
        const offset = draggedBody.plugin.dragOffset;
        Body.setPosition(draggedBody, {
            x: Math.max(34, Math.min(worldWidth - 34, point.x - offset.x)),
            y: Math.max(34, Math.min(worldHeight - 34, point.y - offset.y))
        });
        Sleeping.set(draggedBody, false);
        Body.setVelocity(draggedBody, { x: 0, y: 0 });
        Body.setAngularVelocity(draggedBody, 0);
    });
    function releaseBody() {
        if (!draggedBody) return;
        Body.setVelocity(draggedBody, { x: 0, y: 0 });
        Body.setAngularVelocity(draggedBody, 0);
        Sleeping.set(draggedBody, false);
        draggedBody = null;
    }
    document.addEventListener('pointerup', releaseBody);
    document.addEventListener('pointercancel', releaseBody);

    colorInput.addEventListener('input', () => {
        if (!selectedBody) return;
        selectedBody.plugin.color = colorInput.value;
        bodyElements.get(selectedBody).firstElementChild.setAttribute('fill', colorInput.value);
    });
    scaleInput.addEventListener('input', () => {
        if (!selectedBody) return;
        const nextScale = Number(scaleInput.value);
        const ratio = nextScale / selectedBody.plugin.shapeScale;
        Body.scale(selectedBody, ratio, ratio);
        selectedBody.plugin.shapeScale = nextScale;
        document.getElementById('scaleValue').value = `${nextScale.toFixed(2)}x`;
    });
    rotationInput.addEventListener('input', () => {
        if (!selectedBody) return;
        Body.setAngle(selectedBody, Number(rotationInput.value) * Math.PI / 180);
        Body.setAngularVelocity(selectedBody, 0);
        document.getElementById('rotationValue').value = `${rotationInput.value}°`;
    });
    document.getElementById('deleteShape').addEventListener('click', () => {
        if (!selectedBody) return;
        Composite.remove(engine.world, selectedBody);
        bodyElements.get(selectedBody).remove();
        bodyElements.delete(selectedBody);
        selectBody(null);
    });
    document.getElementById('clearShapes').addEventListener('click', () => {
        bodyElements.forEach((group, body) => { Composite.remove(engine.world, body); group.remove(); });
        bodyElements.clear();
        selectBody(null);
    });

    new ResizeObserver(resizeWorld).observe(stage);
    resizeWorld();
    requestAnimationFrame(animate);
})();