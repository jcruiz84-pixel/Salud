const STORAGE_KEY = 'healthDashboardWearable';
const MAX_HISTORY_POINTS = 120;

const defaultState = {
    connected: false,
    deviceName: '',
    source: 'demo',
    lastUpdated: null,
    metrics: {},
    history: {
        hr: [],
        steps: [],
        sleep: [],
        spo2: []
    }
};

export function readWearableState() {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!stored) {
            return {
                ...defaultState,
                history: { ...defaultState.history },
                metrics: { ...defaultState.metrics }
            };
        }

        return {
            ...defaultState,
            ...stored,
            metrics: { ...defaultState.metrics, ...(stored?.metrics || {}) },
            history: { ...defaultState.history, ...(stored?.history || {}) }
        };
    } catch (error) {
        return { ...defaultState };
    }
}

export function saveWearableState(nextState) {
    const currentState = readWearableState();
    const state = {
        ...currentState,
        ...nextState,
        metrics: { ...currentState.metrics, ...(nextState.metrics || {}) },
        history: { ...currentState.history, ...(nextState.history || {}) }
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('wearable:data', { detail: state }));
    return state;
}

export function clearWearableConnection() {
    const currentState = readWearableState();
    const clearedMetrics = Object.fromEntries(
        Object.entries(currentState.metrics).map(([metric, value]) => [
            metric,
            { ...value, real: false }
        ])
    );

    return saveWearableState({
        connected: false,
        source: 'demo',
        lastUpdated: null,
        metrics: clearedMetrics
    });
}

export function updateWearableMetric(metric, value, metadata = {}) {
    const currentState = readWearableState();
    const now = new Date().toISOString();
    const history = currentState.history[metric] || [];
    const nextHistory = [
        ...history,
        { time: now, value }
    ].slice(-MAX_HISTORY_POINTS);

    return saveWearableState({
        connected: true,
        source: 'bluetooth',
        lastUpdated: now,
        metrics: {
            [metric]: {
                value,
                unit: metadata.unit || currentState.metrics[metric]?.unit || '',
                updatedAt: now,
                real: true
            }
        },
        history: {
            [metric]: nextHistory
        }
    });
}

export function hasRecentWearableMetric(metric, maxAgeMinutes = 180) {
    const metricState = readWearableState().metrics[metric];
    if (!metricState?.real || !metricState.updatedAt) return false;

    const age = Date.now() - new Date(metricState.updatedAt).getTime();
    return age <= maxAgeMinutes * 60 * 1000;
}

export function formatLastSync(isoDate) {
    if (!isoDate) return 'Sin sincronizar';

    const diffSeconds = Math.max(0, Math.round((Date.now() - new Date(isoDate).getTime()) / 1000));
    if (diffSeconds < 60) return 'Ahora';

    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;

    const diffHours = Math.round(diffMinutes / 60);
    return `Hace ${diffHours} h`;
}

function parseHeartRateMeasurement(value) {
    const flags = value.getUint8(0);
    const is16Bit = Boolean(flags & 0x01);
    return is16Bit ? value.getUint16(1, true) : value.getUint8(1);
}

export class WebBluetoothWearable {
    constructor({ onStatus, onError } = {}) {
        this.device = null;
        this.server = null;
        this.onStatus = onStatus;
        this.onError = onError;
        this.handleDisconnected = this.handleDisconnected.bind(this);
    }

    isSupported() {
        return Boolean(navigator.bluetooth);
    }

    async connect() {
        if (!this.isSupported()) {
            throw new Error('Este navegador no soporta Web Bluetooth.');
        }

        this.onStatus?.('Buscando reloj...');

        this.device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['heart_rate', 'battery_service', 'device_information']
        });

        this.device.addEventListener('gattserverdisconnected', this.handleDisconnected);
        this.onStatus?.('Conectando...');

        this.server = await this.device.gatt.connect();
        saveWearableState({
            connected: true,
            deviceName: this.device.name || 'Reloj Bluetooth',
            source: 'bluetooth',
            lastUpdated: new Date().toISOString()
        });

        const [heartRateResult] = await Promise.allSettled([
            this.subscribeToHeartRate(),
            this.readBatteryLevel()
        ]);

        this.onStatus?.(
            heartRateResult.status === 'fulfilled'
                ? 'Reloj conectado'
                : 'Conectado, sin frecuencia compatible'
        );
        return readWearableState();
    }

    async subscribeToHeartRate() {
        const service = await this.server.getPrimaryService('heart_rate');
        const characteristic = await service.getCharacteristic('heart_rate_measurement');

        characteristic.addEventListener('characteristicvaluechanged', event => {
            const heartRate = parseHeartRateMeasurement(event.target.value);
            updateWearableMetric('hr', heartRate, { unit: 'lpm' });
        });

        await characteristic.startNotifications();
    }

    async readBatteryLevel() {
        const service = await this.server.getPrimaryService('battery_service');
        const characteristic = await service.getCharacteristic('battery_level');
        const value = await characteristic.readValue();

        updateWearableMetric('battery', value.getUint8(0), { unit: '%' });
    }

    disconnect() {
        if (this.device?.gatt?.connected) {
            this.device.gatt.disconnect();
        } else {
            this.handleDisconnected();
        }
    }

    handleDisconnected() {
        saveWearableState({
            connected: false,
            source: readWearableState().metrics.hr?.real ? 'bluetooth' : 'demo'
        });
        this.onStatus?.('Reloj desconectado');
    }
}
