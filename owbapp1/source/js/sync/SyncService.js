export class SyncService{
  constructor(url){
    console.log('sync');
    this.url = url;
  }
  send(value){
    console.log("send", value);
    $.post(this.url,{speed:value.s.toFixed(3), cadence:value.c.toFixed(3)})
  }
}
