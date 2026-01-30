// 유틸리티: UUID 생성
function uuid() {
    return 'xxxx-xxxx-xxxx-xxxx'.replace(/[x]/g, () => (Math.random()*16|0).toString(16));
}

// DOM 요소 참조
const workspace = document.getElementById('workspace');
const timelineContainer = document.getElementById('timeline-container');
const svgLayer = document.getElementById('svg-layer');
const titleInput = document.getElementById('scenario-title');

let lines = []; 
let activeAnchor = null;
let draggedType = null;

// 초기 설정
titleInput.addEventListener('input', (e) => document.title = e.target.value || "Scenario Planner");

document.getElementById('extend-btn').addEventListener('click', () => {
    timelineContainer.style.width = (timelineContainer.offsetWidth + 1000) + 'px';
    updateAllLines();
});

// 드래그 앤 드롭 이벤트 설정
document.querySelectorAll('.draggable-item').forEach(item => {
    item.addEventListener('dragstart', (e) => draggedType = e.target.getAttribute('data-type'));
});

workspace.addEventListener('dragover', (e) => e.preventDefault());
workspace.addEventListener('drop', (e) => {
    e.preventDefault();
    if (!draggedType) return;
    const rect = timelineContainer.getBoundingClientRect();
    const x = e.clientX - rect.left + workspace.scrollLeft; 
    const y = e.clientY - rect.top + workspace.scrollTop; 
    createObject({ type: draggedType, x, y });
    draggedType = null;
});

// 객체 생성 함수
function createObject(params) {
    const id = params.id || uuid();
    const el = document.createElement('div');
    el.id = id;
    el.classList.add('placed-object');
    el.dataset.type = params.type;
    el.style.left = params.x + 'px';
    el.style.top = params.y + 'px';
    
    // 타입별 설정
    let defaultText = "Text";
    let defaultColor = "#333333";

    if (params.type === 'title') {
        el.classList.add('obj-title');
        defaultText = "Title";
        defaultColor = "#333333";
    } else if (params.type === 'incident') {
        el.classList.add('obj-incident');
        defaultText = "사건/사고";
        defaultColor = "#333333"; // 테두리색
    } else if (params.type === 'char') {
        el.classList.add('obj-char');
        defaultText = "캐릭터";
        defaultColor = "#e8f0fe"; // 배경색
    } else if (params.type === 'memo') {
        el.classList.add('obj-memo');
        defaultText = "메모...";
        defaultColor = "#fff9c4";
        if(params.width) el.style.width = params.width;
        if(params.height) el.style.height = params.height;
    }

    // 내부 HTML 구조
    const header = document.createElement('div');
    header.classList.add('obj-header');

    const span = document.createElement('span');
    span.classList.add('editable-text');
    span.innerText = params.text || defaultText;
    span.contentEditable = true;
    header.appendChild(span);

    // 컨트롤 박스
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '5px';
    controls.style.alignItems = 'center';

    // 떡밥 마커 (사건용)
    if (params.type === 'incident') {
        const baitBtn = document.createElement('div');
        baitBtn.classList.add('bait-marker');
        baitBtn.innerText = "?";
        if (params.isBait) { baitBtn.classList.add('active'); baitBtn.innerText = "!"; }
        baitBtn.onclick = (e) => {
            e.stopPropagation();
            baitBtn.classList.toggle('active');
            baitBtn.innerText = baitBtn.classList.contains('active') ? "!" : "?";
        };
        controls.appendChild(baitBtn);
    }

    // 컬러 피커
    const colorInput = document.createElement('input');
    colorInput.type = "color";
    colorInput.classList.add('color-picker');
    colorInput.value = params.color || defaultColor;
    colorInput.addEventListener('input', (e) => applyColor(el, params.type, e.target.value));
    controls.appendChild(colorInput);

    header.appendChild(controls);
    el.appendChild(header);

    // 초기 색상 적용
    applyColor(el, params.type, colorInput.value);

    // 앵커(연결점) 추가
    ['top', 'bottom', 'left', 'right'].forEach(pos => {
        const anchor = document.createElement('div');
        anchor.classList.add('anchor', pos);
        anchor.dataset.pos = pos;
        anchor.dataset.parentId = id;
        anchor.onclick = (e) => handleAnchorClick(e, anchor);
        el.appendChild(anchor);
    });

    makeElementDraggable(el);
    timelineContainer.appendChild(el);
}

function applyColor(el, type, color) {
    if (type === 'title') el.querySelector('.editable-text').style.color = color;
    else if (type === 'incident') el.style.borderLeftColor = color;
    else el.style.backgroundColor = color;
}

// 연결 로직
function handleAnchorClick(e, anchor) {
    e.stopPropagation();
    if (activeAnchor) {
        if (activeAnchor !== anchor) {
            createLine(activeAnchor, anchor);
            activeAnchor.classList.remove('active');
            activeAnchor = null;
        }
    } else {
        activeAnchor = anchor;
        activeAnchor.classList.add('active');
    }
}

function createLine(startAnchor, endAnchor, existingData = null) {
    const lineId = existingData ? existingData.id : uuid();
    const lineData = existingData || {
        id: lineId,
        from: startAnchor.dataset.parentId,
        fromPos: startAnchor.dataset.pos,
        to: endAnchor.dataset.parentId,
        toPos: endAnchor.dataset.pos,
        style: 'solid',
        text: ''
    };
    
    if (!existingData) lines.push(lineData);

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.id = lineId;
    
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.classList.add('connection-line');
    if (lineData.style === 'dashed') path.style.strokeDasharray = "5,5";

    path.addEventListener('click', (e) => {
        e.stopPropagation();
        const newText = prompt("선 텍스트 입력 (취소 시 점선/실선 변경):", lineData.text);
        if (newText !== null) lineData.text = newText;
        else lineData.style = lineData.style === 'solid' ? 'dashed' : 'solid';
        updateLineVisual(lineId);
    });

    const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textEl.classList.add('line-text');
    textEl.textContent = lineData.text;

    g.appendChild(path);
    g.appendChild(textEl);
    svgLayer.appendChild(g);

    updateSingleLine(lineData);
}

function updateSingleLine(lineData) {
    const elFrom = document.getElementById(lineData.from);
    const elTo = document.getElementById(lineData.to);
    if (!elFrom || !elTo) return;

    const p1 = getAnchorPos(elFrom, lineData.fromPos);
    const p2 = getAnchorPos(elTo, lineData.toPos);
    const g = document.getElementById(lineData.id);
    if (!g) return;

    const path = g.querySelector('path');
    const text = g.querySelector('text');

    const dx = Math.abs(p1.x - p2.x) * 0.5;
    const d = `M ${p1.x} ${p1.y} C ${p1.x + dx} ${p1.y}, ${p2.x - dx} ${p2.y}, ${p2.x} ${p2.y}`;
    
    path.setAttribute("d", d);
    path.style.strokeDasharray = lineData.style === 'dashed' ? "5,5" : "none";

    text.setAttribute("x", (p1.x + p2.x) / 2);
    text.setAttribute("y", (p1.y + p2.y) / 2 - 5);
    text.textContent = lineData.text;
}

function updateAllLines() { lines.forEach(updateSingleLine); }

function getAnchorPos(el, pos) {
    const left = el.offsetLeft;
    const top = el.offsetTop;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (pos === 'top') return { x: left + w/2, y: top };
    if (pos === 'bottom') return { x: left + w/2, y: top + h };
    if (pos === 'left') return { x: left, y: top + h/2 };
    if (pos === 'right') return { x: left + w, y: top + h/2 };
    return { x: left, y: top };
}

function updateLineVisual(lineId) {
    const lineData = lines.find(l => l.id === lineId);
    if (lineData) updateSingleLine(lineData);
}

function makeElementDraggable(elmnt) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    elmnt.onmousedown = (e) => {
        if (e.target.isContentEditable || e.target.tagName === 'INPUT' || e.target.classList.contains('anchor') || e.target.classList.contains('bait-marker')) return;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        elmnt.style.zIndex = 100;
    };

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        updateAllLines();
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        elmnt.style.zIndex = 10;
    }
}

// 저장/불러오기
function saveScenario() {
    const title = titleInput.value || "MyScenario";
    const objects = [];
    document.querySelectorAll('.placed-object').forEach(obj => {
        objects.push({
            id: obj.id,
            type: obj.dataset.type,
            left: parseInt(obj.style.left),
            top: parseInt(obj.style.top),
            text: obj.querySelector('.editable-text').innerText,
            color: obj.querySelector('.color-picker').value,
            isBait: obj.querySelector('.bait-marker')?.classList.contains('active') || false,
            width: obj.style.width,
            height: obj.style.height
        });
    });

    const data = { title, width: timelineContainer.style.width, objects, lines };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title}.json`;
    link.click();
}

function loadScenario(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            titleInput.value = data.title || "";
            timelineContainer.style.width = data.width || "3000px";
            
            document.querySelectorAll('.placed-object').forEach(el => el.remove());
            svgLayer.innerHTML = '';
            lines = [];

            data.objects.forEach(item => createObject({
                id: item.id, type: item.type, x: item.left, y: item.top, 
                text: item.text, color: item.color, isBait: item.isBait, 
                width: item.width, height: item.height
            }));

            if (data.lines) {
                data.lines.forEach(line => {
                   const f = document.getElementById(line.from);
                   const t = document.getElementById(line.to);
                   if(f && t) createLine(f.querySelector(`.anchor.${line.fromPos}`), t.querySelector(`.anchor.${line.toPos}`), line);
                });
            }
        } catch (err) { alert("오류: " + err); }
    };
    reader.readAsText(file);
    input.value = '';
}
