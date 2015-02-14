export class BleGattClientControl{
  static getInstance(){
    if(!this.sInstance)
    {
      this.sInstance = new BleGattClientControlInstance();
    }
    return this.sInstance;
  }
}


class BleGattClientControlInstance{
  constructor(){
      this.mBluetoothManager = navigator.mozBluetooth;
      this.mBleGatt = navigator.owbBle;
      this.mSettingManager = navigator.mozSettings;
    }

    getBluetooth(){
        return this.mBluetoothManager;
    };

    getBleGatt() {
        return this.mBleGatt;
    };

    getSetting(){
        return this.mSettingManager;
    }

}
