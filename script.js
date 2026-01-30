/* --- 초기화 및 레이아웃 --- */
* { box-sizing: border-box; user-select: none; }
body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; font-family: 'Malgun Gothic', sans-serif; }

/* --- 상단 고정 헤더 --- */
#header-area {
    position: fixed; top: 0; left: 0; width: 100%; z-index: 1000;
    background-color: #d3d3d3; border-bottom: 2px solid #000;
    display: flex; flex-direction: column;
}

/* 1단: 제목 및 저장 버튼 */
.top-bar {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 20px; height: 60px;
}
#scenario-title {
    font-size: 24px; font-weight: bold; background: transparent; border: none;
    outline: none; width: 60%; cursor: text;
}
#scenario-title:hover { background: rgba(255,255,255,0.5); }

.btn-group button {
    padding: 5px 15px; font-size: 14px; cursor: pointer;
    background: #fff; border: 1px solid #000; margin-left: 5px;
}
.btn-group button:hover { background: #eee; }

/* 2단: 탭 (소제목) */
.tab-bar {
    display: flex; align-items: flex-end; padding-left: 10px; height: 40px;
    background: #e0e0e0; border-top: 1px solid #999;
}
.tab {
    padding: 8px 15px; border: 1px solid #999; border-bottom: none;
    background: #f0f0f0; margin-right: 2px; cursor: pointer;
    border-radius: 5px 5px 0 0; min-width: 80px; text-align: center;
}
.tab.active { background: #fff; font-weight: bold; border-bottom: 1px solid #fff; }
.tab input { border: none; background: transparent; width: 80px; text-align: center; outline: none; }
.add-tab-btn {
    padding: 5px 10px; font-weight: bold; cursor: pointer; font-size: 18px;
    background: transparent; border: none;
}
.add-tab-btn:hover { color: blue; }

/* --- 메인 캔버스 영역 --- */
#viewport {
    position: absolute; top: 100px; left: 0; right: 0; bottom: 0;
    overflow: auto; background-color: #fff;
}
#canvas {
    position: relative; width: 2000px; height: 1000px; /* 초기 크기 */
    background-image: radial-gradient(#ddd 1px, transparent 1px);
    background-size: 20px 20px;
}
/* 중앙 타임라인 선 */
#main-line {
    position: absolute; top: 50%; left: 0; width: 100%; height: 2px;
    background-color: #000; z-index: 0;
}

/* --- 플로팅 메뉴 (햄버거) --- */
#menu-container {
    position: fixed; top: 110px; right: 20px; z-index: 900;
}
#menu-btn {
    width: 80px; height: 40px; background: #e0e6eb; border: 2px solid #000;
    display: flex; justify-content: center; align-items: center;
    font-size: 16px; cursor: pointer; font-weight: bold;
}
#menu-items {
    display: none; flex-direction: column; background: #fff; 
    border: 2px solid #000; margin-top: 5px; padding: 10px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
#menu-container:hover #menu-items { display: flex; }

.draggable-source {
    padding: 8px; margin: 5px 0; border: 1px dashed #666; 
    background: #f9f9f9; cursor: grab; text-align: center;
}

/* --- 캔버스 위 객체들 공통 --- */
.obj {
    position: absolute; min-width: 120px; padding: 10px;
    background: #fff; border: 1px solid #000; box-shadow: 2px 2px 5px rgba(0,0,0,0.2);
    cursor: move; z-index: 10; display: flex; flex-direction: column; gap: 5px;
}
.obj:active { box-shadow: 4px 4px 10px rgba(0,0,0,0.3); z-index: 100; }
.obj-content { outline: none; min-height: 20px; cursor: text; }

/* 1. 제목 객체 */
.obj-title { border: 2px solid #333; font-weight: bold; text-align: center; }
.color-picker { width: 100%; height: 5px; border: none; padding: 0; margin-top: 5px; cursor: pointer;}

/* 2. 사건/사고(플롯) 객체 */
.obj-plot { border-left: 5px solid #000; }
.plot-header { display: flex; justify-content: space-between; align-items: center; }
.toggle-btn { 
    width: 20px; height: 20px; background: red; border: 1px solid #333; 
    border-radius: 50%; cursor: pointer; 
}
.toggle-btn.active { background: lime; }
.annotation { 
    font-size: 0.8em; color: #666; border-top: 1px dotted #ccc; 
    margin-top: 5px; padding-top: 5px; min-height: 20px; 
}

/* 3. 캐릭터 객체 */
.obj-char { border-radius: 10px; overflow: hidden; }
.char-img-area { 
    width: 100%; min-height: 50px; background: #eee; 
    display: flex; justify-content: center; align-items: center; cursor: pointer;
    overflow: hidden;
}
.char-img-area img { width: 100%; height: auto; display: block; }
.char-placeholder { font-size: 10px; color: #999; }
