// --- 전역 변수 및 상태 관리 ---
let appState = {
    title: "시나리오 제목",
    currentTabId: null,
    tabs: [], 
    nextTabId: 0,
    nextObjId: 0,
    nextLineId: 0
};

// 선 연결 관련 임시 변수
let isDrawingLine = false;
let startAnchor = null; // { objId, type }
let tempLineElement = null;

const canvas = document.getElementById('canvas');
const svgLayer = document.getElementById('svg-layer');
const tabContainer = document.getElementById('tab-container');
const titleInput = document.getElementById('scenario-title');
const viewport = document.getElementById('viewport');

// 초기화
window.onload = function() {
    addTab();
    
    titleInput.addEventListener('input', (e) => {
        appState.title = e.target.value;
    });

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

    // 드래그 중인 선 업데이트 (마우스 이동)
    document.addEventListener('mousemove', (e) => {
        if (isDrawingLine && tempLineElement) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left + viewport.scrollLeft;
            const y = e.clientY - rect.top + viewport.scrollTop;
            
            tempLineElement.setAttribute('x2', x);
            tempLineElement.setAttribute('y2', y);
        }
    });

    // 선 그리기 취소 (빈 곳에서 마우스 뗌)
    document.addEventListener('mouseup', () => {
        if (isDrawingLine) {
            cancelLineDrawing();
        }
    });
};

// --- 탭 관리 ---
function addTab(name = null) {
    const id = appState.nextTabId++;
    const tabName = name || `소제목 ${id + 1}`;
    
    const newTab = {
        id: id,
        name: tabName,
        objects: [],
        lines: [], // [추가] 선 정보 저장 배열
        canvasWidth: 2000,
        canvasHeight: 1000
    };
    appState.tabs.push(newTab);
    renderTabs();
    switchTab(id);
}

function renderTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(t => t.remove());

    const addBtn = document.querySelector('.add-tab-btn');

    appState.tabs.forEach((tab, index) => {
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
    if (appState.currentTabId !== null) {
        saveCurrentTabState();
    }

    appState.currentTabId = id;
    const targetTab = appState.tabs.find(t => t.id === id);
    
    canvas.style.width = targetTab.canvasWidth + 'px';
    canvas.style.height = targetTab.canvasHeight + 'px';

    // 기존 객체 및 선 제거
    document.querySelectorAll('.obj').forEach(el => el.remove());
    svgLayer.innerHTML = ''; // 선 모두 제거
    
    // 객체 복원
    targetTab.objects.forEach(objData => {
        createObjectElement(objData.type, objData.x, objData.y, objData);
    });

    // 선 복원
    if(targetTab.lines) {
        targetTab.lines.forEach(lineData => {
            createLineElement(lineData);
        });
    }

    renderTabs();
}

function saveCurrentTabState() {
    const currentTab = appState.tabs.find(t => t.id === appState.currentTabId);
    if (!currentTab) return;

    currentTab.canvasWidth = parseInt(canvas.style.width);
    currentTab.canvasHeight = parseInt(canvas.style.height);

    // 객체 저장
    const currentObjects = [];
    document.querySelectorAll('.obj').forEach(el => {
        const data = {
            id: el.dataset.id,
            type: el.dataset.type,
            x: el.style.left,
            y: el.style.top,
            width: el.style.width,
            height: el.style.height,
            content: el.querySelector('.obj-content')?.innerText || '',
            bgColor: el.querySelector('.color-picker')?.value || '#ffffff',
            plotToggle: el.querySelector('.toggle-btn')?.classList.contains('active') || false,
            annotation: el.querySelector('.annotation')?.innerText || '',
            imgSrc: el.querySelector('img')?.src || ''
        };
        currentObjects.push(data);
    });
    currentTab.objects = currentObjects;

    // 선 정보는 이미 appState.tabs 안의 lines 배열에 실시간 업데이트 되지 않으므로
    // 화면에 있는 선들을 기준으로 다시 저장해야 함 (삭제 등을 반영하기 위해)
    // 하지만 여기서는 createLineElement 할 때 이미 lines 배열에 넣는 방식이 아니라,
    // lines 배열을 기준으로 draw 하므로, lines 배열 자체를 관리해야 함.
    // 편의상 lines 배열은 추가/삭제 시 직접 조작하고 있으므로 여기서는 패스.
}

// --- 드래그 앤 드롭 ---
function dragStart(e, type) {
    e.dataTransfer.setData("type", type);
}
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

// --- 객체 생성 ---
function createObjectElement(type, x, y, data = null) {
    const id = data ? data.id : `obj-${appState.nextObjId++}`;
    const el = document.createElement('div');
    el.className = `obj obj-${type}`;
    el.style.left = x;
    el.style.top = y;
    if (data && data.width) el.style.width = data.width;
    if (data && data.height) el.style.height = data.height;
    
    el.dataset.type = type;
    el.dataset.id = id;

    // 드래그 기능
    makeElementDraggable(el);

    // [추가] 4방향 연결점(Anchor) 생성
    ['top', 'bottom', 'left', 'right'].forEach(dir => {
        const anchor = document.createElement('div');
        anchor.className = `anchor ${dir}`;
        anchor.dataset.dir = dir;
        anchor.dataset.parentId = id;
        
        // 연결점 드래그 시작 이벤트
        anchor.onmousedown = (e) => startLineDrawing(e, id, dir);
        // 연결점 드래그 종료(연결) 이벤트
        anchor.onmouseup = (e) => finishLineDrawing(e, id, dir);
        
        el.appendChild(anchor);
    });

    // 내용 생성 (기존과 동일)
    const content = document.createElement('div');
    content.className = 'obj-content';
    content.contentEditable = true;
    content.innerText = data ? data.content : (type === 'title' ? '제목' : type === 'plot' ? '플롯' : type === 'char' ? '캐릭터' : '설명');
    el.appendChild(content);

    // 타입별 기능 (기존 코드 유지)
    if (type === 'title') {
        const colorPicker = document.createElement('input');
        colorPicker.type = 'color';
        colorPicker.className = 'color-picker';
        colorPicker.value = data ? data.bgColor : '#ffffff';
        colorPicker.oninput = (e) => { el.style.backgroundColor = e.target.value; };
        el.style.backgroundColor = colorPicker.value;
        el.appendChild(colorPicker);
    } else if (type === 'plot') {
        const header = document.createElement('div');
        header.className = 'plot-header';
        const btn = document.createElement('div');
        btn.className = `toggle-btn ${data && data.plotToggle ? 'active' : ''}`;
        btn.onclick = () => btn.classList.toggle('active');
        content.style.width = '80%';
        header.appendChild(content); header.appendChild(btn);
        el.innerHTML = ''; el.appendChild(header);
        const annotation = document.createElement('div');
        annotation.className = 'annotation';
        annotation.contentEditable = true;
        annotation.innerText = data ? data.annotation : '주석 입력...';
        el.appendChild(annotation);
    } else if (type === 'char') {
        const imgArea = document.createElement('div');
        imgArea.className = 'char-img-area';
        if (data && data.imgSrc) {
            const img = document.createElement('img');
            img.src = data.imgSrc;
            imgArea.appendChild(img);
        } else {
            const ph = document.createElement('span');
            ph.className = 'char-placeholder';
            ph.innerText = 'Click to Upload';
            imgArea.appendChild(ph);
        }
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/png, image/jpeg';
        fileInput.style.display = 'none';
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (readerEvent) => {
                    imgArea.innerHTML = '';
                    const newImg = document.createElement('img');
                    newImg.src = readerEvent.target.result;
                    imgArea.appendChild(newImg);
                };
                reader.readAsDataURL(file);
            }
        };
        imgArea.onclick = () => fileInput.click();
        el.appendChild(imgArea); el.appendChild(fileInput);
    } else {
        // desc 등 추가 타입
    }

    // 4방향 앵커를 다시 append (innerHTML 초기화 시 날아가는 것 방지 위해 마지막에 재확인)
    if(type === 'plot') {
        ['top', 'bottom', 'left', 'right'].forEach(dir => {
            const anchor = document.createElement('div');
            anchor.className = `anchor ${dir}`;
            anchor.dataset.dir = dir;
            anchor.dataset.parentId = id;
            anchor.onmousedown = (e) => startLineDrawing(e, id, dir);
            anchor.onmouseup = (e) => finishLineDrawing(e, id, dir);
            el.appendChild(anchor);
        });
    }

    canvas.appendChild(el);
}

// --- 선 연결 기능 ---

// 1. 선 그리기 시작
function startLineDrawing(e, objId, dir) {
    e.stopPropagation(); // 객체 드래그 방지
    isDrawingLine = true;
    startAnchor = { objId, dir };

    // 시작점 좌표 계산
    const p = getAnchorPosition(objId, dir);
    
    // 임시 선 생성 (SVG Line)
    tempLineElement = document.createElementNS("http://www.w3.org/2000/svg", "line");
    tempLineElement.setAttribute("x1", p.x);
    tempLineElement.setAttribute("y1", p.y);
    tempLineElement.setAttribute("x2", p.x); // 처음엔 점
    tempLineElement.setAttribute("y2", p.y);
    tempLineElement.setAttribute("stroke", "orange");
    tempLineElement.setAttribute("stroke-width", "3");
    tempLineElement.setAttribute("stroke-dasharray", "5,5"); // 드래그 중엔 점선 느낌
    svgLayer.appendChild(tempLineElement);
}

// 2. 선 그리기 완료 (다른 앵커 위에서 마우스 뗌)
function finishLineDrawing(e, targetObjId, targetDir) {
    if (!isDrawingLine) return;
    e.stopPropagation();

    // 자기 자신에게 연결 방지 (선택 사항)
    if (startAnchor.objId === targetObjId) {
        cancelLineDrawing();
        return;
    }

    // 데이터 생성
    const newLineData = {
        id: `line-${appState.nextLineId++}`,
        start: startAnchor.objId,
        startDir: startAnchor.dir,
        end: targetObjId,
        endDir: targetDir,
        dashed: false
    };

    // 현재 탭의 선 목록에 추가
    const currentTab = appState.tabs.find(t => t.id === appState.currentTabId);
    if (!currentTab.lines) currentTab.lines = [];
    currentTab.lines.push(newLineData);

    // 실제 선 그리기
    createLineElement(newLineData);
    
    cancelLineDrawing(); // 임시 선 제거
}

// 3. 선 그리기 취소
function cancelLineDrawing() {
    isDrawingLine = false;
    startAnchor = null;
    if (tempLineElement) {
        tempLineElement.remove();
        tempLineElement = null;
    }
}

// 4. 선 요소(SVG) 생성 및 기능 부착
function createLineElement(lineData) {
    const p1 = getAnchorPosition(lineData.start, lineData.startDir);
    const p2 = getAnchorPosition(lineData.end, lineData.endDir);
    if (!p1 || !p2) return; // 객체가 없으면 패스

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("id", lineData.id);
    line.setAttribute("x1", p1.x);
    line.setAttribute("y1", p1.y);
    line.setAttribute("x2", p2.x);
    line.setAttribute("y2", p2.y);
    line.setAttribute("class", "connection-line" + (lineData.dashed ? " dashed" : ""));
    
    // 클릭 시 점선/실선 토글
    line.onclick = () => {
        lineData.dashed = !lineData.dashed;
        if (lineData.dashed) line.classList.add('dashed');
        else line.classList.remove('dashed');
    };

    // 우클릭 시 삭제 (옵션)
    line.oncontextmenu = (e) => {
        e.preventDefault();
        if(confirm('선을 삭제하시겠습니까?')) {
            line.remove();
            const currentTab = appState.tabs.find(t => t.id === appState.currentTabId);
            currentTab.lines = currentTab.lines.filter(l => l.id !== lineData.id);
        }
    };

    svgLayer.appendChild(line);
}

// 5. 앵커의 절대 좌표 계산 함수
function getAnchorPosition(objId, dir) {
    const el = document.querySelector(`.obj[data-id="${objId}"]`);
    if (!el) return null;

    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const left = el.offsetLeft;
    const top = el.offsetTop;

    let x = 0, y = 0;
    if (dir === 'top') { x = left + w / 2; y = top; }
    else if (dir === 'bottom') { x = left + w / 2; y = top + h; }
    else if (dir === 'left') { x = left; y = top + h / 2; }
    else if (dir === 'right') { x = left + w; y = top + h / 2; }
    
    return { x, y };
}

// 6. 모든 선 업데이트 (객체 이동/리사이즈 시 호출)
function updateAllLines() {
    const currentTab = appState.tabs.find(t => t.id === appState.currentTabId);
    if (!currentTab || !currentTab.lines) return;

    currentTab.lines.forEach(lineData => {
        const lineEl = document.getElementById(lineData.id);
        if (lineEl) {
            const p1 = getAnchorPosition(lineData.start, lineData.startDir);
            const p2 = getAnchorPosition(lineData.end, lineData.endDir);
            if (p1 && p2) {
                lineEl.setAttribute("x1", p1.x);
                lineEl.setAttribute("y1", p1.y);
                lineEl.setAttribute("x2", p2.x);
                lineEl.setAttribute("y2", p2.y);
            }
        }
    });
}


// --- 객체 이동 로직 ---
function makeElementDraggable(elmnt) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    elmnt.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        if(e.target.isContentEditable || e.target.tagName === 'INPUT') return;
        if (e.target.classList.contains('anchor')) return; // 앵커 클릭은 드래그 X

        const rect = elmnt.getBoundingClientRect();
        if (e.clientX > rect.right - 20 && e.clientY > rect.bottom - 20) {
            // 리사이즈 중에도 선 업데이트 필요
            document.onmouseup = closeDragElement;
            document.onmousemove = elementResize; // 리사이즈용 핸들러 연결
            return;
        }

        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        
        updateAllLines(); // [추가] 이동 시 선 따라오기
    }
    
    function elementResize(e) {
        // 브라우저 기본 리사이즈 이벤트는 JS로 제어하기 어려우므로, 
        // 단순히 마우스 움직일 때마다 선 업데이트를 호출
        updateAllLines();
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        updateAllLines(); // 최종 위치에서 한번 더 업데이트
    }
}


// --- 저장 및 불러오기 ---
function saveData() {
    saveCurrentTabState();
    const dataStr = JSON.stringify(appState);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${appState.title}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function triggerLoad() {
    document.getElementById('file-input').click();
}

function loadData(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const loadedState = JSON.parse(e.target.result);
            appState = loadedState;
            
            titleInput.value = appState.title;
            appState.currentTabId = null;
            renderTabs();
            if(appState.tabs.length > 0) {
                switchTab(appState.tabs[0].id);
            }
            alert("불러오기 완료!");
        } catch (err) {
            alert("파일 형식이 올바르지 않습니다.");
            console.error(err);
        }
    };
    reader.readAsText(file);
}
