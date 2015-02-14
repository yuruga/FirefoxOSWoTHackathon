(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var CONFIG = require('./Config').CONFIG;
var BleService = require('./BleService').BleService;
var CSC = (function () {
  var CSC = function CSC() {
    console.log(this.init);
    console.log("const");
    this.init();
  };

  CSC.prototype.init = function () {
    this.ble = new BleService();

    this.ble.addEventListener(BleService.Event_ON_CLIENT_READY, this.onBleClientReady, this);
    this.ble.start();
  };

  CSC.prototype.onBleClientReady = function () {
    console.log("onBleClientReady");
    this.ble.addEventListener(BleService.Event_ON_DEVICE_FOUND, this.onScanDevices, this);
    this.ble.scanDevices();
  };

  CSC.prototype.onScanDevices = function (device) {
    console.log("onDeviceFound", device);
    if (CONFIG.CSC_BD_ADRESS === device.address) {
      this.ble.stopScanDevices();
      this.ble.addEventListener(BleService.Event_ON_SERVICE_FOUND, this.onServiceFound, this);
      this.ble.connectDevice(device);
    }
  };

  CSC.prototype.onServiceFound = function (serviceId) {
    console.log("onServiceFound", serviceId);
    if (CONFIG.CSC_SERVICE_ID === serviceId.uuid) {
      this.ble.addEventListener(BleService.Event_ON_CHARACTERISTIC_FOUND, this.onCharactoristicFound, this);
      this.ble.selectService(serviceId);
    }
  };

  CSC.prototype.onCharactoristicFound = function (charId) {
    console.log("onCharactoristcFound", charId);
    if (CONFIG.CSC_MEASUREMENT_CHARACTERISCTIC_ID === charId.uuid) {
      this.ble.addEventListener(BleService.Event_ON_DESCRIPTOR_FOUND, this.onDescripterFound, this);
      this.ble.selectCharacteristic(charId);
    }
  };

  CSC.prototype.onDescripterFound = function (descId) {
    console.log("onDescripterFound", descId.uuid);
    if (CONFIG.CCCD_ID === descId) {
      this.ble.addEventListener(BleService.Event_ON_DESCRIPTER_WROTE, this.onDescripterWrote, this);
      this.ble.addEventListener(BleService.Event_ON_REGISTER_NOTIFY, this.onRegisterNotify, this);
      this.ble.writeDescripter(descId, "0100", 4);
      this.ble.registerNotify();
    }
  };

  CSC.prototype.onDescripterWrote = function (success) {
    this.isNotifyEnabled = true;
    this.onTryNotifyEnabled();
  };

  CSC.prototype.onRegisterNotify = function (success) {
    this.isNOtifiRegistered = true;
    this.onTryNotifyEnabled();
  };

  CSC.prototype.onTryNotifyEnabled = function () {
    if (this.isNOtifiRegistered && this.isNotifyEnabled) {
      this.ble.addEventListener(BleService.Event_ON_NOTIFY, this.onNotify, this);
    }
  };

  CSC.prototype.onNotify = function (value) {
    console.log(value);
    //this.sync.send(value);
  };

  CSC.prototype.onUnregisterNOtify = function (success) {};

  return CSC;
})();

new CSC();
},{"./BleService":3,"./Config":4}],2:[function(require,module,exports){
"use strict";

var BleGattClientControl = (function () {
  var BleGattClientControl = function BleGattClientControl() {};

  BleGattClientControl.getInstance = function () {
    if (!this.sInstance) {
      this.sInstance = new BleGattClientControlInstance();
    }
    return this.sInstance;
  };

  return BleGattClientControl;
})();

exports.BleGattClientControl = BleGattClientControl;
var BleGattClientControlInstance = (function () {
  var BleGattClientControlInstance = function BleGattClientControlInstance() {
    this.mBluetoothManager = navigator.mozBluetooth;
    this.mBleGatt = navigator.owbBle;
    this.mSettingManager = navigator.mozSettings;
  };

  BleGattClientControlInstance.prototype.getBluetooth = function () {
    return this.mBluetoothManager;
  };

  BleGattClientControlInstance.prototype.getBleGatt = function () {
    return this.mBleGatt;
  };

  BleGattClientControlInstance.prototype.getSetting = function () {
    return this.mSettingManager;
  };

  return BleGattClientControlInstance;
})();
},{}],3:[function(require,module,exports){
"use strict";

var _slice = Array.prototype.slice;
var BleGattClientControl = require('./BleGattClientControl').BleGattClientControl;
var BleService = (function () {
  var BleService = function BleService() {
    var _this = this;
    this.REGISTER_UUID = "";


    var bleControl = BleGattClientControl.getInstance();

    this.bluetoothManager = bleControl.getBluetooth();
    this.bleManager = bleControl.getBleGatt();
    this.settingManager = bleControl.getSetting();
    //if owb
    if (!this.bluetoothManager) {
      throw new Error("ble not supported!");
      return;
    }

    this.searchTimer = undefined;
    this.scaning = false;
    this.defaultAdapter = null;
    this.service_scaning = false;
    this.rssi_timer = undefined;

    this._devices = [];
    this._services = [];
    this._descriptors = [];
    this._characteristics = [];
    this._listeners = {};


    this.client_if;
    this.server_if;
    this.bd_addr;

    this.regist_uuid;
    this.conn_id;

    this.select_srvc_id;
    this.select_char_id;
    this.select_descr_id;

    this.start_incl_srvc_id = {
      uuid: "",
      inst_id: ""
    };
    this.start_char_id = {
      uuid: "",
      inst_id: "",
      is_primary: ""
    };
    this.start_descr_id = {
      uuid: "",
      inst_id: ""
    };

    this.auth_req = 0;
    this.write_type = 2;
    this.front_page = -1;
    this.isnotify = false;
    this.des_value = null;

    this.bluetoothManager.onenabled = this._registerCallback;
    this.bluetoothManager.ondisabled = function () {
      console.log("bluetooth disabled");
      _this.defaultAdapter = null;
    };
  };

  BleService.prototype.start = function () {
    var _this2 = this;
    console.log("ssss");
    var req = this.settingManager.createLock().get("bluetooth.enabled");
    req.onsuccess = function () {
      var enabled = req.result["bluetooth.enabled"];
      console.log("bluetooth enabled:" + enabled);
      if (enabled) {
        _this2._registerCallback();
      } else {
        alert("Bluetooth will be opened");
        _this2.settingManager.createLock().set({
          "bluetooth.enabled": true
        });
      }
    };
  };

  BleService.prototype._registerCallback = function () {
    var _this3 = this;
    console.log("registerCallback");
    this.defaultAdapter = null;
    var req = this.bluetoothManager.getDefaultAdapter();
    req.onsuccess = function () {
      _this3.defaultAdapter = req.result;
      if (_this3.defaultAdapter != null) {
        console.log("defaultAdapter:" + _this3.defaultAdapter.name);
        _this3.defaultAdapter.onregisterclient = function (event) {
          _this3._onRegisterClient(event);
        };
        _this3.defaultAdapter.onscanresult = function (event) {
          _this3._onScanResult(event);
        };
        _this3.defaultAdapter.onconnectble = function (event) {
          _this3._onConnectble(event);
        };
        _this3.defaultAdapter.ondisconnectble = function (event) {
          _this3._onDisconnectble(event);
        };
        _this3.defaultAdapter.onsearchcomplete = function (event) {
          _this3._onSearchComplete(event);
        };
        _this3.defaultAdapter.onsearchresult = function (event) {
          _this3._onSearchResult(event);
        };
        _this3.defaultAdapter.ongetcharacteristic = function (event) {
          _this3._onGetCharacteristics(event);
        };
        _this3.defaultAdapter.ongetdescriptor = function (event) {
          _this3._onGetDescriptor(event);
        };
        _this3.defaultAdapter.ongetIncludedservice = function (event) {
          _this3._onGetIncludedService(event);
        };
        _this3.defaultAdapter.onregisterfornotification = function (event) {
          _this3._onRegisterforNotification(event);
        };
        _this3.defaultAdapter.onnotify = function (event) {
          _this3._onNotify(event);
        };
        _this3.defaultAdapter.onreadcharacteristic = function (event) {
          _this3._onReadCharacteristic(event);
        };
        _this3.defaultAdapter.onwritecharacteristic = function (event) {
          _this3._onWriteCharacteristic(event);
        };
        _this3.defaultAdapter.onreaddescriptor = function (event) {
          _this3._onReadDescriptor(event);
        };
        _this3.defaultAdapter.onwritedescriptor = function (event) {
          _this3._onWriteDescriptor(event);
        };
        _this3.defaultAdapter.onexecuteWrite = function (event) {
          _this3._onExecutWrite(event);
        };
        _this3.defaultAdapter.onreadremoterssi = function (event) {
          _this3._onReadRemoterssi(event);
        };
        _this3.defaultAdapter.onblelisten = function (event) {
          _this3._onBleListen(event);
        };

        if (_this3.bleManager) {
          _this3.bleManager.registerClient(_this3.REGISTER_UUID);
        }
      } else {
        console.log("bluetooth adapter is null");
      }
    };
    req.onerror = function () {
      console.log("Can not get bluetooth adapter!");
    };
  };

  BleService.prototype.addEventListener = function (eventType, func, scope) {
    console.log(eventType, func);
    if (!this._listeners[eventType]) {
      this._listeners[eventType] = [];
    }
    this._listeners[eventType].push({ func: func, scope: scope });
  };

  BleService.prototype.performListenerFunction = function (eventType) {
    var args = _slice.call(arguments, 1);

    var l = this._listeners[eventType].length;
    for (var i = 0; i < l; i++) //( var listener in this._listeners[eventType])
    {
      var listener = this._listeners[eventType][i];
      listener.func.apply(listener.scope, args);
    }
  };

  BleService.prototype.scanDevices = function (deviceFoundCallback) {
    var _this4 = this;
    console.log("scanDevices");
    this.deviceFoundCallback = deviceFoundCallback;
    if (this.scaning) {
      console.log("aaaa");
      return;
    }

    //showSearching(true);
    //$("#device_list li").remove();
    this.scaning = true;
    this.bleManager.scanLEDevice(this.client_if, true);
    this.searchTimer = setTimeout(function () {
      console.log("hhh", _this4.bleManager);
      _this4.bleManager.scanLEDevice(_this4.client_if, false);
      clearTimeout(_this4.searchTimer);
      _this4.searchTimer = undefined;
      _this4.scaning = false;
      //showSearching(false);
    }, 10000);
  };

  BleService.prototype.stopScanDevices = function () {
    this.scaning = false;
  };

  BleService.prototype.getDevices = function () {
    return this._devices;
  };

  BleService.prototype.getServices = function () {
    return this._services;
  };

  BleService.prototype.getCharacteristics = function () {
    return this._characteristics;
  };

  BleService.prototype.getDescriptors = function () {
    return this._descriptors;
  };

  BleService.prototype.connectDevice = function (device) {
    this.bleManager.connectBle(this.client_if, device.address, true);
    this.bd_addr = device.address;
  };

  BleService.prototype.selectService = function (serviceId) {
    this.select_srvc_id = serviceId;
    this.bleManager.getIncludeService(this.conn_id, this.select_srvc_id, this.start_incl_srvc_id);
    this.start_char_id = {
      uuid: "",
      inst_id: "",
      is_primary: ""
    };
    this.bleManager.getCharacteristic(this.conn_id, this.select_srvc_id, this.start_char_id);
  };

  BleService.prototype.selectCharacteristic = function (carId) {
    this.select_char_id = charId;
    this.start_descr_id = {
      uuid: "",
      inst_id: ""
    };
    bleManager.getDescriptor(this.conn_id, this.select_srvc_id, this.select_char_id, this.start_descr_id);
    bleManager.readCharacteristic(this.conn_id, this.select_srvc_id, this.select_char_id, this.auth_req);
  };

  BleService.prototype.readCharacteristics = function (charId) {};

  BleService.prototype.writeCharacteristics = function (charId, value) {};

  BleService.prototype.readDescriptor = function (descriptorId) {
    this.select_descr_id = descriptorId;
    bleManager.readDescriptor(this.conn_id, this.select_srvc_id, this.select_char_id, this.select_descr_id, this.auth_req);
  };

  BleService.prototype.writeDescriptor = function (descriptorId, value, length) {
    this.select_descr_id = descriptorId;
    Log.d(value + ":" + length, encodeURIComponent(v));
    bleManager.writeDescriptor(this.conn_id, this.select_srvc_id, this.select_char_id, this.select_descr_id, 2, length, 0, value);
  };

  BleService.prototype.registerNotify = function () {
    this.isnotify = true;
    this.bleManager.registerForNotification(this.client_if, this.bd_addr, this.select_srvc_id, this.select_char_id);
  };

  BleService.prototype.unregisterNotify = function () {
    this.isnotify = false;
    this.bleManager.deregisterForNotification(this.client_if, this.bd_addr, this.select_srvc_id, this.select_char_id);
  };

  BleService.prototype._onRegisterClient = function (event) {
    console.log("register status:" + event.status);
    console.log("register client_if:" + event.client_if);
    console.log("register uuid:" + event.uuid);
    if (event.status == 0) {
      this.regist_uuid = event.uuid;
      this.client_if = event.client_if;
      // 登録成功！
      this.performListenerFunction(BleService.Event_ON_CLIENT_READY);
    }
  };

  BleService.prototype._onScanResult = function (event) {
    console.log("onScanResult:" + event.bda);
    var device = {
      name: event.adv_data,
      address: event.bda,
      rssi: event.rssi,
      type: event.device_type
    };
    this._addDevice(device);
    //callback
    this.performListenerFunction(BleService.Event_ON_DEVICE_FOUND, device);
  };

  BleService.prototype._onConnectBle = function (event) {
    var _this5 = this;
    console.log("connectble status:" + event.status);
    console.log("connectble conn_id:" + event.conn_id);
    if (event.status === 0) {
      //$('#connect_state').html('SearchService...');
      this.conn_id = event.conn_id;
      //$("#service_list li").remove();
      this.service_scaning = true;
      this.bleManager.searchService(conn_id, "");
      if (!this.rssi_timer) {
        this.rssi_timer = setInterval(function () {
          bleManager.readRemoteRssi(_this5.client_if, _this5.bd_addr);
        }, 5000);
      }
      this.performListenerFunction(BleService.Event_ON_DEVICE_CONNECTED);
    }
  };

  BleService.prototype._onDisconnectBle = function (event) {
    console.log("disconnectble status:" + event.status);
    if (event.status == 0) {
      clearInterval(rssi_timer);
      this.rssi_timer = undefined;
      this.conn_id = undefined;
      this.performListenerFunction(BleService.Event_ON_DEVICE_DISCONNECTED);
    }
  };

  BleService.prototype._onSearchComplete = function (event) {
    console.log("onSearchComplete status:" + event.status);
    this.service_scaning = false;
  };

  BleService.prototype._onSearchResult = function (event) {
    console.log("onSearchResult:" + event);
    console.log("srvc_id_id_uuid:" + event.srvc_id_id_uuid);
    console.log("srvc_id_id_inst_id:" + event.srvc_id_id_inst_id);
    console.log("srvc_id_is_primary:" + event.srvc_id_is_primary);
    var srvc_id = {
      uuid: event.srvc_id_id_uuid,
      inst_id: event.srvc_id_id_inst_id,
      is_primary: event.srvc_id_is_primary
    };
    this._addService(srvc_id);
    this.performListenerFunction(BleService.Event_ON_SERVICE_FOUND, srvc_id);
  };

  BleService.prototype._onGetCharacteristics = function (event) {
    console.log("onGetCharacteristic:" + event);
    console.log("state:" + event.status);
    console.log("char_id_uuid:" + event.char_id_uuid);
    console.log("char_id_inst_id:" + event.char_id_inst_id);
    console.log("char_prop:" + event.char_prop);

    var char_id = {
      uuid: event.char_id_uuid,
      inst_id: event.char_id_inst_id
    };

    var characteristic = {
      uuid: event.char_id_uuid,
      inst_id: event.char_id_inst_id,
      prop: event.char_prop
    };
    this._addCharacteristic(characteristic, char_id);
    this.performListenerFunction(BleService.Event_ON_CHARACTORISTIC_FOUND, characteristic);
  };

  BleService.prototype._onGetDiscriptor = function (event) {
    console.log("descr_status:" + event.status);
    console.log("descr_id_uuid:" + event.descr_id_uuid);
    console.log("descr_id_inst_id:" + event.descr_id_inst_id);
    if (event.status != 0) {
      return;
    }
    var descr_id = {
      uuid: event.descr_id_uuid,
      inst_id: event.descr_id_inst_id
    };
    this._addDescriptor(descr_id);
    this.performListenerFunction(BleService.Event_ON_DESCRIPTOR_FOUND, descr_id);
  };

  BleService.prototype._onGetIncludedService = function (event) {
    console.log("onGetIncludedService:" + event);
    console.log("incl_srvc_id_id_uuid:" + event.incl_srvc_id_id_uuid);
    console.log("incl_srvc_id_id_inst_id:" + event.incl_srvc_id_id_inst_id);
    console.log("incl_srvc_id_is_primary:" + event.incl_srvc_id_is_primary);
    /*var incl_srvc_id = {
        uuid: event.incl_srvc_id_id_uuid,
        inst_id: event.incl_srvc_id_id_inst_id,
        is_primary: event.incl_srvc_id_is_primary
    };
    this._addIncleService(incl_srvc_id);
    this.performListenerFunction(BleService.Event_ON_SERVICE_FOUND, this.getInclServices());*/
  };

  BleService.prototype._onNotify = function (event) {
    console.log("onNotify value:" + event.value);
    console.log("onNotify bda:" + event.bda);
    console.log("onNotify srvc_id_id_uuid:" + event.srvc_id_id_uuid);
    console.log("onNotify srvc_id_id_inst_id:" + event.srvc_id_id_inst_id);
    console.log("onNotify srvc_id_is_primary:" + event.srvc_id_is_primary);
    console.log("onNotify char_id_uuid:" + event.char_id_uuid);
    console.log("onNotify char_id_inst_id:" + event.char_id_inst_id);
    console.log("onNotify len:" + event.len);
    console.log("onNotify is_notify:" + event.is_notify);
    this.performListenerFunction(BleService.Event_ON_NOTIFY, event.value);
  };

  BleService.prototype._onReadCharacteristic = function (event) {
    console.log("onReadCharacteristic status:" + event.status);
    console.log("onReadCharacteristic value:" + event.value);
    console.log("value_type:" + event.value_type);
    var value = event.value;
    this.performListenerFunction(BleService.Event_ON_READ_CHARACTERISTIC, value);
  };

  BleService.prototype._onWriteCharacteristic = function (event) {
    console.log("onWriteCharacteristic status:" + event.status);
    this.bleManager.executeWrite(this.conn_id, 0);
  };

  BleService.prototype._onReadDescriptor = function (event) {
    console.log("onReadDescriptor:" + event.value);
    this.des_value = event.value;
    console.log("start writeDescriptor  select_srvc_id ::" + " : " + select_srvc_id.uuid);
    console.log("start writeDescriptor  select_char_id ::" + " : " + select_char_id.uuid);
    console.log("start writeDescriptor  select_descr_id::" + " : " + select_descr_id.uuid);
    //$('#des_read_data').html(des_value);
  };

  BleService.prototype._onWriteDescriptor = function (event) {
    console.log("onWriteDescriptor status:" + event.status);
    this.performListenerFunction(BleService.Event_ON_DESCRIPTER_WROTE, (event.status == 0) ? true : false);
    this.bleManager.executeWrite(this.conn_id, 0);
  };

  BleService.prototype._onExecutWrite = function (event) {
    console.log("onExecutWrite status:" + event.status);
  };

  BleService.prototype._onReadRemoterssi = function (event) {};

  BleService.prototype._onBleListen = function (event) {
    console.log("onBleListen:" + event.status);
    console.log("onBleListen:" + event.server_if);
    server_if = event.server_if;
  };

  BleService.prototype._onRegisterforNotification = function (event) {
    console.log("onRegisterforNotification registered:" + event.registered);
    this.performListenerFunction(BleService.Event_ON_REGISTER_NOTIFY, (event.registered == 1) ? true : false);
  };

  BleService.prototype._addDevice = function (device) {
    this._devices.push(device);
  };

  BleService.prototype._addService = function (service) {
    this._services.push(service);
  };

  BleService.prototype._addCharacteristic = function (characteristic) {
    if (this.start_char_id && this.start_char_id.uuid == this.char_id.uuid) {
      return;
    }
    this._characteristics.push(characteristic);
    this.start_char_id = this.char_id;
    this.bleManager.getCharacteristic(this.conn_id, this.select_srvc_id, this.char_id);
  };

  BleService.prototype._addDescriptor = function (descriptor) {
    if (this.start_descr_id && this.start_descr_id.uuid == descriptor.uuid) {
      return;
    }
    this._descriptors.push(descriptor);
    this.start_descr_id = descriptor;
    bleManager.getDescriptor(this.conn_id, this.select_srvc_id, this.select_char_id, this.start_descr_id);
  };

  return BleService;
})();

exports.BleService = BleService;
BleService.Event_ON_CLIENT_READY = "onClientReady";
BleService.Event_ON_DEVICE_CONNECTED = "onDeviceConnected";
BleService.Event_ON_DEVICE_FOUND = "onDeviceFound";
BleService.Event_ON_SERVICE_FOUND = "onServiceFound";
BleService.Event_ON_CHARACTERISTIC_FOUND = "onCharacteristicFound";
BleService.Event_ON_DESCRIPTOR_FOUND = "onDescriptorFound";
BleService.Event_ON_REGISTER_NOTIFY = "onRegisterNotify";
BleService.Event_ON_DESCRIPTER_WROTE = "onDescriptorWrote";
BleService.Event_ON_READ_CHARACTERISTIC = "onReadCgaracteristic";
BleService.Event_ON_NOTIFY = "onNotify";
},{"./BleGattClientControl":2}],4:[function(require,module,exports){
"use strict";

var CONFIG = exports.CONFIG = {
  API: "/api/csc",
  SIG_PREFIX: "0000",
  SIG_SURFIX: "-0000-1000-8000-00805f9b34fb",
  CSC_SERVICE_ID: "00001816-0000-1000-8000-00805f9b34fb",
  CSC_MEASUREMENT_CHARACTERISCTIC_ID: "00002a5b-0000-1000-8000-00805f9b34fb",
  CCCD_ID: "00002902-0000-1000-8000-00805f9b34fb",
  CSC_BD_ADRESS: "84:dd:20:ec:b1:ef"
};
},{}]},{},[1]);
