// --- 전역 상태 ---
let appState = {
    title: "시나리오 제목",
    currentTabId: null,
    tabs: [], 
    nextTabId: 0,
    nextObjId: 0,
    nextLineId: 0
};

// 선 그리기 관련 변수
let isDrawingLine = false;
let startAnchor = null;
let tempPathElement = null; // Line 대신 Path 사용

// DOM 요소
const canvas = document.getElementById('canvas');
const svgLayer = document.getElementById('svg-layer');
const tabContainer = document.getElementById('tab-container');
const titleInput = document.getElementById('scenario-title');
const viewport = document.getElementById('viewport');

// --- 초기화 ---
window.onload = function() {
    addTab();
    
    titleInput.addEventListener('input', (e) => { appState.title = e.target.value; });

    // 캔버스 확장 (방향키)
    window.addEventListener('keydown', (e) => {
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

    // 드래그 중인 임시 선 업데이트
    document.addEventListener('mousemove', (e) => {
        if (isDrawingLine && tempPathElement && startAnchor) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left + viewport.scrollLeft;
            const mouseY = e.clientY - rect.top + viewport.scrollTop;
            
            const startPos = getAnchorPosition(startAnchor.objId, startAnchor.dir);
            // 임시 선은 단순 직선으로 표시 (성능상 이점)
            const d = `M ${startPos.x} ${startPos.y} L ${mouseX} ${mouseY}`;
            tempPathElement.setAttribute('d', d);
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDrawingLine) cancelLineDrawing();
    });
};

// --- 탭(소제목) 관리 ---
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

    // 드래그 기능 연결
    makeElementDraggable(el);

    // [변경 1] 커스텀 리사이즈 핸들 추가
    const resizer = document.createElement('div');
    resizer.className = 'resize-handle';
    makeElementResizable(el, resizer); // 리사이즈 기능 연결
    el.appendChild(resizer);

    // 4방향 앵커 생성
    ['top', 'bottom', 'left', 'right'].forEach(dir => {
        const anchor = document.createElement('div');
        anchor.className = `anchor ${dir}`;
        anchor.onmousedown = (e) => startLineDrawing(e, id, dir);
        anchor.onmouseup = (e) => finishLineDrawing(e, id, dir);
        el.appendChild(anchor);
    });

    // 내부 콘텐츠
    const content = document.createElement('div');
    content.className = 'obj-content';
    content.contentEditable = true;
    
    // [변경 3] 제목 객체 정렬 처리
    if (type === 'title') {
        content.innerText = data ? data.content : '제목';
        // 색상 선택기
        const cp = document.createElement('input'); cp.type = 'color'; cp.className = 'color-picker';
        cp.value = data ? data.bgColor : '#ffffff';
        cp.oninput = (e) => el.style.backgroundColor = e.target.value;
        el.style.backgroundColor = cp.value; 
        el.appendChild(content); // 제목은 중앙 정렬 위해 content 먼저
        el.appendChild(cp);      // 그 다음 컬러픽커
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
        // desc
        content.innerText = data ? data.content : '설명';
        el.appendChild(content);
    }

    canvas.appendChild(el);
}

// --- 드래그 앤 드롭 (생성) ---
function dragStart(e, type) { e.dataTransfer.setData("type", type); }
function allowDrop(e) { e.preventDefault(); }
function drop(e) {
    e.preventDefault();
    const type = e.dataTransfer.getData("type");
    if (!type) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + viewport.scrollLeft;
    const y = e.clientY - rect.top + viewport.scrollTop;
    createObjectElement(type, x + 'px', y + 'px');
}

// --- 선 그리기 (직각 배선 Path 적용) ---
function startLineDrawing(e, objId, dir) {
    e.stopPropagation(); isDrawingLine = true; startAnchor = { objId, dir };
    const p = getAnchorPosition(objId, dir);
    
    // SVG Path 생성
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

// [변경 2] 직각(Elbow) 경로 계산 함수
function getElbowPath(start, end, startDir, endDir) {
    // 단순한 직각 라우팅 (중간점 계산)
    // 실제 객체 회피 알고리즘은 복잡하므로, "꺾이는" 형태로 구현하여 
    // 대각선으로 객체를 가로지르는 것을 방지함.
    
    let path = `M ${start.x} ${start.y}`;
    
    // 시작점에서 약간 뻗어나감
    const pad = 20; 
    let p1 = { ...start };
    if (startDir === 'top') p1.y -= pad;
    if (startDir === 'bottom') p1.y += pad;
    if (startDir === 'left') p1.x -= pad;
    if (startDir === 'right') p1.x += pad;

    path += ` L ${p1.x} ${p1.y}`;

    // 중간 지점 (x축 먼저 이동할지 y축 먼저 이동할지 결정)
    const midX = (p1.x + end.x) / 2;
    const midY = (p1.y + end.y) / 2;

    // 수평/수직 우선순위 간단 로직
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
    
    // 클릭 시 점선 토글
    path.onclick = () => {
        lineData.dashed = !lineData.dashed;
        lineData.dashed ? path.classList.add('dashed') : path.classList.remove('dashed');
    };
    
    // [변경 2] 우클릭 시 삭제
    path.oncontextmenu = (e) => {
        e.preventDefault(); // 기본 메뉴 방지
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
            // 위치 업데이트 시에도 직각 경로 다시 계산
            el.setAttribute("d", getElbowPath(p1, p2, l.startDir, l.endDir));
        }
    });
}

// --- [변경 1] 커스텀 리사이즈 로직 ---
function makeElementResizable(el, resizer) {
    let startX, startY, startWidth, startHeight;

    resizer.addEventListener('mousedown', initResize, false);

    function initResize(e) {
        e.stopPropagation(); // 객체 드래그 방지
        startX = e.clientX;
        startY = e.clientY;
        startWidth = parseInt(document.defaultView.getComputedStyle(el).width, 10);
        startHeight = parseInt(document.defaultView.getComputedStyle(el).height, 10);
        
        document.documentElement.addEventListener('mousemove', doResize, false);
        document.documentElement.addEventListener('mouseup', stopResize, false);
    }

    function doResize(e) {
        el.style.width = (startWidth + e.clientX - startX) + 'px';
        el.style.height = (startHeight + e.clientY - startY) + 'px';
        updateAllLines(); // 리사이즈 중 선 업데이트
    }

    function stopResize(e) {
        document.documentElement.removeEventListener('mousemove', doResize, false);
        document.documentElement.removeEventListener('mouseup', stopResize, false);
        updateAllLines();
    }
}

// --- 객체 이동 로직 ---
function makeElementDraggable(elmnt) {
    let pos1=0, pos2=0, pos3=0, pos4=0;
    elmnt.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        // 편집, 인풋, 앵커, 리사이저 클릭 시 드래그 방지
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

// --- 저장/로드 ---
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
