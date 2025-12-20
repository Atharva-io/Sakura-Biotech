/**
 * ORBIT DIAGRAM LOGIC
 * Reusable system for Algae, Mushroom, and Plant sections.
 */

const ORBIT_CONFIG = {
    rotationSpeed: 0.002,
    reservedArc: 130 * (Math.PI / 180),
    hoverScale: 1.4,
    normalScale: 1.0,
    radiusFactor: 0.35, // r = min(w, h) * 0.35
    dampening: 0.1,
};

const ORBIT_DATA = {
    mushroom: [
        { id: 1, number: "1", title: "Grow Chamber", subtitle: "(Box Design)", bullets: ["Compact, sealed structure", "Layout for predictable airflow", "Easy access for loading"] },
        { id: 2, number: "2", title: "Humidity", subtitle: "Control", bullets: ["Maintains target RH with smart cycling", "Reduced over-misting and wet spots", "Stable fruiting conditions"] },
        { id: 3, number: "3", title: "Airflow", subtitle: "& Exchange", bullets: ["Controlled intake/exhaust", "Manage CO2 buildup", "Uniform air distribution"] },
        { id: 4, number: "4", title: "Monitoring", subtitle: "& Alerts", bullets: ["Tracks Temp, Humidity, CO2", "Alerts for out-of-range values", "Basic logs for analysis"] },
        { id: 5, number: "5", title: "Recipe / Mode", subtitle: "Settings", bullets: ["Simple modes for different phases", "Repeatable settings per species", "Manual override control"] }
    ],
    algae: [
        { id: 1, number: "1", title: "Cultivation", subtitle: "Hardware", bullets: ["Optimized reactor geometry", "Harvest-friendly plumbing", "Modular expansion"] },
        { id: 2, number: "2", title: "Lighting", subtitle: "& Control", bullets: ["Programmable photoperiods", "Intensity control & recipes", "Strain-specific modes"] },
        { id: 3, number: "3", title: "Sensor", subtitle: "Stack", bullets: ["Temp, pH, DO, ORP, Light", "Data validation & drift alerts", "Real-time outlier detection"] },
        { id: 4, number: "4", title: "Automation", subtitle: "& Control", bullets: ["Closed-loop actuator control", "Fail-safes and event logging", "Safe operating limits"] },
        { id: 5, number: "5", title: "Data Platform", subtitle: "& AI", bullets: ["Live dashboard + history", "Recipe-to-outcome comparison", "Predictive instability analytics"] }
    ],
    plant: [
        { id: 1, number: "1", title: "Grow", subtitle: "Modules", bullets: ["Configurable crop layouts", "Uniform nutrient delivery", "Scalable modular add-ons"] },
        { id: 2, number: "2", title: "Reservoir", subtitle: "& Recirculation", bullets: ["Pump-driven circulation", "Stable flow design", "Easy maintenance access"] },
        { id: 3, number: "3", title: "Monitoring", subtitle: "Stack", bullets: ["pH, EC/TDS, Temperature", "Critical drift alerts", "Continuous data logging"] },
        { id: 4, number: "4", title: "Dosing", subtitle: "& Automation", bullets: ["Rule-based nutrient dosing", "Safety limits & overrides", "Event traceability logs"] },
        { id: 5, number: "5", title: "Dashboard", subtitle: "& Logs", bullets: ["Real-time system status", "Growth trends over time", "Exportable batch data"] }
    ]
};

class OrbitSystem {
    constructor(containerId, dataKey) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.data = ORBIT_DATA[dataKey];
        this.nodes = [];
        this.centerX = 0;
        this.centerY = 0;
        this.orbitRadius = 150;
        this.baseRotation = 0;
        this.isPaused = false;
        this.selectedId = null;

        this.initDOM();
        this.handleResize();
        window.addEventListener('resize', this.handleResize.bind(this));

        // START LOOP
        // We bind 'this' but managed by global loop? 
        // Actually, distinct instances can animate themselves in the global loop if we register them.
        OrbitManager.register(this);
    }

    initDOM() {
        this.container.innerHTML = ''; // Clear

        // SVG Layer
        this.svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svgLayer.setAttribute('class', 'connections-layer');
        this.container.appendChild(this.svgLayer);

        // Core
        const core = document.createElement('div');
        core.className = 'core';
        core.innerHTML = '<h2>Core<br>System<br>Modules</h2>';
        this.container.appendChild(core);

        // Nodes
        const angleStep = (Math.PI * 2) / this.data.length;
        this.data.forEach((item, index) => {
            // DOM
            const el = document.createElement('div');
            el.className = 'node';
            el.innerHTML = `
        <div class="node-number" data-label="${item.title}">${item.number}</div>
        <div class="node-title">${item.title}<br><span class="node-subtitle">${item.subtitle}</span></div>
      `;

            // Events
            el.addEventListener('pointerenter', () => this.handleHover(index));
            // Mobile tap support handled by pointerenter mostly, or click
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleHover(index);
            });

            this.container.appendChild(el);

            // SVG Line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('class', 'connector');
            this.svgLayer.appendChild(line);

            this.nodes.push({
                index,
                data: item,
                element: el,
                line: line,
                currentAngle: index * angleStep,
                targetAngle: index * angleStep,
                scale: 1,
                targetScale: 1,
                targetRelativeOffset: 0
            });
        });

        // Info Panel
        this.infoPanel = document.createElement('div');
        this.infoPanel.className = 'info-panel';
        this.infoPanel.innerHTML = `
      <div class="info-header"></div>
      <ul class="info-list"></ul>
    `;
        this.container.appendChild(this.infoPanel);

        // Clear Selection on Background Click
        this.container.addEventListener('click', (e) => {
            if (!e.target.closest('.node')) this.clearSelection();
        });
        this.container.addEventListener('mouseleave', () => this.clearSelection());
    }

    handleResize() {
        if (!this.container) return;
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.centerX = w / 2;
        this.centerY = h / 2;
        // Adapt radius: min(w,h) * factor
        this.orbitRadius = Math.min(w, h) * ORBIT_CONFIG.radiusFactor;
    }

    handleHover(index) {
        this.isPaused = true;
        this.selectedId = index;
        this.updateTargetAngles(index);
        this.updatePanel(index);
    }

    clearSelection() {
        this.isPaused = false;
        this.selectedId = null;
        this.infoPanel.classList.remove('visible');

        // Reset relative offsets
        this.nodes.forEach(n => {
            n.targetScale = ORBIT_CONFIG.normalScale;
            // We don't reset targetRelativeOffset explicitly here because 
            // the 'normal state' calc in update() ignores it.
        });
    }

    updateTargetAngles(selectedIndex) {
        const totalNodes = this.nodes.length;
        const reserved = ORBIT_CONFIG.reservedArc; // e.g. 130 deg
        const remainingArc = (Math.PI * 2) - reserved;
        const step = remainingArc / (totalNodes - 1);

        this.nodes.forEach((node, i) => {
            if (i === selectedIndex) {
                node.targetRelativeOffset = 0;
                node.targetScale = ORBIT_CONFIG.hoverScale;
            } else {
                node.targetScale = ORBIT_CONFIG.normalScale;

                let diff = i - selectedIndex;
                // Normalize diff to -2..+2 (shortest path logic)
                if (diff > totalNodes / 2) diff -= totalNodes;
                if (diff < -totalNodes / 2) diff += totalNodes;

                // Distribute in remaining arc
                // 0 is selected. 
                // 1 (right) -> +reserved/2
                // 2 (right) -> +reserved/2 + step
                // -1 (left) -> -reserved/2

                // Simple linear map based on 'diff' index relative to selected
                // We want to map indices 1..4 (or whatever) to positions.

                // Let's use simple logic:
                // Position = Sign(diff) * (reserved/2 + (Abs(diff)-1) * step + step/2 ?)
                // Use even distribution range.

                // Let's just create an ordered list of neighbors
                // neighbors right: 1, 2
                // neighbors left: -1, -2

                let offset = 0;
                if (diff > 0) {
                    offset = (reserved / 2) + ((diff - 1) * step) + (step / 2);
                } else {
                    offset = -((reserved / 2) + ((Math.abs(diff) - 1) * step) + (step / 2));
                }
                node.targetRelativeOffset = offset;
            }
        });
    }

    updatePanel(index) {
        const item = this.nodes[index].data;
        const header = this.infoPanel.querySelector('.info-header');
        const list = this.infoPanel.querySelector('.info-list');

        header.innerText = `${item.number}. ${item.title} ${item.subtitle}`;
        list.innerHTML = item.bullets.map(b => `<li>${b}</li>`).join('');

        // Position happens in update()
        this.infoPanel.classList.add('visible');
    }

    update() {
        if (!this.isPaused) {
            this.baseRotation += ORBIT_CONFIG.rotationSpeed;
        }

        const distStep = (Math.PI * 2) / this.nodes.length;

        this.nodes.forEach((node, i) => {
            let targetTheta;

            if (this.selectedId !== null) {
                // Expanded State
                const selectedNode = this.nodes[this.selectedId];
                // Anchor to selected node's current angle
                targetTheta = selectedNode.currentAngle + node.targetRelativeOffset;
            } else {
                // Normal State
                targetTheta = this.baseRotation + (i * distStep);
            }

            // Lerp Angle
            let diff = targetTheta - node.currentAngle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            node.currentAngle += diff * ORBIT_CONFIG.dampening;

            // Lerp Scale
            node.scale += (node.targetScale - node.scale) * ORBIT_CONFIG.dampening;

            // Calc Position
            const r = this.orbitRadius;
            const x = this.centerX + Math.cos(node.currentAngle) * r;
            const y = this.centerY + Math.sin(node.currentAngle) * r;

            // DOM Update
            const nodeHalf = 45; // 90px / 2
            node.element.style.transform = `translate(${x - this.centerX - nodeHalf}px, ${y - this.centerY - nodeHalf}px) scale(${node.scale})`;

            node.element.style.zIndex = (i === this.selectedId) ? 100 : 10;
            node.element.style.left = `${this.centerX}px`;
            node.element.style.top = `${this.centerY}px`;

            // SVG Line
            node.line.setAttribute('x1', this.centerX);
            node.line.setAttribute('y1', this.centerY);
            node.line.setAttribute('x2', x);
            node.line.setAttribute('y2', y);

            if (this.selectedId === i) {
                node.line.style.strokeOpacity = 1;
                node.line.style.stroke = getComputedStyle(document.documentElement).getPropertyValue('--accent-pink');
            } else {
                node.line.style.strokeOpacity = 0.3;
                node.line.style.stroke = getComputedStyle(document.documentElement).getPropertyValue('--accent-purple');
            }

            // Panel Position
            if (this.selectedId === i) {
                // To the right normally, but flip if too close to right edge?
                // Simplest: x + nodeRadius + gap
                const panelX = x + 60;
                const panelY = y;

                // Basic boundary check?
                // if (panelX > this.container.clientWidth - 240) ... left side

                this.infoPanel.style.left = `${panelX}px`;
                this.infoPanel.style.top = `${panelY}px`;
            }
        });
    }
}

// Manager to handle the loop
const OrbitManager = {
    instances: [],
    register(instance) {
        this.instances.push(instance);
        if (!this.isRunning) {
            this.isRunning = true;
            this.loop();
        }
    },
    loop() {
        this.instances.forEach(inst => inst.update());
        requestAnimationFrame(this.loop.bind(this));
    }
};

// Auto-init specific containers if they exist
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('orbit-algae')) new OrbitSystem('orbit-algae', 'algae');
    if (document.getElementById('orbit-mushroom')) new OrbitSystem('orbit-mushroom', 'mushroom');
    if (document.getElementById('orbit-plant')) new OrbitSystem('orbit-plant', 'plant');
});
