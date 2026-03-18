const canvas = document.getElementById('canvas');
const propPanel = document.getElementById('property-panel');
const propName = document.getElementById('prop-name');
const propUnits = document.getElementById('prop-units');
const propActivation = document.getElementById('prop-activation');

let nodes = [];
let edges = [];

let dragNode = null;
let offsetX = 0;
let offsetY = 0;

let connectLine = null;
let connectNode = null;
let selectedNode = null;

// =================== Layer 버튼 ===================
document.getElementById('add').onclick = () => {
    const node = {
        id: Date.now(),
        x: 100 + Math.random()*300,
        y: 100 + Math.random()*200,
        name: "Layer",
        units: 64,
        activation: "ReLU"
    };
    nodes.push(node);
    createNodeElement(node);
};

// =================== 노드 생성 ===================
function createNodeElement(node) {
    const el = document.createElement('div');
    el.className = 'node';
    node.el = el;
    updateNodeText(node);

    el.style.left = node.x + 'px';
    el.style.top = node.y + 'px';

    // 클릭 → Ctrl 누르면 선택
    el.onclick = (e) => {
        if (e.ctrlKey) {
            selectNode(node);
        }
    };

    // 마우스 다운 → 왼쪽/우클릭 처리
    el.onmousedown = (e) => {
        e.preventDefault();
        if (e.shiftKey) {
            connectNode = node;
            startConnectLine(e, node);
        } else {
            dragNode = node;
            offsetX = e.offsetX;
            offsetY = e.offsetY;
        }
    };

    canvas.appendChild(el);
}

// =================== 노드 선택 ===================
function selectNode(node) {
    if (selectedNode && selectedNode.el) {
        selectedNode.el.style.border = '1px solid #555';
    }
    selectedNode = node;
    node.el.style.border = '2px solid #1E90FF';
    showProperties(node);
}

// =================== 속성 패널 ===================
function showProperties(node) {
    if (!node) return;

    propName.value = node.name;
    propUnits.value = node.units;
    propActivation.value = node.activation;

    // input 이벤트 연결
    propName.oninput = () => { selectedNode.name = propName.value; updateNodeText(selectedNode); };
    propUnits.oninput = () => { selectedNode.units = parseInt(propUnits.value); updateNodeText(selectedNode); };
    propActivation.oninput = () => { selectedNode.activation = propActivation.value; updateNodeText(selectedNode); };
}

// =================== 노드 텍스트 업데이트 ===================
function updateNodeText(node) {
    node.el.innerText = node.name + "\n" + node.units + " units\n" + node.activation;
}

// =================== 연결선 ===================
function startConnectLine(e, node) {
    connectLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    connectLine.setAttribute("stroke", "white");
    connectLine.setAttribute("stroke-width", 2);
    connectLine.setAttribute("x1", node.x + 70);
    connectLine.setAttribute("y1", node.y + 20);
    connectLine.setAttribute("x2", e.pageX);
    connectLine.setAttribute("y2", e.pageY);
    canvas.appendChild(connectLine);
}

// =================== SVG edges 렌더링 ===================
function renderEdges() {
    let svg = document.getElementById('edges');
    if (!svg) {
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.id = "edges";
        svg.style.position = "absolute";
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.style.pointerEvents = "none";
        canvas.appendChild(svg);
    }
    svg.innerHTML = "";
    edges.forEach(e => {
        const from = nodes.find(n => n.id === e.from);
        const to = nodes.find(n => n.id === e.to);
        const line = document.createElementNS("http://www.w3.org/2000/svg","line");
        line.setAttribute("x1", from.x + 70);
        line.setAttribute("y1", from.y + 20);
        line.setAttribute("x2", to.x + 70);
        line.setAttribute("y2", to.y + 20);
        line.setAttribute("stroke", "white");
        line.setAttribute("stroke-width", 2);
        svg.appendChild(line);
    });
}

// =================== 마우스 이동 ===================
document.onmousemove = (e) => {

    // 노드 드래그 (왼쪽/우클릭 모두 가능)
    if (dragNode) {
        dragNode.x = e.pageX - offsetX;
        dragNode.y = e.pageY - offsetY;
        dragNode.el.style.left = dragNode.x + 'px';
        dragNode.el.style.top = dragNode.y + 'px';
        renderEdges();
    }

    // 연결선 드래그
    if (connectLine) {
        connectLine.setAttribute("x2", e.pageX);
        connectLine.setAttribute("y2", e.pageY);
    }
};

// =================== 마우스 업 ===================
document.onmouseup = (e) => {
    isDraggingPanel = false;

    dragNode = null;

    if (connectLine && connectNode) {
        const target = nodes.find(n => {
            const rect = n.el.getBoundingClientRect();
            return e.clientX >= rect.left && e.clientX <= rect.right &&
                   e.clientY >= rect.top && e.clientY <= rect.bottom;
        });
        if (target && target !== connectNode) {
            edges.push({from: connectNode.id, to: target.id});
            renderEdges();
        }
        canvas.removeChild(connectLine);
        connectLine = null;
        connectNode = null;
    }
};

// =================== Save JSON ===================
document.getElementById('save').onclick = () => {
    const data = nodes.map(n => ({
        id: n.id,
        name: n.name,
        units: n.units,
        activation: n.activation,
        x: n.x,
        y: n.y
    }));
    console.log("Nodes:", JSON.stringify(data, null, 2));
    console.log("Edges:", JSON.stringify(edges, null, 2));
};

// =================== Generate TF Code + 클립보드 복사 ===================
document.getElementById('generate-tf').onclick = async () => {
    let code = `import tensorflow as tf\nfrom tensorflow.keras import layers, models\n\n`;
    code += `model = models.Sequential()\n`;

    nodes.forEach(n => {
        const units = n.units || 64;
        const act = (n.activation || "ReLU").toLowerCase();
        code += `model.add(layers.Dense(${units}, activation='${act}'))  # ${n.name}\n`;
    });

    code += `\nmodel.summary()\n`;

    try {
        await navigator.clipboard.writeText(code);
        alert("TensorFlow code copied to clipboard! ✅");
    } catch (err) {
        console.error("Clipboard copy failed:", err);
    }
};