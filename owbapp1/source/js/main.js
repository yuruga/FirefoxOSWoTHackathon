import  {CONFIG} from './ble/Config';
import {BleService} from './ble/BleService';
import {SyncService} from './sync/SyncService';

class CSC{
  constructor(){


    console.log("const");
    //this.init();
  }

  init(){
    this.ble = new BleService();
    this.sync = new SyncService();
    this.ble.addEventListener(BleService.Event_ON_CLIENT_READY, this.onBleClientReady, this);
    this.ble.start();
  }



  onBleClientReady(){
    //console.log("onBleClientReady");
    this.ble.addEventListener(BleService.Event_ON_DEVICE_FOUND, this.onScanDevices, this);
    this.ble.scanDevices();
  }

  onScanDevices(device){
    //console.log("onDeviceFound", device.address);
    if(CONFIG.CSC_BD_ADRESS === device.address)
    {
      this.ble.stopScanDevices();
      this.ble.addEventListener(BleService.Event_ON_SERVICE_FOUND, this.onServiceFound, this);
      this.ble.connectDevice(device);
    }
  }

  onServiceFound(serviceId){
    //console.log("onServiceFound", serviceId.uuid);
    if(CONFIG.CSC_SERVICE_ID === serviceId.uuid)
    {
      this.ble.addEventListener(BleService.Event_ON_CHARACTERISTIC_FOUND, this.onCharactoristicFound, this);
      this.ble.selectService(serviceId);
    }
  }

  onCharactoristicFound(charId){
    //console.log("onCharactoristcFound", charId.uuid);
    if(CONFIG.CSC_MEASUREMENT_CHARACTERISCTIC_ID === charId.uuid)
    {
      this.ble.addEventListener(BleService.Event_ON_DESCRIPTOR_FOUND, this.onDescripterFound, this);
      this.ble.selectCharacteristic(charId);
    }
  }

  onDescripterFound(descId){
    console.log("onDescripterFound", descId.uuid);
    if(CONFIG.CCCD_ID === descId.uuid)
    {
      console.log("aaaa")

      this.ble.addEventListener(BleService.Event_ON_READ_DESCRIPTOR, this.onReadDescriptor, this);
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
      this.ble.addEventListener(BleService.Event_ON_DESCRIPTOR_WROTE, this.onDescriptorWrote, this);
      this.ble.writeDescriptor("0100", 4);
      this.ble.addEventListener(BleService.Event_ON_REGISTER_NOTIFY, this.onRegisterNotify, this);
      this.ble.addEventListener(BleService.Event_ON_NOTIFY, this.onNotify, this);
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
    if(this.isNotifiRegistered && this.isNotifyEnabled){
      this.ble.addEventListener(BleService.Event_ON_NOTIFY, this.onNotify, this);
    }
  }

  onNotify(value){
    console.log(value);

    this.sync.send(this._calcCSC(value));
  }

  _calcCSC(){
    return {s:30.5,c:70.2};
  }

  onUnregisterNOtify(success)
  {
  }
}
window.csc = new CSC();
