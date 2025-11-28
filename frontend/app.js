// Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const WS_URL = 'ws://localhost:3000';

// State
let greenhouses = [];
let selectedGreenhouseId = null;
let selectedTableId = null;
let ws = null;
let updateInterval = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initWebSocket();
    loadGreenhouses();
    startTimeUpdate();
    startAutoRefresh();
});

// WebSocket connection
function initWebSocket() {
    ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
        console.log('WebSocket connected');
        updateConnectionStatus(true);
    };
    
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    };
    
    ws.onclose = () => {
        console.log('WebSocket disconnected');
        updateConnectionStatus(false);
        // Reconnect after 3 seconds
        setTimeout(initWebSocket, 3000);
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

function handleWebSocketMessage(data) {
    if (data.type === 'greenhouse-update') {
        updateGreenhouseData(data.data);
    }
}

function updateConnectionStatus(connected) {
    const badge = document.getElementById('connection-status');
    if (connected) {
        badge.textContent = 'Verbunden';
        badge.classList.remove('disconnected');
        badge.classList.add('connected');
    } else {
        badge.textContent = 'Getrennt';
        badge.classList.remove('connected');
        badge.classList.add('disconnected');
    }
}

// Time update
function startTimeUpdate() {
    async function updateSimulationInfo() {
        try {
            const status = await fetchAPI('/simulation/status');
            const env = await fetchAPI('/environment/current');
            
            // Update simulation time
            const hours = Math.floor(status.currentMinute / 60);
            const minutes = status.currentMinute % 60;
            document.getElementById('sim-day').textContent = `Tag: ${status.currentDay}`;
            document.getElementById('sim-time').textContent = `Zeit: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            document.getElementById('outside-temp').textContent = `Außen: ${env.temperature.toFixed(1)}°C`;
        } catch (error) {
            console.error('Failed to update simulation info:', error);
        }
    }
    updateSimulationInfo();
    setInterval(updateSimulationInfo, 2000);
}

// Auto refresh
function startAutoRefresh() {
    updateInterval = setInterval(() => {
        loadGreenhouses();
        if (selectedGreenhouseId) {
            loadGreenhouseDetails(selectedGreenhouseId);
        }
    }, 5000); // Refresh every 5 seconds
}

// API Calls
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'API request failed');
        }
        return data.data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function loadGreenhouses() {
    try {
        greenhouses = await fetchAPI('/greenhouses');
        renderGreenhouses();
        updateDashboardStats();
    } catch (error) {
        console.error('Failed to load greenhouses:', error);
    }
}

async function loadGreenhouseDetails(greenhouseId) {
    try {
        const greenhouse = await fetchAPI(`/greenhouses/${greenhouseId}/sensors`);
        renderGreenhouseDetails(greenhouse);
    } catch (error) {
        console.error('Failed to load greenhouse details:', error);
    }
}

async function loadTableDetails(greenhouseId, tableId) {
    try {
        const table = await fetchAPI(`/tables/${greenhouseId}/${tableId}`);
        renderTableDetails(table, greenhouseId);
    } catch (error) {
        console.error('Failed to load table details:', error);
    }
}

// Control Actions
async function toggleFan() {
    if (!selectedGreenhouseId) return;
    
    const greenhouse = greenhouses.find(g => g.id === selectedGreenhouseId);
    const newState = !greenhouse.fan;
    
    try {
        await fetchAPI(`/greenhouses/${selectedGreenhouseId}/fan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: newState })
        });
        
        greenhouse.fan = newState;
        updateFanButton(newState);
    } catch (error) {
        console.error('Failed to toggle fan:', error);
    }
}

async function updateShading(value) {
    if (!selectedGreenhouseId) return;
    
    document.getElementById('shading-value').textContent = `${value}%`;
    
    try {
        await fetchAPI(`/greenhouses/${selectedGreenhouseId}/shading`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ percentage: parseInt(value) })
        });
    } catch (error) {
        console.error('Failed to update shading:', error);
    }
}

async function toggleWater() {
    if (!selectedGreenhouseId || !selectedTableId) return;
    
    const greenhouse = greenhouses.find(g => g.id === selectedGreenhouseId);
    const table = greenhouse.tables.find(t => t.id === selectedTableId);
    const newState = !table.water;
    
    try {
        await fetchAPI(`/tables/${selectedGreenhouseId}/${selectedTableId}/water`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: newState })
        });
        
        table.water = newState;
        updateWaterButton(newState);
    } catch (error) {
        console.error('Failed to toggle water:', error);
    }
}

async function toggleFertilizer() {
    if (!selectedGreenhouseId || !selectedTableId) return;
    
    const greenhouse = greenhouses.find(g => g.id === selectedGreenhouseId);
    const table = greenhouse.tables.find(t => t.id === selectedTableId);
    const newState = !table.fertilizer;
    
    try {
        await fetchAPI(`/tables/${selectedGreenhouseId}/${selectedTableId}/fertilizer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: newState })
        });
        
        table.fertilizer = newState;
        updateFertilizerButton(newState);
    } catch (error) {
        console.error('Failed to toggle fertilizer:', error);
    }
}

// Rendering Functions
function renderGreenhouses() {
    const grid = document.getElementById('greenhouses-grid');
    grid.innerHTML = '';
    
    greenhouses.forEach(greenhouse => {
        const card = document.createElement('div');
        card.className = 'greenhouse-card';
        if (greenhouse.id === selectedGreenhouseId) {
            card.classList.add('active');
        }
        
        card.innerHTML = `
            <div class="greenhouse-header">
                <div class="greenhouse-name">${greenhouse.name}</div>
                <div>${greenhouse.fan ? '💨' : '🚫'}</div>
            </div>
            <div class="greenhouse-sensors">
                <div class="sensor-row">
                    <span class="sensor-label">🌡️ Temperatur</span>
                    <span class="sensor-value">${greenhouse.temperature.toFixed(1)}°C</span>
                </div>
                <div class="sensor-row">
                    <span class="sensor-label">💧 Luftfeuchtigkeit</span>
                    <span class="sensor-value">${greenhouse.humidity.toFixed(1)}%</span>
                </div>
                <div class="sensor-row">
                    <span class="sensor-label">💡 Lichtintensität</span>
                    <span class="sensor-value">${greenhouse.lightIntensity} lx</span>
                </div>
                <div class="sensor-row">
                    <span class="sensor-label">🌤️ Abschattung</span>
                    <span class="sensor-value">${greenhouse.shading}%</span>
                </div>
            </div>
        `;
        
        card.onclick = () => selectGreenhouse(greenhouse.id);
        grid.appendChild(card);
    });
}

function renderGreenhouseDetails(greenhouse) {
    document.getElementById('details-section').style.display = 'block';
    document.getElementById('details-title').textContent = greenhouse.name;
    
    // Update sensor readings
    document.getElementById('gh-temp').textContent = `${greenhouse.temperature.toFixed(1)}°C`;
    document.getElementById('gh-humidity').textContent = `${greenhouse.humidity.toFixed(1)}%`;
    document.getElementById('gh-light').textContent = `${greenhouse.lightIntensity} lx`;
    
    // Update controls
    updateFanButton(greenhouse.fan);
    document.getElementById('shading-slider').value = greenhouse.shading;
    document.getElementById('shading-value').textContent = `${greenhouse.shading}%`;
    
    // Render tables
    renderTables(greenhouse.tables);
}

function renderTables(tables) {
    const grid = document.getElementById('tables-grid');
    grid.innerHTML = '';
    
    tables.forEach(table => {
        const card = document.createElement('div');
        card.className = 'table-card';
        
        const readyForHarvest = table.plantSize >= 30 && table.soilMoisture <= 50;
        
        card.innerHTML = `
            <div class="table-name">${table.position}</div>
            <div class="sensor-row">
                <span class="sensor-label">🌱 Pflanzen</span>
                <span class="sensor-value">${table.plantCount}</span>
            </div>
            <div class="sensor-row">
                <span class="sensor-label">📏 Größe</span>
                <span class="sensor-value">${table.plantSize.toFixed(1)}cm</span>
            </div>
            <div class="sensor-row">
                <span class="sensor-label">💧 Feuchtigkeit</span>
                <span class="sensor-value">${table.soilMoisture.toFixed(1)}%</span>
            </div>
            <div class="table-status">
                ${table.water ? '<span class="status-indicator water-on">💧 WASSER</span>' : ''}
                ${table.fertilizer ? '<span class="status-indicator fertilizer-on">🌿 DÜNGER</span>' : ''}
                ${readyForHarvest ? '<span class="status-indicator ready-harvest">📦 BEREIT</span>' : ''}
            </div>
        `;
        
        card.onclick = () => openTableModal(table.id);
        grid.appendChild(card);
    });
}

function renderTableDetails(table, greenhouseId) {
    document.getElementById('table-modal-title').textContent = `Tisch ${table.position}`;
    document.getElementById('table-position').textContent = table.position;
    document.getElementById('table-plant-count').textContent = table.plantCount;
    document.getElementById('table-plant-size').textContent = `${table.plantSize.toFixed(1)} cm`;
    document.getElementById('table-temp').textContent = `${table.temperature.toFixed(1)}°C`;
    document.getElementById('table-moisture').textContent = `${table.soilMoisture.toFixed(1)}%`;
    document.getElementById('table-fertility').textContent = `${table.soilFertility.toFixed(1)}%`;
    
    // Update controls
    updateWaterButton(table.water);
    updateFertilizerButton(table.fertilizer);
    
    // Update art light slider
    const artLightSlider = document.getElementById('artlight-slider');
    const artLightValue = document.getElementById('artlight-value');
    if (artLightSlider && table.artLight !== undefined) {
        artLightSlider.value = table.artLight;
        artLightValue.textContent = `${table.artLight} lx`;
    }
    
    // Harvest status
    const harvestStatus = document.getElementById('harvest-status');
    const harvestMessage = document.getElementById('harvest-message');
    
    if (table.plantSize >= 30 && table.soilMoisture <= 50) {
        harvestStatus.classList.add('ready');
        harvestMessage.textContent = '✅ Pflanzen sind bereit zum Versand!';
    } else {
        harvestStatus.classList.remove('ready');
        const reasons = [];
        if (table.plantSize < 30) reasons.push(`Größe: ${table.plantSize.toFixed(1)}cm / 30cm`);
        if (table.soilMoisture > 50) reasons.push(`Feuchtigkeit: ${table.soilMoisture.toFixed(1)}% / max 50%`);
        harvestMessage.textContent = `❌ Nicht bereit: ${reasons.join(', ')}`;
    }
}

function updateDashboardStats() {
    let totalPlants = 0;
    let totalSize = 0;
    let plantCount = 0;
    
    greenhouses.forEach(gh => {
        gh.tables.forEach(table => {
            totalPlants += table.plantCount;
            totalSize += table.plantSize * table.plantCount;
            plantCount += table.plantCount;
        });
    });
    
    document.getElementById('total-plants').textContent = totalPlants.toLocaleString();
    document.getElementById('avg-plant-size').textContent = 
        plantCount > 0 ? `${(totalSize / plantCount).toFixed(1)} cm` : '-';
}

function updateGreenhouseData(newData) {
    const index = greenhouses.findIndex(g => g.id === newData.id);
    if (index !== -1) {
        greenhouses[index] = newData;
        renderGreenhouses();
        if (selectedGreenhouseId === newData.id) {
            renderGreenhouseDetails(newData);
        }
        updateDashboardStats();
    }
}

// UI Control Functions
function updateFanButton(state) {
    const btn = document.getElementById('fan-toggle');
    const stateText = btn.querySelector('.toggle-state');
    if (state) {
        btn.classList.add('active');
        stateText.textContent = 'EIN';
    } else {
        btn.classList.remove('active');
        stateText.textContent = 'AUS';
    }
}

function updateWaterButton(state) {
    const btn = document.getElementById('water-toggle');
    const stateText = btn.querySelector('.toggle-state');
    if (state) {
        btn.classList.add('active');
        stateText.textContent = 'EIN';
    } else {
        btn.classList.remove('active');
        stateText.textContent = 'AUS';
    }
}

function updateFertilizerButton(state) {
    const btn = document.getElementById('fertilizer-toggle');
    const stateText = btn.querySelector('.toggle-state');
    if (state) {
        btn.classList.add('active');
        stateText.textContent = 'EIN';
    } else {
        btn.classList.remove('active');
        stateText.textContent = 'AUS';
    }
}

// New control functions
async function updateArtLight(value) {
    if (!selectedGreenhouseId || !selectedTableId) return;
    
    document.getElementById('artlight-value').textContent = `${value} lx`;
    
    try {
        await fetchAPI(`/tables/${selectedGreenhouseId}/${selectedTableId}/light`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lumens: parseInt(value) })
        });
    } catch (error) {
        console.error('Failed to update art light:', error);
    }
}

async function changeSimulationSpeed(speed) {
    try {
        await fetchAPI('/simulation/speed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ speed: parseInt(speed) })
        });
        console.log(`Simulation speed set to ${speed}x`);
    } catch (error) {
        console.error('Failed to change simulation speed:', error);
    }
}

// Navigation Functions
function selectGreenhouse(id) {
    selectedGreenhouseId = id;
    renderGreenhouses();
    loadGreenhouseDetails(id);
}

function closeDetails() {
    selectedGreenhouseId = null;
    document.getElementById('details-section').style.display = 'none';
    renderGreenhouses();
}

function openTableModal(tableId) {
    selectedTableId = tableId;
    loadTableDetails(selectedGreenhouseId, tableId);
    document.getElementById('table-modal').classList.add('show');
}

function closeTableModal() {
    selectedTableId = null;
    document.getElementById('table-modal').classList.remove('show');
}

// Close modal on outside click
document.getElementById('table-modal').onclick = (e) => {
    if (e.target.id === 'table-modal') {
        closeTableModal();
    }
};
