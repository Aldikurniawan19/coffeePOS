import { generateReceiptEscPos, generateTestReceiptEscPos } from './escpos.js';

// Common Bluetooth GATT Service UUIDs used by Thermal Receipt Printers
const PRINTER_BLUETOOTH_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard Printer Service
  '0000e025-0000-1000-8000-00805f9b34fb', // Thermal Printer Service
  '0000ff00-0000-1000-8000-00805f9b34fb', // Custom ESC/POS Service
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC SPP
  '00001101-0000-1000-8000-00805f9b34fb'  // Serial Port Profile
];

class PrinterService {
  constructor() {
    this.connectionType = null; // 'bluetooth' | 'usb' | null
    this.device = null; // BluetoothDevice or USBDevice
    this.gattServer = null;
    this.btCharacteristic = null;
    this.usbEndpoint = null;
    this.usbInterfaceNumber = null;
    
    this.listeners = new Set();

    // Default settings
    this.autoPrintEnabled = true;
    this.paperWidth = '58mm'; // '58mm' | '80mm'
    this.deviceName = '';

    this.initFromStorage();
    this.setupListeners();
  }

  // Check browser API support
  isBluetoothSupported() {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  isUsbSupported() {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'usb' in navigator;
  }

  // Load preferences from localStorage
  initFromStorage() {
    if (typeof window === 'undefined') return;
    const storedAutoPrint = localStorage.getItem('coffeepos_auto_print') || localStorage.getItem('barberpos_auto_print');
    if (storedAutoPrint !== null) {
      this.autoPrintEnabled = storedAutoPrint === 'true';
    }

    const storedPaperWidth = localStorage.getItem('coffeepos_paper_width') || localStorage.getItem('barberpos_paper_width');
    if (storedPaperWidth) {
      this.paperWidth = storedPaperWidth;
    }

    const storedDeviceName = localStorage.getItem('coffeepos_printer_name') || localStorage.getItem('barberpos_printer_name');
    if (storedDeviceName) {
      this.deviceName = storedDeviceName;
    }

    const storedType = localStorage.getItem('coffeepos_printer_type') || localStorage.getItem('barberpos_printer_type');
    if (storedType) {
      this.connectionType = storedType;
    }

    // Try auto-reconnect USB if supported
    if (storedType === 'usb' && this.isUsbSupported()) {
      setTimeout(() => this.autoReconnectUsb(), 500);
    }
  }

  saveStorage() {
    if (typeof window === 'undefined') return;
    localStorage.setItem('coffeepos_auto_print', String(this.autoPrintEnabled));
    localStorage.setItem('coffeepos_paper_width', this.paperWidth);
    localStorage.setItem('coffeepos_printer_name', this.deviceName);
    localStorage.setItem('coffeepos_printer_type', this.connectionType || '');
  }

  // Event listener subscription for UI components
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.getStatus()));
  }

  getStatus() {
    return {
      isConnected: Boolean(this.device && (this.gattServer?.connected || this.device.opened)),
      connectionType: this.connectionType,
      deviceName: this.deviceName || (this.device?.name || 'Printer Thermal'),
      autoPrintEnabled: this.autoPrintEnabled,
      paperWidth: this.paperWidth,
    };
  }

  setAutoPrint(enabled) {
    this.autoPrintEnabled = Boolean(enabled);
    this.saveStorage();
    this.notify();
  }

  setPaperWidth(width) {
    this.paperWidth = width;
    this.saveStorage();
    this.notify();
  }

  setupListeners() {
    if (typeof window === 'undefined') return;

    if (this.isUsbSupported()) {
      navigator.usb.addEventListener('disconnect', (event) => {
        if (event.device === this.device) {
          this.disconnect('USB terputus');
        }
      });
    }
  }

  // --- WEB BLUETOOTH INTEGRATION ---
  async connectBluetooth() {
    if (!this.isBluetoothSupported()) {
      throw new Error("Web Bluetooth API tidak didukung di browser ini. Gunakan Google Chrome Android.");
    }

    // Request Bluetooth device with all printers filters / acceptAllDevices
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: PRINTER_BLUETOOTH_SERVICES
    });

    if (!device) {
      throw new Error("Perangkat Bluetooth tidak dipilih.");
    }

    // Add disconnect handler
    device.addEventListener('gattserverdisconnected', () => {
      this.disconnect('Bluetooth terputus');
    });

    const server = await device.gatt.connect();
    
    // Find primary service and writable characteristic
    let characteristic = null;
    let services = [];

    try {
      services = await server.getPrimaryServices();
    } catch (e) {
      console.warn("Could not get all primary services, trying standard list:", e);
    }

    // Try finding characteristic in available services
    for (const service of services) {
      try {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            characteristic = char;
            break;
          }
        }
      } catch (err) {
        // continue
      }
      if (characteristic) break;
    }

    // Fallback: search known printer services directly
    if (!characteristic) {
      for (const serviceUuid of PRINTER_BLUETOOTH_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          const chars = await service.getCharacteristics();
          for (const c of chars) {
            if (c.properties.write || c.properties.writeWithoutResponse) {
              characteristic = c;
              break;
            }
          }
        } catch (e) {
          // ignore service not found
        }
        if (characteristic) break;
      }
    }

    if (!characteristic) {
      server.disconnect();
      throw new Error("Karakteristik penulisan (Write) tidak ditemukan pada printer Bluetooth ini.");
    }

    this.device = device;
    this.gattServer = server;
    this.btCharacteristic = characteristic;
    this.connectionType = 'bluetooth';
    this.deviceName = device.name || 'Printer Bluetooth';
    this.saveStorage();
    this.notify();

    return this.getStatus();
  }

  // --- WEBUSB INTEGRATION ---
  async connectUsb() {
    if (!this.isUsbSupported()) {
      throw new Error("WebUSB API tidak didukung di browser ini. Gunakan Google Chrome PC.");
    }

    const device = await navigator.usb.requestDevice({ filters: [] });
    if (!device) {
      throw new Error("Perangkat USB tidak dipilih.");
    }

    await this.setupUsbDevice(device);

    this.connectionType = 'usb';
    this.deviceName = device.productName || 'Printer USB Thermal';
    this.saveStorage();
    this.notify();

    return this.getStatus();
  }

  async setupUsbDevice(device) {
    await device.open();
    
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }

    // Find Printer Class interface (Class code 7) or fallback to first interface
    let iface = device.configuration.interfaces.find(i => 
      i.alternate.interfaceClass === 7
    ) || device.configuration.interfaces[0];

    if (!iface) {
      throw new Error("Interface USB tidak ditemukan pada printer.");
    }

    const interfaceNumber = iface.interfaceNumber;
    await device.claimInterface(interfaceNumber);

    // Find Bulk OUT endpoint
    const endpoint = iface.alternate.endpoints.find(e => e.direction === 'out');
    if (!endpoint) {
      throw new Error("Endpoint Bulk OUT tidak ditemukan pada printer USB ini.");
    }

    this.device = device;
    this.usbInterfaceNumber = interfaceNumber;
    this.usbEndpoint = endpoint.endpointNumber;
  }

  async autoReconnectUsb() {
    try {
      if (!this.isUsbSupported()) return;
      const devices = await navigator.usb.getDevices();
      if (devices.length > 0) {
        const device = devices[0];
        await this.setupUsbDevice(device);
        this.connectionType = 'usb';
        this.deviceName = device.productName || 'Printer USB Thermal';
        this.notify();
      }
    } catch (e) {
      console.warn("Auto reconnect USB failed:", e);
    }
  }

  // --- DISCONNECT ---
  async disconnect(reason = 'Terputus') {
    try {
      if (this.connectionType === 'bluetooth' && this.gattServer) {
        if (this.gattServer.connected) {
          this.gattServer.disconnect();
        }
      } else if (this.connectionType === 'usb' && this.device) {
        if (this.device.opened) {
          if (this.usbInterfaceNumber !== null) {
            await this.device.releaseInterface(this.usbInterfaceNumber);
          }
          await this.device.close();
        }
      }
    } catch (e) {
      console.warn("Disconnect error:", e);
    } finally {
      this.device = null;
      this.gattServer = null;
      this.btCharacteristic = null;
      this.usbEndpoint = null;
      this.usbInterfaceNumber = null;
      this.connectionType = null;
      this.notify();
    }
  }

  // --- SEND ESC/POS BYTES TO HARDWARE ---
  async sendBytes(bytes) {
    if (!this.getStatus().isConnected) {
      throw new Error("Printer tidak terhubung.");
    }

    if (this.connectionType === 'bluetooth' && this.btCharacteristic) {
      // Bluetooth GATT writes in chunks (max ~100 bytes per chunk)
      const chunkSize = 100;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        if (this.btCharacteristic.properties.write) {
          await this.btCharacteristic.writeValueWithResponse(chunk);
        } else {
          await this.btCharacteristic.writeValueWithoutResponse(chunk);
        }
        // Small delay between Bluetooth chunks
        await new Promise(res => setTimeout(res, 40));
      }
    } else if (this.connectionType === 'usb' && this.device && this.usbEndpoint) {
      // Send raw buffer via WebUSB bulk OUT transfer
      await this.device.transferOut(this.usbEndpoint, bytes);
    } else {
      throw new Error("Koneksi printer tidak aktif.");
    }
  }

  // --- PRINT FUNCTIONS ---
  async printReceipt(receiptData, shopInfo = {}) {
    const bytes = generateReceiptEscPos(receiptData, shopInfo, this.paperWidth);
    await this.sendBytes(bytes);
  }

  async testPrint(shopInfo = {}) {
    const bytes = generateTestReceiptEscPos(shopInfo, this.paperWidth);
    await this.sendBytes(bytes);
  }
}

// Singleton instance
export const printerService = new PrinterService();
