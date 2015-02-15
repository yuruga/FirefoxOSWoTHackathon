import {BleGattClientControl} from './BleGattClientControl';

export class BleService{
  constructor(){
    this.REGISTER_UUID = "";


    let bleControl = BleGattClientControl.getInstance();

    this.bluetoothManager = bleControl.getBluetooth();
    this.bleManager = bleControl.getBleGatt();
    this.settingManager = bleControl.getSetting();
    //if owb
    if(!this.bluetoothManager)
    {
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
    this.bluetoothManager.ondisabled = ()=>{
        console.log("bluetooth disabled");
        this.defaultAdapter = null;
    };
  }

  start(){
    let req = this.settingManager.createLock().get('bluetooth.enabled');
    req.onsuccess = ()=>{
        var enabled = req.result['bluetooth.enabled'];
        console.log("bluetooth enabled:" + enabled);
        if (enabled) {
            this._registerCallback();
        } else {
            alert("Bluetooth will be opened");
            this.settingManager.createLock().set({
                'bluetooth.enabled': true
            });
        }
    };
  }


  //　コールバック登録
  _registerCallback(){
    console.log("registerCallback");
    this.defaultAdapter = null;
    let req = this.bluetoothManager.getDefaultAdapter();
    req.onsuccess = ()=>{
        this.defaultAdapter = req.result;
        if (this.defaultAdapter != null) {
            console.log("defaultAdapter:" + this.defaultAdapter.name);
            this.defaultAdapter.onregisterclient = (event)=>{this._onRegisterClient(event)};
            this.defaultAdapter.onscanresult = (event)=>{this._onScanResult(event)};
            this.defaultAdapter.onconnectble = (event)=>{this._onConnectBle(event)};
            this.defaultAdapter.ondisconnectble = (event)=>{this._onDisconnectBle(event)};
            this.defaultAdapter.onsearchcomplete = (event)=>{this._onSearchComplete(event)};
            this.defaultAdapter.onsearchresult = (event)=>{this._onSearchResult(event)};
            this.defaultAdapter.ongetcharacteristic = (event)=>{this._onGetCharacteristics(event)};
            this.defaultAdapter.ongetdescriptor = (event)=>{this._onGetDescriptor(event)};
            this.defaultAdapter.ongetIncludedservice = (event)=>{this._onGetIncludedService(event)};
            this.defaultAdapter.onregisterfornotification = (event)=>{this._onRegisterforNotification(event)};
            this.defaultAdapter.onnotify = (event)=>{this._onNotify(event)};
            this.defaultAdapter.onreadcharacteristic = (event)=>{this._onReadCharacteristic(event)};
            this.defaultAdapter.onwritecharacteristic = (event)=>{this._onWriteCharacteristic(event)};
            this.defaultAdapter.onreaddescriptor = (event)=>{this._onReadDescriptor(event)};
            this.defaultAdapter.onwritedescriptor = (event)=>{this._onWriteDescriptor(event)};
            this.defaultAdapter.onexecuteWrite = (event)=>{this._onExecutWrite(event)};
            this.defaultAdapter.onreadremoterssi = (event)=>{this._onReadRemoterssi(event)};
            this.defaultAdapter.onblelisten = (event)=>{this._onBleListen(event)};

            if (this.bleManager) {
                this.bleManager.registerClient(this.REGISTER_UUID);
            }
        } else {
            console.log('bluetooth adapter is null');
        }
    };
    req.onerror = ()=>{
        console.log('Can not get bluetooth adapter!');
    };
  }

  addEventListener(eventType, func, scope){
    if(!this._listeners[eventType])
    {
      this._listeners[eventType] = [];
    }
    this._listeners[eventType].push({func:func, scope:scope});
  }

  performListenerFunction(eventType, ...args){
    console.log("etype "+ eventType);
    if(!this._listeners[eventType]){
      console.log("NO Listener")
      return;
    }
    var l = this._listeners[eventType].length;

    for(var i = 0 ;i<l; i++)//( var listener in this._listeners[eventType])
    {
      var listener = this._listeners[eventType][i];
      if(!listener['func'])
      {
        break;
      }
      listener.func.apply(listener.scope, args);
    }
  }

  //　デバイススキャン
  scanDevices(deviceFoundCallback){
    console.log("scanDevices");
    this.deviceFoundCallback = deviceFoundCallback;
    if (this.scaning) {
            return;
        }

        //showSearching(true);
        //$("#device_list li").remove();
        this.scaning = true;
        this.bleManager.scanLEDevice(this.client_if, true);
        this.searchTimer = setTimeout(()=>{
            this.bleManager.scanLEDevice(this.client_if, false);
            clearTimeout(this.searchTimer);
            this.searchTimer = undefined;
            this.scaning = false;
            //showSearching(false);

        }, 10000);
  }

  //stop scanning devices
  stopScanDevices(){
    this.scaning = false;
  }

  stopScanServices(){
    this.scanService = false;
  }

  stopScanCharacteristic(){
    this.scanCharacteristic = false;
  }

  //デバイスID取得
  getDevices(){
    return this._devices;
  }
  getServices(){
    return this._services;
  }
  getCharacteristics(){
    return this._characteristics;
  }
  getDescriptors(){
    return this._descriptors;
  }

  //　serviceを検索
  /*searchServices(){
    this.service_scaning = true;
    this.bleManager.searchService(this.conn_id, '');
  }*/


  connectDevice(device){
    console.log("conn");
    this.bleManager.connectBle(this.client_if, device.address, true);
    this.bd_addr = device.address;
  }

  selectService(serviceId){
    console.log("selectService");
    this.select_srvc_id = serviceId;
    this.bleManager.getIncludeService(this.conn_id, this.select_srvc_id, this.start_incl_srvc_id);
    this.start_char_id = {
        uuid: "",
        inst_id: "",
        is_primary: ""
    };
    this.bleManager.getCharacteristic(this.conn_id, this.select_srvc_id, this.start_char_id);
  }

  selectCharacteristic(charId){
    console.log("selectCCCC");
    this.select_char_id = charId;
    this.start_descr_id = {
        uuid: "",
        inst_id: ""
    };
    this.bleManager.getDescriptor(this.conn_id, this.select_srvc_id, this.select_char_id, this.start_descr_id);
    //this.bleManager.readCharacteristic(this.conn_id, this.select_srvc_id, this.select_char_id, this.auth_req);

  }



  //　write characteristics
  writeCharacteristics(charId, value){

  }

  //　read descriptor
  readDescriptor(descriptorId){
    console.log("rrrrrrrrrrrrrr")
    this.select_descr_id = descriptorId;
    this.bleManager.readDescriptor(this.conn_id, this.select_srvc_id, this.select_char_id, this.select_descr_id, this.auth_req);
  }

  //　write descriptor
  writeDescriptor( value, length){

    //this.select_descr_id = descriptorId;
    console.log("wwwwwwwwwwwwwwwwwwwwwwwwwwwwww",this.select_descr_id);
    //this.bleManager.writeDescriptor(this.conn_id, this.select_srvc_id, this.select_char_id, this.select_descr_id, 2, length, 0, value);
    this.isnotify = true;
    var v ="0100"//decodeURI("%00")+decodeURI("%01");
    var len = 4;
    var wt = 2;
    //this.bleManager.registerForNotification(client_if, bd_addr, select_srvc_id, select_char_id);
    this.bleManager.writeDescriptor(this.conn_id, this.select_srvc_id, this.select_char_id, this.select_descr_id, wt, len, 0, v);

  }

  registerNotify(){
    console.log("nnnnnnnnnnnnnnnnnnnnnnnn")
    this.isnotify = true;
    this.bleManager.registerForNotification(this.client_if, this.bd_addr, this.select_srvc_id, this.select_char_id);
  }

  unregisterNotify(){
    this.isnotify = false;
    this.bleManager.deregisterForNotification(this.client_if, this.bd_addr, this.select_srvc_id, this.select_char_id);
  }



  //　onRegisterClient
  _onRegisterClient(event){
    console.log("register status:" + event.status);
    console.log("register client_if:" + event.client_if);
    console.log("register uuid:" + event.uuid);
    if (event.status == 0) {
      this.regist_uuid = event.uuid;
      this.client_if = event.client_if;
      // 登録成功！
      this.performListenerFunction(BleService.Event_ON_CLIENT_READY);
    }
  }

  //スキャン結果
  _onScanResult(event){
    console.log("onScanResult:" + event.bda);
    let device = {
        name : event.adv_data,
        address : event.bda,
        rssi : event.rssi,
        type : event.device_type
    };
    this._addDevice(device);
    //callback
    this.performListenerFunction(BleService.Event_ON_DEVICE_FOUND, device);
  }

  // BLEと接続
  _onConnectBle(event){
    console.log("connectble status:" + event.status);
    console.log("connectble conn_id:" + event.conn_id);
    if (event.status == 0) {
        this.conn_id = event.conn_id;
        this.service_scaning = true;
        this.bleManager.searchService(this.conn_id, '');
        if (!this.rssi_timer) {
            this.rssi_timer = setInterval(()=>{
                this.bleManager.readRemoteRssi(this.client_if, this.bd_addr);
            }, 5000);
        }
        this.performListenerFunction(BleService.Event_ON_DEVICE_CONNECTED);
    }
  }

  // BLEと切断
  _onDisconnectBle(event){
    console.log("disconnectble status:" + event.status);
    if (event.status == 0) {
        clearInterval(this.rssi_timer);
        this.rssi_timer = undefined;
        this.conn_id = undefined;
        this.performListenerFunction(BleService.Event_ON_DEVICE_DISCONNECTED);
    }
  }

  //
  _onSearchComplete(event){
    console.log("onSearchComplete status:" + event.status);
        this.service_scaning = false;
  }

  //
  _onSearchResult(event){
    console.log("onSearchResult:" + event);
    console.log("srvc_id_id_uuid:" + event.srvc_id_id_uuid);
    /*console.log("srvc_id_id_inst_id:" + event.srvc_id_id_inst_id);
    console.log("srvc_id_is_primary:" + event.srvc_id_is_primary);*/
    var srvc_id = {
        uuid: event.srvc_id_id_uuid,
        inst_id: event.srvc_id_id_inst_id,
        is_primary: event.srvc_id_is_primary
    };
    this._addService(srvc_id);
    this.performListenerFunction(BleService.Event_ON_SERVICE_FOUND, srvc_id);
  }

  //
  _onGetCharacteristics(event){
    console.log("onGetCharacteristic:" + event);
    console.log("state:" + event.status);
    /*console.log("char_id_uuid:" + event.char_id_uuid);
    console.log("char_id_inst_id:" + event.char_id_inst_id);
    console.log("char_prop:" + event.char_prop);*/

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
    this.performListenerFunction(BleService.Event_ON_CHARACTERISTIC_FOUND, characteristic);
  }

  //
  _onGetDescriptor(event){
    console.log("descr_status:" + event.status);
    console.log("descr_id_uuid:" + event.descr_id_uuid);
    //console.log("descr_id_inst_id:"  + event.descr_id_inst_id);
    if (event.status != 0) {
        return;
    }
    var descr_id = {
        uuid: event.descr_id_uuid,
        inst_id: event.descr_id_inst_id
    };
    this._addDescriptor(descr_id);
    this.performListenerFunction(BleService.Event_ON_DESCRIPTOR_FOUND, descr_id);
  }

  //
  _onGetIncludedService(event){
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
  }

  //
  _onNotify(event) {
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
    }

    _onReadCharacteristic(event) {
      console.log("onReadCharacteristic status:" + event.status);
      console.log("onReadCharacteristic value:" + event.value);
      console.log("value_type:" + event.value_type);
      var value = event.value;
      this.performListenerFunction(BleService.Event_ON_READ_CHARACTERISTIC, value);
    }

    _onWriteCharacteristic(event) {
      console.log("onWriteCharacteristic status:" + event.status);
      this.bleManager.executeWrite(this.conn_id, 0);
    }

    _onReadDescriptor(event) {
      console.log("onReadDescriptor:" + event.value);
      this.des_value = event.value;
      console.log("start writeDescriptor  select_srvc_id ::" + " : " + this.select_srvc_id.uuid);
      console.log("start writeDescriptor  select_char_id ::" + " : " + this.select_char_id.uuid);
      console.log("start writeDescriptor  select_descr_id::" + " : " + this.select_descr_id.uuid);
      this.performListenerFunction(BleService.Event_ON_READ_DESCRIPTOR, this.des_value);
    }

    _onWriteDescriptor(event) {
      console.log("onWriteDescriptor status:" + event.status);
      this.performListenerFunction(BleService.Event_ON_DESCRIPTOR_WROTE, (event.status == 0) ? true : false);
      this.bleManager.executeWrite(this.conn_id, 0);
    }

    _onExecutWrite(event) {
      console.log("onExecutWrite status:" + event.status);
    }

    _onReadRemoterssi(event) {
      //$('#device_rssi').html(event.rssi);
    }

    _onBleListen(event) {
      console.log("onBleListen:" + event.status);
      console.log("onBleListen:" + event.server_if);
      server_if = event.server_if;
    }

    _onRegisterforNotification(event) {
        console.log("onRegisterforNotification registered:" + event.registered);
        this.performListenerFunction(BleService.Event_ON_REGISTER_NOTIFY, (event.registered == 1) ? true : false);
    }


    //data
    _addDevice(device){
      this._devices.push(device);
    }

    _addService(service){
      this._services.push(service);

    }
    _addCharacteristic(characteristic)
    {
      console.log("ssssssssssssssssssssss",this.start_char_id,characteristic.uuid);
      if (this.start_char_id && this.start_char_id.uuid == characteristic.uuid) {
          console.log("ffffff");
          return;
      }
      this._characteristics.push(characteristic);
      this.start_char_id = characteristic;

      if(!this.select_char_id)
      {
        console.log("NEXTXXXXXXX")
        this.bleManager.getCharacteristic(this.conn_id, this.select_srvc_id, this.start_char_id);
      }

    }

    _addDescriptor(descriptor)
    {
      if (this.start_descr_id && this.start_descr_id.uuid == descriptor.uuid) {
          return;
      }
      this._descriptors.push(descriptor);
      this.start_descr_id = descriptor;
      this.bleManager.getDescriptor(this.conn_id, this.select_srvc_id, this.select_char_id, this.start_descr_id);
    }


}
BleService.Event_ON_CLIENT_READY = "onClientReady";
BleService.Event_ON_DEVICE_CONNECTED = "onDeviceConnected";
BleService.Event_ON_DEVICE_FOUND = "onDeviceFound";
BleService.Event_ON_SERVICE_FOUND = "onServiceFound";
BleService.Event_ON_CHARACTERISTIC_FOUND = "onCharacteristicFound";
BleService.Event_ON_DESCRIPTOR_FOUND = "onDescriptorFound";
BleService.Event_ON_REGISTER_NOTIFY = "onRegisterNotify";
BleService.Event_ON_DESCRIPTOR_WROTE = "onDescriptorWrote";
BleService.Event_ON_READ_DESCRIPTOR = "onReadDescriptor";
BleService.Event_ON_READ_CHARACTERISTIC = "onReadCgaracteristic";
BleService.Event_ON_NOTIFY = "onNotify";
