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

/* --- 1. 사이드바 수정 (가독성 확보) --- */
#sidebar { 
    width: 280px;           /* 너비 고정 */
    min-width: 280px;       /* 최소 너비 고정 */
    flex-shrink: 0;         /* [중요] 창이 작아져도 절대 줄어들지 않음 */
    background: var(--sidebar-bg); 
    border-right: 1px solid var(--border-color); 
    display: flex; flex-direction: column; 
    padding: 20px; z-index: 2000; 
    overflow-y: auto;       /* 내용이 길면 사이드바 내부 스크롤 */
}
.brand { font-size: 1.2rem; font-weight: 700; color: var(--primary-color); margin-bottom: 20px; white-space: nowrap; }

/* 가이드 박스 텍스트 줄바꿈 방지 및 가독성 개선 */
.guide-box { 
    background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 15px; 
    font-size: 0.9rem; line-height: 1.6; color: #444; 
    word-break: keep-all; /* 단어 단위로 줄바꿈 (글자 짤림 방지) */
}
.guide-title { font-weight: 700; margin-bottom: 8px; color: #333; border-bottom: 2px solid #e9ecef; padding-bottom: 5px; display: block; }
.guide-list { padding-left: 15px; margin: 0; }
.guide-list li { margin-bottom: 8px; }

/* --- 메인 영역 --- */
#main-content { flex-grow: 1; display: flex; flex-direction: column; position: relative; min-width: 0; }

/* --- 헤더 & 메뉴 복구 --- */
#header { 
    height: 60px; background: rgba(255,255,255,0.95); 
    border-bottom: 1px solid var(--border-color); 
    display: flex; align-items: center; justify-content: space-between; /* 양쪽 정렬 */
    padding: 0 20px; z-index: 1000; flex-shrink: 0; 
}
#scenario-title { font-size: 1.1rem; font-weight: 600; border: none; background: transparent; padding: 5px; outline: none; width: 300px; }

/* 우측 컨트롤 그룹 */
.header-right { 
    display: flex; align-items: center; gap: 10px; position: relative; 
}
.btn { padding: 8px 16px; border-radius: 20px; border: 1px solid var(--border-color); background: white; cursor: pointer; font-size: 0.85rem; font-weight: 500; white-space: nowrap; }
.btn:hover { background: #f8f9fa; }

/* 햄버거 메뉴 아이콘 */
#menu-container { position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; margin-left: 10px; }
#hamburger-icon { font-size: 24px; cursor: pointer; padding: 5px; border-radius: 4px; user-select: none; display: block; color: #333; }
#hamburger-icon:hover { background: #eee; }

/* 객체 팔레트 (드롭다운) */
#object-palette {
    display: none; position: absolute; top: 100%; right: 0; margin-top: 5px;
    background: white; border: 1px solid var(--border-color); border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2); padding: 10px; width: 180px;
    flex-direction: column; gap: 8px; z-index: 9999;
}
#menu-container:hover #object-palette { display: flex; } /* 호버 시 표시 */

.draggable-item { padding: 10px; background: #f1f3f4; border-radius: 6px; cursor: grab; text-align: center; font-size: 0.9rem; font-weight: 500; border: 1px solid #ddd; transition: all 0.2s; }
.draggable-item:hover { background: #e8eaed; border-color: #bbb; transform: translateY(-2px); }

/* --- 워크스페이스 & 줌 --- */
#workspace { 
    flex-grow: 1; position: relative; 
    overflow: auto; /* 스크롤바 표시 */
    background-color: var(--bg-color); 
}
#timeline-container { 
    position: relative; 
    width: 3000px; height: 2000px; 
    transform-origin: 0 0; 
    transition: transform 0.1s ease-out; 
}

/* --- 중앙선 & START 노드 수정 --- */
#central-line { 
    position: absolute; top: 50%; left: 100px; /* 시작 여백 */
    width: calc(100% - 100px); height: 4px; 
    background-color: #000000; z-index: 0; 
}

/* 4. START 노드 디자인 수정 */
#start-node {
    position: absolute; 
    left: -12px; /* 선의 시작점에 원의 중심이 오도록 보정 (width/2) */
    top: 50%; transform: translateY(-50%);
    width: 24px; height: 24px; 
    background: #000000; /* 검은색 원 */
    border-radius: 50%;
    z-index: 2;
}
.start-text {
    position: absolute; 
    top: 30px; /* 원 아래로 배치 */
    left: 50%; transform: translateX(-50%);
    color: #ff0000; /* 붉은색 텍스트 */
    font-weight: 900; font-size: 16px; letter-spacing: 1px;
    white-space: nowrap;
}

#extend-btn { 
    position: absolute; top: 50%; right: -50px; transform: translateY(-50%); 
    width: 40px; height: 40px; border-radius: 50%; background: white; 
    border: 2px solid #000; cursor: pointer; display: flex; align-items: center; justify-content: center; 
    z-index: 10; font-size: 1.5rem; font-weight: bold;
}

/* SVG 레이어 */
#svg-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none; }
.connection-line { stroke: #555; stroke-width: 2; fill: none; pointer-events: stroke; cursor: pointer; transition: stroke 0.2s; }
.connection-line:hover { stroke: var(--primary-color); stroke-width: 4; }
.line-text { fill: #000; font-size: 12px; font-weight: bold; background: white; text-anchor: middle; paint-order: stroke; stroke: white; stroke-width: 3px; }

/* 배치된 객체 */
.placed-object {
    position: absolute; padding: 12px; border-radius: 12px; cursor: move; z-index: 10;
    min-width: 120px; box-shadow: var(--shadow-md); display: flex; flex-direction: column; gap: 8px;
    background: white; border: 1px solid transparent; 
}
.placed-object:hover { box-shadow: 0 8px 15px rgba(0,0,0,0.2); z-index: 100; border-color: #999; }
.obj-header { display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 10px; }
.editable-text { outline: none; min-width: 50px; line-height: 1.4; border-bottom: 1px dashed transparent; }
.editable-text:focus { border-bottom-color: #999; }
.color-picker { width: 18px; height: 18px; border: none; cursor: pointer; background: none; padding: 0; border-radius: 50%; overflow: hidden; }

/* 객체 타입별 스타일 */
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

#zoom-indicator {
    position: fixed; bottom: 20px; right: 30px; 
    background: rgba(0,0,0,0.8); color: white; 
    padding: 8px 16px; border-radius: 20px; font-size: 0.9rem; font-weight: bold;
    pointer-events: none; z-index: 2000;
}
