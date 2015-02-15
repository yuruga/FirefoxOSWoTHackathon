export class SyncService{
  constructor(url){
    console.log('sync');
    this.url = url;
  }
  send(value){
    console.log("send", value);
    $.post(this.url,{speed:value.s, cadence:value.c})
  }
}
