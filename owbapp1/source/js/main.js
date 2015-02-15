import  {CONFIG} from './ble/Config';
import {BleService} from './ble/BleService';
import {SyncService} from './sync/SyncService';

class CSC{
  constructor(){

    this.w_count = 0;
    this.c_count = 0;

    this.w_buffer = [];

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
      console.log("aaaa")


      //this.ble.addEventListener(BleService.Event_ON_REGISTER_NOTIFY, this.onRegisterNotify, this);


      this.ble.readDescriptor(descId);
      //this.ble.registerNotify();
      console.log("bbbbb")
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
    console.log("succ4")
    this.isNotifyEnabled = true;
    this.onTryNotifyEnabled();
  }

  onRegisterNotify(success){
    console.log("succ")
    this.isNotifiRegistered = true;
    this.onTryNotifyEnabled();
  }

  onTryNotifyEnabled(){
    console.log("sssssssssssssssssssss",this.isNotifiRegistered , this.isNotifyEnabled)

  }

  onNotify(value){
    console.log(value);

    this.sync.send(this._calcCSC(value));
  }

  _calcCSC(value){

    //value = "032e0000007b7514008b7b";
    var wc_hex = value.substr(8,2)+value.substr(6,2) + value.substr(4,2)+value.substr(2,2);
    var wdt_hex = value.substr(12,2)+value.substr(10,2);

    var cc_hex = value.substr(16,2)+value.substr(14,2);
    var cdt_hex = value.substr(20,2)+value.substr(18,2);





    var w_dt = parseInt(wdt_hex,16);
    var w_count_new = parseInt(wc_hex,16);
    var w_dc = w_count_new - this.w_count;

    this.w_buffer.push([w_dt,w_dc]);
    if(this.w_buffer.length >3)
    {
      this.w_buffer.shift();
    }

    var wc = 0;
    var wt = 0;
    var l = this.w_buffer.length;
    for(var i = 0; i<l; i++)
    {
      wc += this.w_buffer[i][1];
      wt += this.w_buffer[i][0];
    }

    var trip = wc*CONFIG.WHEEL_SIZE//w_dc * CONFIG.WHEEL_SIZE;///mms

    var c_dt = parseInt(cdt_hex,16);
    var c_count_new = parseInt(cc_hex,16);

    var c_dc = c_count_new - this.c_count;



    //console.log(c_count_new, c_dc, c_dt);

    this.w_count = w_count_new;
    this.c_count = c_count_new;

    var sp = trip*1024*60*60/wt/1000/1000;
    var cd = c_dc*1024*60*60/c_dt;

    //console.log(trip*1024*60*60/w_dt/1000/1000*49, c_dc*1024*60*60/c_dt)
    console.log(sp,cd);
    return {s:sp, c:cd};

  }

  onUnregisterNOtify(success)
  {
  }
}
window.csc = new CSC();
