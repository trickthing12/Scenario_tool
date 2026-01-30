// --- 전역 변수 및 상태 관리 ---
let appState = {
    title: "시나리오 제목",
    currentTabId: null,
    tabs: [], // { id, name, objects: [], canvasWidth, canvasHeight }
    nextTabId: 0,
    nextObjId: 0
};

const canvas = document.getElementById('canvas');
const tabContainer = document.getElementById('tab-container');
const titleInput = document.getElementById('scenario-title');
const viewport = document.getElementById('viewport');

// 초기화
window.onload = function() {
    addTab(); // 기본 탭 생성
    
    // 제목 변경 감지
    titleInput.addEventListener('input', (e) => {
        appState.title = e.target.value;
    });

    // 화살표 키로 캔버스 확장 및 스크롤
    window.addEventListener('keydown', (e) => {
        const step = 50;
        const currentW = parseInt(canvas.style.width);
        const currentH = parseInt(canvas.style.height);

        if (e.key === 'ArrowRight') {
            canvas.style.width = (currentW + step) + 'px';
            viewport.scrollLeft += step;
            saveCurrentTabState(); // 크기 변경 저장
        } else if (e.key === 'ArrowDown') {
            canvas.style.height = (currentH + step) + 'px';
            viewport.scrollTop += step;
            saveCurrentTabState();
        }
    });
};

// --- 탭(소제목) 관리 기능 ---
function addTab(name = null) {
    const id = appState.nextTabId++;
    const tabName = name || `소제목 ${id + 1}`;
    
    const newTab = {
        id: id,
        name: tabName,
        objects: [],
        canvasWidth: 2000,
        canvasHeight: 1000
    };
    appState.tabs.push(newTab);
    renderTabs();
    switchTab(id);
}

function renderTabs() {
    // 기존 탭 제거 (버튼 제외)
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
        input.onclick = (e) => e.stopPropagation(); // 탭 전환 방지

        tabEl.appendChild(input);
        tabContainer.insertBefore(tabEl, addBtn);
    });
}

function switchTab(id) {
    // 현재 탭 상태 저장
    if (appState.currentTabId !== null) {
        saveCurrentTabState();
    }

    // 캔버스 초기화
    appState.currentTabId = id;
    const targetTab = appState.tabs.find(t => t.id === id);
    
    // 캔버스 크기 복원
    canvas.style.width = targetTab.canvasWidth + 'px';
    canvas.style.height = targetTab.canvasHeight + 'px';

    // 객체 모두 제거 후 재생성
    document.querySelectorAll('.obj').forEach(el => el.remove());
    
    targetTab.objects.forEach(objData => {
        createObjectElement(objData.type, objData.x, objData.y, objData);
    });

    renderTabs();
}

function saveCurrentTabState() {
    const currentTab = appState.tabs.find(t => t.id === appState.currentTabId);
    if (!currentTab) return;

    currentTab.canvasWidth = parseInt(canvas.style.width);
    currentTab.canvasHeight = parseInt(canvas.style.height);

    // 현재 DOM에 있는 모든 객체 정보를 state에 저장
    const currentObjects = [];
    document.querySelectorAll('.obj').forEach(el => {
        const data = {
            id: el.dataset.id,
            type: el.dataset.type,
            x: el.style.left,
            y: el.style.top,
            content: el.querySelector('.obj-content')?.innerText || '',
            // 타입별 추가 데이터
            bgColor: el.querySelector('.color-picker')?.value || '#ffffff',
            plotToggle: el.querySelector('.toggle-btn')?.classList.contains('active') || false,
            annotation: el.querySelector('.annotation')?.innerText || '',
            imgSrc: el.querySelector('img')?.src || ''
        };
        currentObjects.push(data);
    });
    currentTab.objects = currentObjects;
}

// --- 드래그 앤 드롭 (메뉴 -> 캔버스 생성) ---
function dragStart(e, type) {
    e.dataTransfer.setData("type", type);
}

function allowDrop(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    const type = e.dataTransfer.getData("type");
    if (!type) return; // 캔버스 내부 이동인 경우 무시

    // 뷰포트 기준 좌표를 캔버스 기준 좌표로 변환
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + viewport.scrollLeft;
    const y = e.clientY - rect.top + viewport.scrollTop;

    createObjectElement(type, x + 'px', y + 'px');
}

// --- 객체 생성 및 기능 구현 ---
function createObjectElement(type, x, y, data = null) {
    const id = data ? data.id : `obj-${appState.nextObjId++}`;
    const el = document.createElement('div');
    el.className = `obj obj-${type}`;
    el.style.left = x;
    el.style.top = y;
    el.dataset.type = type;
    el.dataset.id = id;

    // 드래그 기능 (캔버스 내 이동)
    makeElementDraggable(el);

    // 공통: 텍스트 편집 영역
    const content = document.createElement('div');
    content.className = 'obj-content';
    content.contentEditable = true;
    content.innerText = data ? data.content : (type === 'title' ? '제목' : type === 'plot' ? '플롯' : type === 'char' ? '캐릭터' : '설명');
    el.appendChild(content);

    // 타입별 특수 기능
    if (type === 'title') {
        const colorPicker = document.createElement('input');
        colorPicker.type = 'color';
        colorPicker.className = 'color-picker';
        colorPicker.value = data ? data.bgColor : '#ffffff';
        colorPicker.oninput = (e) => { el.style.backgroundColor = e.target.value; };
        el.style.backgroundColor = colorPicker.value;
        el.appendChild(colorPicker);
    }
    else if (type === 'plot') {
        const header = document.createElement('div');
        header.className = 'plot-header';
        
        // 토글 버튼 (우측 배치)
        const btn = document.createElement('div');
        btn.className = `toggle-btn ${data && data.plotToggle ? 'active' : ''}`;
        btn.onclick = () => btn.classList.toggle('active');
        
        // 구조 변경: content 옆에 버튼 배치
        content.style.width = '80%';
        header.appendChild(content); 
        header.appendChild(btn);
        el.innerHTML = ''; // 초기화
        el.appendChild(header);

        // 주석
        const annotation = document.createElement('div');
        annotation.className = 'annotation';
        annotation.contentEditable = true;
        annotation.innerText = data ? data.annotation : '주석 입력...';
        el.appendChild(annotation);
    }
    else if (type === 'char') {
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

        // 이미지 업로드 로직
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
                    newImg.src = readerEvent.target.result; // Base64 저장
                    imgArea.appendChild(newImg);
                };
                reader.readAsDataURL(file);
            }
        };

        imgArea.onclick = () => fileInput.click();
        el.appendChild(imgArea);
        el.appendChild(fileInput);
    }

    canvas.appendChild(el);
}

// --- 객체 이동 로직 (캔버스 내부) ---
function makeElementDraggable(elmnt) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    elmnt.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        if(e.target.isContentEditable || e.target.tagName === 'INPUT') return; 
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
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// --- 저장 및 불러오기 ---
function saveData() {
    saveCurrentTabState(); // 현재 작업중인 내용 반영
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
            
            // UI 업데이트
            titleInput.value = appState.title;
            appState.currentTabId = null; // 강제 갱신을 위해 초기화
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
