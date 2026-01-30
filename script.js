// --- 전역 상태 ---
let appState = {
    title: "시나리오 제목",
    currentTabId: null,
    tabs: [], 
    nextTabId: 0,
    nextObjId: 0,
    nextLineId: 0
};

// 상호작용 관련 변수
let isDrawingLine = false;
let startAnchor = null;
let tempPathElement = null;
let hoveredObjectId = null; // [추가] 현재 마우스가 올라간 객체 ID

const canvas = document.getElementById('canvas');
const svgLayer = document.getElementById('svg-layer');
const tabContainer = document.getElementById('tab-container');
const titleInput = document.getElementById('scenario-title');
const viewport = document.getElementById('viewport');

window.onload = function() {
    addTab();
    titleInput.addEventListener('input', (e) => { appState.title = e.target.value; });

    // 1. 화살표 키: 캔버스 확장
    // 2. Delete 키: 호버된 객체 삭제
    window.addEventListener('keydown', (e) => {
        // [추가] Delete 키 삭제 로직
        if (e.key === 'Delete' && hoveredObjectId) {
            // 텍스트 편집 중이거나 인풋 입력 중일 때는 삭제 방지
            if (document.activeElement.isContentEditable || document.activeElement.tagName === 'INPUT') {
                return;
            }
            
            deleteObject(hoveredObjectId);
        }

        const step = 50;
        const currentW = parseInt(canvas.style.width);
        const currentH = parseInt(canvas.style.height);
        if (e.key === 'ArrowRight') {
            canvas.style.width = (currentW + step) + 'px';
            viewport.scrollLeft += step;
            saveCurrentTabState();
        } else if (e.key === 'ArrowDown') {
            canvas.style.height = (currentH + step) + 'px';
            viewport.scrollTop += step;
            saveCurrentTabState();
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isDrawingLine && tempPathElement && startAnchor) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left + viewport.scrollLeft;
            const mouseY = e.clientY - rect.top + viewport.scrollTop;
            const startPos = getAnchorPosition(startAnchor.objId, startAnchor.dir);
            tempPathElement.setAttribute('d', `M ${startPos.x} ${startPos.y} L ${mouseX} ${mouseY}`);
        }
    });

    document.addEventListener('mouseup', () => { if (isDrawingLine) cancelLineDrawing(); });
};

// --- [추가] 객체 삭제 함수 ---
function deleteObject(objId) {
    if(!confirm('이 객체를 삭제하시겠습니까?')) return;

    // DOM 제거
    const el = document.querySelector(`.obj[data-id="${objId}"]`);
    if (el) el.remove();

    // 데이터 및 선 정리
    const curTab = appState.tabs.find(t => t.id === appState.currentTabId);
    
    // 선 제거
    if(curTab.lines) {
        curTab.lines = curTab.lines.filter(l => l.start !== objId && l.end !== objId);
        svgLayer.innerHTML = ''; 
        curTab.lines.forEach(l => createLineElement(l));
    }
    
    hoveredObjectId = null; // 삭제했으므로 초기화
}


// --- 탭 관리 ---
function addTab(name = null) {
    const id = appState.nextTabId++;
    const tabName = name || `소제목 ${id + 1}`;
    const newTab = { id: id, name: tabName, objects: [], lines: [], canvasWidth: 2000, canvasHeight: 1000 };
    appState.tabs.push(newTab);
    renderTabs();
    switchTab(id);
}

function renderTabs() {
    document.querySelectorAll('.tab').forEach(t => t.remove());
    const addBtn = document.querySelector('.add-tab-btn');
    appState.tabs.forEach((tab) => {
        const tabEl = document.createElement('div');
        tabEl.className = `tab ${appState.currentTabId === tab.id ? 'active' : ''}`;
        tabEl.onclick = () => switchTab(tab.id);
        const input = document.createElement('input');
        input.value = tab.name;
        input.onchange = (e) => { tab.name = e.target.value; };
        input.onclick = (e) => e.stopPropagation();
        tabEl.appendChild(input);
        tabContainer.insertBefore(tabEl, addBtn);
    });
}

function switchTab(id) {
    if (appState.currentTabId !== null) saveCurrentTabState();
    appState.currentTabId = id;
    const targetTab = appState.tabs.find(t => t.id === id);
    
    canvas.style.width = targetTab.canvasWidth + 'px';
    canvas.style.height = targetTab.canvasHeight + 'px';

    document.querySelectorAll('.obj').forEach(el => el.remove());
    svgLayer.innerHTML = ''; 

    targetTab.objects.forEach(objData => createObjectElement(objData.type, objData.x, objData.y, objData));
    if(targetTab.lines) targetTab.lines.forEach(lineData => createLineElement(lineData));
    
    renderTabs();
}

function saveCurrentTabState() {
    const currentTab = appState.tabs.find(t => t.id === appState.currentTabId);
    if (!currentTab) return;
    currentTab.canvasWidth = parseInt(canvas.style.width);
    currentTab.canvasHeight = parseInt(canvas.style.height);

    const currentObjects = [];
    document.querySelectorAll('.obj').forEach(el => {
        const data = {
            id: el.dataset.id,
            type: el.dataset.type,
            x: el.style.left, y: el.style.top,
            width: el.style.width, height: el.style.height,
            content: el.querySelector('.obj-content')?.innerText || '',
            bgColor: el.querySelector('.color-picker')?.value || '#ffffff',
            plotToggle: el.querySelector('.toggle-btn')?.classList.contains('active') || false,
            annotation: el.querySelector('.annotation')?.innerText || '',
            imgSrc: el.querySelector('img')?.src || ''
        };
        currentObjects.push(data);
    });
    currentTab.objects = currentObjects;
}

// --- 객체 생성 ---
function createObjectElement(type, x, y, data = null) {
    const id = data ? data.id : `obj-${appState.nextObjId++}`;
    const el = document.createElement('div');
    el.className = `obj obj-${type}`;
    el.style.left = x; el.style.top = y;
    if (data && data.width) el.style.width = data.width;
    if (data && data.height) el.style.height = data.height;
    el.dataset.type = type; el.dataset.id = id;

    // [추가] 마우스 호버 상태 추적
    el.onmouseenter = () => { hoveredObjectId = id; };
    el.onmouseleave = () => { if(hoveredObjectId === id) hoveredObjectId = null; };

    makeElementDraggable(el);

    // 리사이즈 핸들
    const resizer = document.createElement('div');
    resizer.className = 'resize-handle';
    makeElementResizable(el, resizer);
    el.appendChild(resizer);

    // (이전 삭제 버튼 생성 코드는 제거됨)

    // 앵커 생성
    ['top', 'bottom', 'left', 'right'].forEach(dir => {
        const anchor = document.createElement('div');
        anchor.className = `anchor ${dir}`;
        anchor.onmousedown = (e) => startLineDrawing(e, id, dir);
        anchor.onmouseup = (e) => finishLineDrawing(e, id, dir);
        el.appendChild(anchor);
    });

    // 내용물
    const content = document.createElement('div');
    content.className = 'obj-content';
    content.contentEditable = true;
    
    if (type === 'title') {
        content.innerText = data ? data.content : '제목';
        const cp = document.createElement('input'); cp.type = 'color'; cp.className = 'color-picker';
        cp.value = data ? data.bgColor : '#ffffff';
        cp.oninput = (e) => el.style.backgroundColor = e.target.value;
        el.style.backgroundColor = cp.value; 
        el.appendChild(content); 
        el.appendChild(cp);      
    } else if (type === 'plot') {
        content.innerText = data ? data.content : '플롯';
        const header = document.createElement('div'); header.className = 'plot-header';
        const btn = document.createElement('div'); btn.className = `toggle-btn ${data && data.plotToggle ? 'active' : ''}`;
        btn.onclick = () => btn.classList.toggle('active');
        content.style.width = '80%'; header.appendChild(content); header.appendChild(btn);
        el.appendChild(header);
        const anno = document.createElement('div'); anno.className = 'annotation';
        anno.contentEditable = true; anno.innerText = data ? data.annotation : '주석..';
        el.appendChild(anno);
    } else if (type === 'char') {
        content.innerText = data ? data.content : '캐릭터';
        el.appendChild(content);
        const imgArea = document.createElement('div'); imgArea.className = 'char-img-area';
        if (data && data.imgSrc) {
            const img = document.createElement('img'); img.src = data.imgSrc; imgArea.appendChild(img);
        } else {
            const ph = document.createElement('span'); ph.className = 'char-placeholder'; ph.innerText = 'Upload'; imgArea.appendChild(ph);
        }
        const fileInput = document.createElement('input'); fileInput.type = 'file'; fileInput.accept = 'image/*'; fileInput.style.display='none';
        fileInput.onchange = (e) => {
            if(e.target.files[0]){
                const r = new FileReader();
                r.onload = (re) => { imgArea.innerHTML=''; const i=document.createElement('img'); i.src=re.target.result; imgArea.appendChild(i); };
                r.readAsDataURL(e.target.files[0]);
            }
        };
        imgArea.onclick = () => fileInput.click();
        el.appendChild(imgArea); el.appendChild(fileInput);
    } else {
        content.innerText = data ? data.content : '설명';
        el.appendChild(content);
    }

    canvas.appendChild(el);
}

// --- 선 기능 ---
function startLineDrawing(e, objId, dir) {
    e.stopPropagation(); isDrawingLine = true; startAnchor = { objId, dir };
    const p = getAnchorPosition(objId, dir);
    tempPathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
    tempPathElement.setAttribute("d", `M ${p.x} ${p.y} L ${p.x} ${p.y}`);
    tempPathElement.setAttribute("fill", "none");
    tempPathElement.setAttribute("stroke", "orange"); 
    tempPathElement.setAttribute("stroke-width", "3");
    tempPathElement.setAttribute("stroke-dasharray", "5,5");
    svgLayer.appendChild(tempPathElement);
}

function finishLineDrawing(e, targetObjId, targetDir) {
    if (!isDrawingLine) return;
    e.stopPropagation();
    if (startAnchor.objId === targetObjId) { cancelLineDrawing(); return; } 

    const newLine = {
        id: `line-${appState.nextLineId++}`,
        start: startAnchor.objId, startDir: startAnchor.dir,
        end: targetObjId, endDir: targetDir, dashed: false
    };
    const currentTab = appState.tabs.find(t => t.id === appState.currentTabId);
    if(!currentTab.lines) currentTab.lines = [];
    currentTab.lines.push(newLine);
    createLineElement(newLine);
    cancelLineDrawing();
}

function cancelLineDrawing() {
    isDrawingLine = false; startAnchor = null;
    if (tempPathElement) { tempPathElement.remove(); tempPathElement = null; }
}

function getElbowPath(start, end, startDir, endDir) {
    let path = `M ${start.x} ${start.y}`;
    const pad = 20; 
    let p1 = { ...start };
    if (startDir === 'top') p1.y -= pad;
    if (startDir === 'bottom') p1.y += pad;
    if (startDir === 'left') p1.x -= pad;
    if (startDir === 'right') p1.x += pad;
    path += ` L ${p1.x} ${p1.y}`;
    const midX = (p1.x + end.x) / 2;
    const midY = (p1.y + end.y) / 2;
    if (startDir === 'left' || startDir === 'right') {
        path += ` L ${midX} ${p1.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
    } else {
        path += ` L ${p1.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`;
    }
    return path;
}

function createLineElement(lineData) {
    const p1 = getAnchorPosition(lineData.start, lineData.startDir);
    const p2 = getAnchorPosition(lineData.end, lineData.endDir);
    if (!p1 || !p2) return; 

    const pathD = getElbowPath(p1, p2, lineData.startDir, lineData.endDir);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("id", lineData.id);
    path.setAttribute("d", pathD);
    path.setAttribute("class", "connection-line" + (lineData.dashed ? " dashed" : ""));
    
    path.onclick = () => {
        lineData.dashed = !lineData.dashed;
        lineData.dashed ? path.classList.add('dashed') : path.classList.remove('dashed');
    };
    path.oncontextmenu = (e) => {
        e.preventDefault();
        if(confirm('선을 삭제하시겠습니까?')) {
            path.remove();
            const cur = appState.tabs.find(t=>t.id===appState.currentTabId);
            cur.lines = cur.lines.filter(l=>l.id!==lineData.id);
        }
    };
    svgLayer.appendChild(path);
}

function getAnchorPosition(objId, dir) {
    const el = document.querySelector(`.obj[data-id="${objId}"]`);
    if (!el) return null;
    const w = el.offsetWidth, h = el.offsetHeight, l = el.offsetLeft, t = el.offsetTop;
    if (dir==='top') return {x: l+w/2, y: t};
    if (dir==='bottom') return {x: l+w/2, y: t+h};
    if (dir==='left') return {x: l, y: t+h/2};
    if (dir==='right') return {x: l+w, y: t+h/2};
    return {x:0, y:0};
}

function updateAllLines() {
    const cur = appState.tabs.find(t=>t.id===appState.currentTabId);
    if(!cur || !cur.lines) return;
    cur.lines.forEach(l => {
        const el = document.getElementById(l.id);
        const p1 = getAnchorPosition(l.start, l.startDir);
        const p2 = getAnchorPosition(l.end, l.endDir);
        if(el && p1 && p2) {
            el.setAttribute("d", getElbowPath(p1, p2, l.startDir, l.endDir));
        }
    });
}

function makeElementResizable(el, resizer) {
    let startX, startY, startWidth, startHeight;
    resizer.addEventListener('mousedown', initResize, false);
    function initResize(e) {
        e.stopPropagation(); 
        startX = e.clientX; startY = e.clientY;
        startWidth = parseInt(document.defaultView.getComputedStyle(el).width, 10);
        startHeight = parseInt(document.defaultView.getComputedStyle(el).height, 10);
        document.documentElement.addEventListener('mousemove', doResize, false);
        document.documentElement.addEventListener('mouseup', stopResize, false);
    }
    function doResize(e) {
        el.style.width = (startWidth + e.clientX - startX) + 'px';
        el.style.height = (startHeight + e.clientY - startY) + 'px';
        updateAllLines();
    }
    function stopResize(e) {
        document.documentElement.removeEventListener('mousemove', doResize, false);
        document.documentElement.removeEventListener('mouseup', stopResize, false);
        updateAllLines();
    }
}

function makeElementDraggable(elmnt) {
    let pos1=0, pos2=0, pos3=0, pos4=0;
    elmnt.onmousedown = dragMouseDown;
    function dragMouseDown(e) {
        if(e.target.isContentEditable || e.target.tagName==='INPUT') return;
        if(e.target.classList.contains('anchor')) return; 
        if(e.target.classList.contains('resize-handle')) return; 

        e.preventDefault();
        pos3 = e.clientX; pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }
    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY;
        pos3 = e.clientX; pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        updateAllLines();
    }
    function closeDragElement() {
        document.onmouseup = null; document.onmousemove = null;
        updateAllLines();
    }
}

function saveData() {
    saveCurrentTabState();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(appState)], {type:"application/json"}));
    a.download = `${appState.title}.json`;
    a.click();
}
function triggerLoad() { document.getElementById('file-input').click(); }
function loadData(input) {
    const f = input.files[0]; if(!f) return;
    const r = new FileReader();
    r.onload = (e) => {
        try { appState = JSON.parse(e.target.result); titleInput.value=appState.title; renderTabs(); if(appState.tabs.length) switchTab(appState.tabs[0].id); }
        catch(err) { alert('오류: ' + err); }
    };
    r.readAsText(f);
}
