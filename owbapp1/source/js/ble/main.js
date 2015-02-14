import  {CONFIG} from './Config';
import {BleService} from './BleService';

class CSC{
  constructor(){

    console.log(this.init);
    console.log("const");
    this.init();
  }

  init(){
    this.ble = new BleService();

    this.ble.addEventListener(BleService.Event_ON_CLIENT_READY, this.onBleClientReady, this);
    this.ble.start();
  }



  onBleClientReady(){
    console.log("onBleClientReady");
    this.ble.addEventListener(BleService.Event_ON_DEVICE_FOUND, this.onScanDevices, this);
    this.ble.scanDevices();
  }

  onScanDevices(device){
    console.log("onDeviceFound", device);
    if(CONFIG.CSC_BD_ADRESS === device.address)
    {
      this.ble.stopScanDevices();
      this.ble.addEventListener(BleService.Event_ON_SERVICE_FOUND, this.onServiceFound, this);
      this.ble.connectDevice(device);
    }
  }

  onServiceFound(serviceId){
    console.log("onServiceFound", serviceId);
    if(CONFIG.CSC_SERVICE_ID === serviceId.uuid)
    {
      this.ble.addEventListener(BleService.Event_ON_CHARACTERISTIC_FOUND, this.onCharactoristicFound, this);
      this.ble.selectService(serviceId);
    }
  }

  onCharactoristicFound(charId){
    console.log("onCharactoristcFound", charId);
    if(CONFIG.CSC_MEASUREMENT_CHARACTERISCTIC_ID === charId.uuid)
    {
      this.ble.addEventListener(BleService.Event_ON_DESCRIPTOR_FOUND, this.onDescripterFound, this);
      this.ble.selectCharacteristic(charId);
    }
  }

  onDescripterFound(descId){
    console.log("onDescripterFound", descId.uuid);
    if(CONFIG.CCCD_ID === descId)
    {
      this.ble.addEventListener(BleService.Event_ON_DESCRIPTER_WROTE, this.onDescripterWrote, this);
      this.ble.addEventListener(BleService.Event_ON_REGISTER_NOTIFY, this.onRegisterNotify, this);
      this.ble.writeDescripter(descId, "0100", 4);
      this.ble.registerNotify();
    }
  }

  onDescripterWrote(success){
    this.isNotifyEnabled = true;
    this.onTryNotifyEnabled();
  }

  onRegisterNotify(success){
    this.isNOtifiRegistered = true;
    this.onTryNotifyEnabled();
  }

  onTryNotifyEnabled(){
    if(this.isNOtifiRegistered && this.isNotifyEnabled){
      this.ble.addEventListener(BleService.Event_ON_NOTIFY, this.onNotify, this);
    }
  }

  onNotify(value){
    console.log(value);
    //this.sync.send(value);

  }

  onUnregisterNOtify(success)
  {
  }
}
new CSC();
