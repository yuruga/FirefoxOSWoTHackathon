import  {CONFIG} from './ble/Config';
import {BleService} from './ble/BleService';
import {SyncService} from './sync/SyncService';

class CSC{
  constructor(){

    this.w_count;
    this.c_count;
    this.CSC_TIMER_ROLLOVER = parseInt("FF", 16);

    console.log("const");
    //this.init();
  }

  init(){
    this.ble = new BleService();
    this.sync = new SyncService(CONFIG.API);
    this.ble.addEventListener(BleService.Event_ON_CLIENT_READY, this.onBleClientReady, this);
    this.ble.addEventListener(BleService.Event_ON_REGISTER_NOTIFY, this.onRegisterNotify, this);
    this.ble.addEventListener(BleService.Event_ON_NOTIFY, this.onNotify, this);
    this.ble.addEventListener(BleService.Event_ON_DEVICE_FOUND, this.onScanDevices, this);
    this.ble.addEventListener(BleService.Event_ON_SERVICE_FOUND, this.onServiceFound, this);
    this.ble.addEventListener(BleService.Event_ON_CHARACTERISTIC_FOUND, this.onCharactoristicFound, this);
    this.ble.addEventListener(BleService.Event_ON_DESCRIPTOR_FOUND, this.onDescripterFound, this);
    this.ble.addEventListener(BleService.Event_ON_READ_DESCRIPTOR, this.onReadDescriptor, this);
    this.ble.addEventListener(BleService.Event_ON_DESCRIPTOR_WROTE, this.onDescriptorWrote, this);
    this.ble.start();
  }



  onBleClientReady(){
    //console.log("onBleClientReady");

    this.ble.scanDevices();
  }

  onScanDevices(device){
    //console.log("onDeviceFound", device.address);
    if(CONFIG.CSC_BD_ADRESS === device.address)
    {
      this.ble.stopScanDevices();

      this.ble.connectDevice(device);
    }
  }

  onServiceFound(serviceId){
    //console.log("onServiceFound", serviceId.uuid);
    if(CONFIG.CSC_SERVICE_ID === serviceId.uuid)
    {

      this.ble.selectService(serviceId);
    }
  }

  onCharactoristicFound(charId){
    //console.log("onCharactoristcFound", charId.uuid);
    if(CONFIG.CSC_MEASUREMENT_CHARACTERISCTIC_ID === charId.uuid)
    {

      this.ble.selectCharacteristic(charId);
    }
  }

  onDescripterFound(descId){
    console.log("onDescripterFound", descId.uuid);
    if(CONFIG.CCCD_ID === descId.uuid)
    {
      this.ble.readDescriptor(descId);
    }
  }

  onReadDescriptor(value){
    console.log("readDescriptor", value);
    if(value == "0100")
    {
      this.onDescripterWrote(true);
    }else
    {
      this.ble.writeDescriptor("0100", 4);
      this.ble.registerNotify();
    }
  }

  onDescripterWrote(success){
    this.isNotifyEnabled = true;
    this.onTryNotifyEnabled();
  }

  onRegisterNotify(success){
    this.isNotifiRegistered = true;
    this.onTryNotifyEnabled();
  }

  onTryNotifyEnabled(){

  }

  onNotify(value){
    console.log(value);
    this.sync.send(this._calcCSC(value));
  }

  _calcCSC(value){
    //valuesample = "032e0000007b7514008b7b";
    var wc_hex = value.substr(8,2)+value.substr(6,2) + value.substr(4,2)+value.substr(2,2);
    var wet_hex = value.substr(12,2)+value.substr(10,2);

    var cc_hex = value.substr(16,2)+value.substr(14,2);
    var cet_hex = value.substr(20,2)+value.substr(18,2);

    var w_et_new = parseInt(wdt_hex,16);
    var w_count_new = parseInt(wc_hex,16);
    var w_dc = w_count_new - this.w_count|w_count_new;
    var w_dt = (w_et_new -this.w_et + this.CSC_TIMER_ROLLOVER)%this.CSC_TIMER_ROLLOVER;
    var trip = w_dc * CONFIG.WHEEL_SIZE;///mms

    var c_et_new = parseInt(cdt_hex,16);
    var c_count_new = parseInt(cc_hex,16);
    var c_dc = c_count_new - this.c_count|c_count_new;
    var c_dt = (c_et_new -this.c_et + this.CSC_TIMER_ROLLOVER)%this.CSC_TIMER_ROLLOVER;

    this.w_count = w_count_new;
    this.c_count = c_count_new;
    this.w_et = w_et_new;
    this.c_et = c_et_new;

    var sp = trip*1024*60*60/wt/1000/1000;
    var cd = c_dc*1024*60*60/c_dt;

    console.log(sp,cd);
    return {s:Math.min(80,sp), c:cd};

  }

  onUnregisterNOtify(success)
  {
  }
}
window.csc = new CSC();
