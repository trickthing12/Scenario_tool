:root {
    --bg-color: #f0f4f9;
    --sidebar-bg: #ffffff;
    --border-color: #e5e7eb;
    --primary-color: #1a73e8;
    --text-color: #1f1f1f;
    --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Noto Sans KR', sans-serif; background-color: var(--bg-color); color: var(--text-color); overflow: hidden; display: flex; height: 100vh; }

/* 1. 사이드바 수정 (가독성 확보) */
#sidebar { 
    min-width: 260px; /* 최소 너비 고정 */
    width: 260px;
    background: var(--sidebar-bg); 
    border-right: 1px solid var(--border-color); 
    display: flex; flex-direction: column; 
    padding: 20px; z-index: 20; 
    flex-shrink: 0; /* 줄어들지 않음 */
}
.brand { font-size: 1.2rem; font-weight: 700; color: var(--primary-color); margin-bottom: 20px; white-space: nowrap; }
.guide-box { background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 15px; font-size: 0.9rem; line-height: 1.6; color: #444; word-break: keep-all; }
.guide-title { font-weight: 700; margin-bottom: 8px; color: #333; display: block; border-bottom: 2px solid #ddd; padding-bottom: 4px; }
.guide-list { padding-left: 15px; margin: 0; }
.guide-list li { margin-bottom: 5px; }

/* 메인 영역 */
#main-content { flex-grow: 1; display: flex; flex-direction: column; position: relative; min-width: 0; }

/* 헤더 & 햄버거 메뉴 수정 */
#header { height: 60px; background: rgba(255,255,255,0.95); border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; padding: 0 20px; z-index: 1000; flex-shrink: 0; }
#scenario-title { font-size: 1.1rem; font-weight: 600; border: none; background: transparent; padding: 5px; outline: none; width: 300px; }
.header-right { display: flex; align-items: center; gap: 10px; position: relative; } /* relative 추가 */

#menu-container { position: relative; display: flex; align-items: center; justify-content: center; }
#hamburger-icon { font-size: 28px; cursor: pointer; padding: 5px 10px; border-radius: 4px; user-select: none; }
#hamburger-icon:hover { background: #eee; }

/* 팔레트 */
#object-palette {
    display: none; position: absolute; top: 100%; right: 0; margin-top: 10px;
    background: white; border: 1px solid var(--border-color); border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2); padding: 10px; width: 180px;
    flex-direction: column; gap: 8px; z-index: 9999;
}
#menu-container:hover #object-palette { display: flex; }
.draggable-item { padding: 10px; background: #f1f3f4; border-radius: 6px; cursor: grab; text-align: center; font-size: 0.9rem; font-weight: 500; border: 1px solid #ddd; }
.draggable-item:hover { background: #e8eaed; border-color: #bbb; }

/* 워크스페이스 & 스크롤 & 줌 */
#workspace { 
    flex-grow: 1; position: relative; 
    overflow: auto; /* 상하좌우 스크롤 */
    background-color: var(--bg-color); 
}

#timeline-container { 
    position: relative; 
    width: 3000px; height: 2000px; /* 상하 스크롤을 위해 높이 충분히 확보 */
    transform-origin: 0 0; /* 줌 기준점: 좌측 상단 */
    transition: transform 0.1s ease-out; /* 부드러운 줌 */
}

/* 3. 중앙선 수정 (선명하게) */
#central-line { 
    position: absolute; top: 50%; left: 50px; /* 시작점 여백 */
    width: calc(100% - 50px); height: 4px; /* 두께 증가 */
    background-color: #000000; z-index: 0; 
}

/* 6. 시작 지점 (START) */
#start-node {
    position: absolute; left: 0; top: 50%; transform: translate(-50%, -50%);
    width: 24px; height: 24px; background: black; border-radius: 50%;
    z-index: 1;
}
.start-text {
    position: absolute; top: 30px; left: 50%; transform: translateX(-50%);
    color: #d32f2f; font-weight: 900; font-size: 14px; letter-spacing: 1px;
}

#extend-btn { 
    position: absolute; top: 50%; right: -50px; transform: translateY(-50%); 
    width: 40px; height: 40px; border-radius: 50%; background: white; 
    border: 2px solid #000; cursor: pointer; display: flex; align-items: center; justify-content: center; 
    z-index: 10; font-size: 1.5rem; font-weight: bold;
}

/* SVG 및 객체 */
#svg-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none; }
.connection-line { stroke: #555; stroke-width: 2; fill: none; pointer-events: stroke; cursor: pointer; transition: stroke 0.2s; }
.connection-line:hover { stroke: var(--primary-color); stroke-width: 4; }
.line-text { fill: #000; font-size: 12px; font-weight: bold; background: white; text-anchor: middle; paint-order: stroke; stroke: white; stroke-width: 3px; }

.placed-object {
    position: absolute; padding: 12px; border-radius: 12px; cursor: move; z-index: 10;
    min-width: 120px; box-shadow: var(--shadow-md); display: flex; flex-direction: column; gap: 8px;
    background: white; border: 1px solid transparent; 
}
.placed-object:hover { box-shadow: 0 8px 15px rgba(0,0,0,0.2); z-index: 100; border-color: #999; }

/* 객체 내부 스타일 */
.obj-header { display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 10px; }
.editable-text { outline: none; min-width: 50px; line-height: 1.4; border-bottom: 1px dashed transparent; }
.editable-text:focus { border-bottom-color: #999; }
.color-picker { width: 18px; height: 18px; border: none; cursor: pointer; background: none; padding: 0; border-radius: 50%; overflow: hidden; }

/* 타입별 스타일 */
.obj-title { background: transparent; border: 2px dashed #000; box-shadow: none; }
.obj-title .editable-text { font-size: 2rem; font-weight: 800; color: #000; }
.obj-incident { background: #fff; border: 1px solid #333; border-left: 6px solid #000; }
.obj-char { background: #e3f2fd; border: 2px solid #2196f3; border-radius: 50px; padding: 8px 20px; flex-direction: row; }
.obj-memo { background: #fff9c4; border: 1px solid #f9a825; min-width: 150px; min-height: 100px; resize: both; overflow: auto; }

.bait-marker { width: 20px; height: 20px; border-radius: 50%; background: #eee; color: #999; display: flex; align-items: center; justify-content: center; font-size: 12px; cursor: pointer; font-weight: bold; }
.bait-marker.active { background: #d32f2f; color: white; }

.anchor { position: absolute; width: 12px; height: 12px; background: #fff; border: 2px solid #555; border-radius: 50%; cursor: crosshair; opacity: 0; transition: all 0.2s; z-index: 101; }
.placed-object:hover .anchor { opacity: 1; }
.anchor:hover { transform: scale(1.3); background: var(--primary-color); border-color: var(--primary-color); }
.anchor.active { background: #d32f2f; border-color: #d32f2f; opacity: 1; transform: scale(1.3); }
.anchor.top { top: -6px; left: 50%; transform: translateX(-50%); }
.anchor.bottom { bottom: -6px; left: 50%; transform: translateX(-50%); }
.anchor.left { top: 50%; left: -6px; transform: translateY(-50%); }
.anchor.right { top: 50%; right: -6px; transform: translateY(-50%); }

/* 줌 인디케이터 */
#zoom-indicator {
    position: fixed; bottom: 20px; right: 30px; 
    background: rgba(0,0,0,0.7); color: white; 
    padding: 8px 16px; border-radius: 20px; font-size: 0.9rem; font-weight: bold;
    pointer-events: none; z-index: 2000;
}
