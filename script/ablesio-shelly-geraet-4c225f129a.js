// ablesio - Messsteckdose - Script v3 (Shelly ab Gen2: Plug S MTR / Plug PM / Plug M / Outdoor Plug S Gen3, Gen4, PM Mini ...)
let PRODUCTION=false;
let CONFIG={url:"",everyMin:15,bufferMax:96,batch:48};
const REV="4c225f129a";
let queue=[];
let busy=false;
let DEVICE=null;
let RSSI=null;
let ECO=null;
let ecoCfg=null;let ecoGood=0;let failStreak=0;
let updBusy=false;let updTried="";let cleaned=false;
const PACE=[[15,1],[30,3],[60,5],[120,10]];
let elapsed=0;let fastStart=true;
let FW=null;let fwNew=null;let fwCfg=null;let fwTried=false;let reps=0;let fwAt=-1;let NAME=null;
let CQ=[];let CQN=0;
function rpc(m,p,cb){CQ.push([m,p,cb]);rpcNext();}
function rpcNext(){
if(CQN>=2||CQ.length===0)return;
let c=CQ.splice(0,1)[0];CQN++;
Shelly.call(c[0],c[1],function(r,e,msg){
CQN--;
if(c[2]){try{c[2](r,e,msg);}catch(x){print("ablesio: Fehler in " + c[0]+ ": " + x);}}
rpcNext();
});
}
rpc("Shelly.GetDeviceInfo",{},function(di){if(di){DEVICE={id:di.id,model:di.model,mac:di.mac};FW=di.ver||null;}});
rpc("Sys.GetConfig",{},function(c){if(c&&c.device){ECO=c.device.eco_mode===true;NAME=c.device.name||"";}});
let LED={ui:null,ch:"switch:0",mode:"status",xfer:false,state:"idle",shown:"",max:300,writes:0,day:-1,busy:false,told:false};
const LED_RGB={idle:[100,45,0],measure:[0,35,100],move:[0,100,25],send:[70,0,100],error:[100,0,0]};
const LED_DIM={idle:100,measure:100,move:100,send:100,error:100};
function ledProbe(i){
let n=["PLUGS_UI","PLUGUK_UI","PLUGPM_UI"];
if(i>=n.length){LED.ui="";return;}
rpc(n[i]+ ".GetConfig",{},function(c,e){
if(e===0&&c&&c.leds){LED.ui=n[i];LED.ch=n[i]==="PLUGPM_UI"?"pm1:0":"switch:0";plugGuard(c);if(LED.told)ledApply(true);}
else ledProbe(i + 1);
});
}
function plugGuard(c){
if(LED.ui!=="PLUGS_UI"&&LED.ui!=="PLUGUK_UI")return;
let ctl=c&&c.controls&&c.controls["switch:0"];
if(ctl&&ctl.in_mode!=="momentary")rpc(LED.ui + ".SetConfig",{config:{controls:{"switch:0":{in_mode:"momentary"}}}},function(){});
rpc("Switch.GetConfig",{id:0},function(sc,e){
if(e===0&&sc&&sc.initial_state!=="on")rpc("Switch.SetConfig",{id:0,config:{initial_state:"on"}},function(){});
});
rpc("Switch.GetStatus",{id:0},function(st,e){if(e===0&&st&&st.output===false)rpc("Switch.Set",{id:0,on:true},function(){});});
}
function ledCan(n){
let d=Math.floor(elapsed/1440);
if(d!==LED.day){LED.day=d;LED.writes=0;}
return LED.writes + n<=LED.max;
}
function ledSet(rgb,bri,cb){
if(!LED.ui){if(cb)cb();return;}
let col={};
if(LED.ch==="pm1:0")col[LED.ch]={on:{rgb:rgb,brightness:bri}};
else col[LED.ch]={on:{rgb:[rgb[0],rgb[1],rgb[2]],brightness:bri},off:{rgb:[rgb[0],rgb[1],rgb[2]],brightness:bri}};
LED.writes++;
let pp={config:{leds:{mode:"switch",colors:col}}};rpc(LED.ui + ".SetConfig",pp,function(r,e,m){if(e!==0)ledErr(m,pp);if(cb)cb();});
}
function ledWant(){return failStreak>=2?"error":(LED.xfer?"send":LED.state);}
function ledXfer(on){if(LED.xfer===on)return;LED.xfer=on;ledApply(false);}
function ledApply(force){
if(!LED.ui||LED.busy||!LED.told)return;
let key=LED.mode==="status"?"s:" + ledWant():LED.mode;
if(!force&&key===LED.shown)return;
if(!ledCan(1))return;
LED.shown=key;
if(LED.mode==="status"){let s=ledWant();ledSet(LED_RGB[s],LED_DIM[s],null);return;}
LED.writes++;
rpc(LED.ui + ".SetConfig",{config:{leds:{mode:LED.mode==="shelly"?"power":"off"}}},function(){});
}
function ledReply(c){
if(!c)return;
LED.told=true;
if(c.mode==="status"||c.mode==="shelly"||c.mode==="off")LED.mode=c.mode;
if(c.state==="idle"||c.state==="measure"||c.state==="move")LED.state=c.state;
if(typeof c.max==="number"&&c.max>=0&&c.max<=2000)LED.max=c.max;
ledApply(false);
}
function ledStatus(){return{ui:LED.ui,state:LED.mode==="status"?ledWant():LED.mode,writes:LED.writes,err:LED.err,p:LED.p};}
ledProbe(0);
function readEnergy(cb){
function pick(x){return(PRODUCTION&&x.ret_aenergy&&x.ret_aenergy.total>0)?x.ret_aenergy.total:x.aenergy.total;}
rpc("Switch.GetStatus",{id:0},function(st){
if(st&&st.aenergy){cb(pick(st),Math.abs(st.apower));return;}
rpc("PM1.GetStatus",{id:0},function(pm){
if(pm&&pm.aenergy)cb(pick(pm),Math.abs(pm.apower));else cb(null,null);
});
});
}
function setEco(on){
if(ECO===on)return;
rpc("Sys.SetConfig",{config:{device:{eco_mode:on}}},function(r,e){if(e===0)ECO=on;});
}
function ecoRule(ok){
let c=ecoCfg;if(!c)return;
if(c.mode==="off"){setEco(false);ecoGood=0;return;}
if(c.mode==="on"){setEco(true);return;}
if(!ok||RSSI===null||RSSI<c.off_rssi){if(ECO)setEco(false);ecoGood=0;return;}
if(RSSI>=c.on_rssi)ecoGood++;
if(ECO!==true&&ecoGood>=c.after)setEco(true);
}
function csum(s,h){for(let i=0;i<s.length;i++){h=(h*31 + s.charCodeAt(i))%2147483647;}return h;}
function selfUpdate(info){
if(updBusy||updTried===info.rev||typeof Shelly.getCurrentScriptId!=="function")return;
updBusy=true;updTried=info.rev;
ledXfer(true);
let fail=function(id){updBusy=false;ledXfer(false);if(id!==null)rpc("Script.Delete",{id:id},function(){});};
let me=Shelly.getCurrentScriptId();
rpc("Script.List",{},function(l){
if(l&&l.scripts)for(let i=0;i<l.scripts.length;i++){if(l.scripts[i].name==="ablesio-neu"&&l.scripts[i].id!==me)rpc("Script.Delete",{id:l.scripts[i].id},function(){});}
createNew(info,fail);
});
}
function createNew(info,fail){
rpc("Script.Create",{name:"ablesio-neu"},function(c,e){
if(e!==0||!c){fail(null);return;}
let id=c.id;let part=0;let h=0;
let next=function(){
if(part>=info.parts){
if(h!==info.sum){fail(id);return;}
rpc("Script.SetConfig",{id:id,config:{enable:true}},function(){
rpc("Script.Start",{id:id},function(r,e2){if(e2!==0)fail(id);else{updBusy=false;ledXfer(false);}});
});
return;
}
rpc("HTTP.GET",{url:CONFIG.url + "/script?part=" + part,timeout:20},function(res,e3){
let j=null;if(e3===0&&res&&res.code===200){try{j=JSON.parse(res.body);}catch(x){j=null;}}
if(!j||j.rev!==info.rev||typeof j.code!=="string"){fail(id);return;}
h=csum(j.code,h);
rpc("Script.PutCode",{id:id,code:j.code,append:part>0},function(r4,e4){
if(e4!==0){fail(id);return;}
part++;next();
});
});
};
next();
});
}
function cleanupOld(){
if(cleaned||typeof Shelly.getCurrentScriptId!=="function")return;
cleaned=true;
let me=Shelly.getCurrentScriptId();
rpc("Script.List",{},function(l){
if(!l||!l.scripts)return;
for(let i=0;i<l.scripts.length;i++){
let s=l.scripts[i];
if(s.id!==me&&(s.name==="ablesio"||s.name==="ablesio-neu")){rpc("Script.Stop",{id:s.id},function(){});rpc("Script.Delete",{id:s.id},function(){});}
}
rpc("Script.SetConfig",{id:me,config:{name:"ablesio"}},function(){});
});
}
let apDone=false;
function apCheck(r){
if(apDone||!r||r.ap_off!==true)return;
apDone=true;
rpc("WiFi.GetConfig",{},function(c){
if(c&&c.ap&&c.ap.enable)rpc("WiFi.SetConfig",{config:{ap:{enable:false}}});
});
}
function onReply(body){
failStreak=0;
if(!body)return;
let r=null;try{r=JSON.parse(body);}catch(e){return;}
if(!r)return;
apCheck(r);
if(r.eco){ecoCfg=r.eco;ecoRule(true);}
if(r.fast_start===false)fastStart=false;
POLLM=(typeof r.poll==="number"&&r.poll>0&&r.poll<16)?r.poll:0;
reps++;
if(r.fw){fwCfg=r.fw;fwRule();}
if(r.name)nameRule(r.name);
if(r.led)ledReply(r.led);
if(r.script&&r.script.rev){
if(r.script.rev===REV)cleanupOld();
else if(r.script.auto===true&&r.script.parts>0)updGate(r.script,r.confirm);
}
}
function fwCheck(){
fwAt=reps;
rpc("Shelly.CheckForUpdate",{},function(r,e){
if(e!==0||!r)return;
fwNew=(r.stable&&r.stable.version)?r.stable.version:"";
fwUpdate();
});
}
function fwUpdate(){
let c=fwCfg;if(!c||c.mode!=="auto"||!fwNew||fwTried)return;
rpc("Sys.GetStatus",{},function(st){
let h=(st&&typeof st.time==="string"&&st.time.length>=2)?Number(st.time.split(":")[0]):-1;
if(h<c.from||h>=c.to)return;
fwTried=true;
rpc("Shelly.Update",{stage:"stable"},function(){});
});
}
function fwRule(){
let c=fwCfg;if(!c||c.mode==="off")return;
if((fwAt<0&&reps>=5)||(fwAt>=0&&reps - fwAt>=c.every))fwCheck();else fwUpdate();
}
function nameRule(n){
if(typeof n!=="string"||n===""||NAME===null||n===NAME)return;
rpc("Sys.SetConfig",{config:{device:{name:n}}},function(r,e){if(e===0)NAME=n;});
}
function onFail(){failStreak++;if(failStreak>=2){ecoRule(false);ledApply(false);}}
function status(){return{cfg:"kvs",gate:GATE,ram:RAM,rssi:RSSI,eco:ECO,rev:REV,fw:FW,fw_new:fwNew,led:ledStatus()};}
function send(powerW){
if(busy||queue.length===0)return;
busy=true;
let batch=queue.slice(0,CONFIG.batch);
if(queue.length>3)ledXfer(true);
rpc("HTTP.POST",{
url:CONFIG.url,
body:JSON.stringify({readings:batch,power_w:powerW,script:3,device:DEVICE,health:status()}),
headers:{"Content-Type":"application/json"},
timeout:20
},function(res,errCode){
busy=false;
if(errCode===0&&res&&res.code===200){
queue.splice(0,batch.length);
if(queue.length<=3)ledXfer(false);
onReply(res.body);
if(queue.length>0)send(powerW);
}else{ledXfer(false);onFail();}
});
}
function measure(){
rpc("WiFi.GetStatus",{},function(w){RSSI=(w&&typeof w.rssi==="number")?w.rssi:null;});
readEnergy(function(wh,w){
if(wh===null)return;
rpc("Sys.GetStatus",{},function(sys){
let ts=sys&&sys.unixtime?sys.unixtime:0;
if(ts>0){
queue.push({ts:ts,total_wh:wh});
if(queue.length>CONFIG.bufferMax)queue.splice(0,queue.length - CONFIG.bufferMax);
send(w);
}else{
rpc("HTTP.POST",{url:CONFIG.url,body:JSON.stringify({total_wh:wh,power_w:w,device:DEVICE,health:status()}),headers:{"Content-Type":"application/json"},timeout:20},function(res,errCode){if(errCode===0&&res&&res.code===200)onReply(res.body);else onFail();});
}
});
});
}
if(typeof Shelly.getCurrentScriptId==="function"){
rpc("Script.SetConfig",{id:Shelly.getCurrentScriptId(),config:{enable:true}},function(){});
}
function nextMin(){
if(POLLM)return POLLM;
if(fastStart){for(let i=0;i<PACE.length;i++){if(elapsed<PACE[i][0])return PACE[i][1];}}
return CONFIG.everyMin;
}
function tick(){
measure();
let m=nextMin();elapsed +=m;
Timer.set(m*60*1000 + jit(m),false,tick);
}
const UPD_PROBE=10;
function jit(m){let r=0;try{r=Math.random()- 0.5;}catch(x){r=0;}return m<5?0:Math.floor(r*60000);}
let POLLM=false;let GATE={c:0,on:0,n:0};let UPD=null;let CF={on:false,ok:false,taps:[],until:0};
function cfUi(){return(LED.ui==="PLUGS_UI"||LED.ui==="PLUGUK_UI")?LED.ui:"";}
function cfEnd(){
if(!CF.on)return;
CF.on=false;CF.taps=[];
ledXfer(false);
rpc("Switch.Set",{id:0,on:true},function(){});
}
function cfStart(c){
let sec=(c&&typeof c.sec==="number")?c.sec:0;
if(CF.on||CF.ok||!UPD||cfUi()===""||sec<30||sec>1800)return;
print("ablesio: Update freigegeben, Taste einmal druecken (" + JSON.stringify(sec)+ " s)");
CF.on=true;CF.taps=[];CF.until=Shelly.getUptimeMs()+ sec*1000;
ledXfer(true);
}
function cfTap(ts){
if(!CF.on)return;
CF.ok=true;cfEnd();if(UPD){selfUpdate(UPD);CF.ok=false;}
}
Shelly.addEventHandler(function(ev){
if(!ev||ev.component!=="switch:0")return;
let o=(ev.delta&&typeof ev.delta.output==="boolean")?ev.delta.output:((ev.info&&typeof ev.info.output==="boolean")?ev.info.output:null);
GATE.on=CF.on?1:0;
if(!CF.on)return;
if(o!==null||(ev.info&&ev.info.event==="toggle")){GATE.n++;cfTap(Shelly.getUptimeMs()/1000);}
});
function updGate(info,conf){UPD=info;GATE.c=(conf&&typeof conf.sec==="number")?conf.sec:0;cfStart(conf);}
function cfgLoad(){
rpc("KVS.Get",{key:"ablesio_url"},function(r,e){
if(e===0&&r&&typeof r.value==="string"&&r.value.indexOf("https://")===0){
CONFIG.url=r.value;
rpc("KVS.Get",{key:"ablesio_prod"},function(p,e2){PRODUCTION=(e2===0&&p&&p.value==="1");tick();});
}else{print("ablesio: Melde-Link fehlt im Geraetespeicher (KVS ablesio_url)");CF_RETRY=1;}
});
}
cfgLoad();
let CF_RETRY=0;let HK=0;
function ledErr(m,pp){LED.err=String(m).slice(0,60);LED.p=JSON.stringify(pp).slice(0,150);LED.shown="";LED.rt=1;}
function ledAudit(){
if(!LED.ui||!LED.told||LED.mode!=="status"||CF.on||updBusy)return;
rpc(LED.ui + ".GetConfig",{},function(c,e){
let k=(e===0&&c&&c.leds&&c.leds.colors)?c.leds.colors[LED.ch]:null,w=LED_RGB[ledWant()];
if(c&&c.leds&&(c.leds.mode!=="switch"||(k&&k.on&&k.on.rgb&&Math.round(k.on.rgb[0])!==w[0]||Math.round(k.on.brightness)!==100))){LED.shown="";ledApply(false);}
});
}
let RAM=0;
function ramRead(){rpc("Sys.GetStatus",{},function(r){if(r&&typeof r.ram_free==="number")RAM=r.ram_free;});}
ramRead();
function hk(){
HK++;
if(CF.on&&Shelly.getUptimeMs()>=CF.until)cfEnd();
if(LED.xfer&&!CF.on&&!updBusy&&queue.length<=3)ledXfer(false);
if(LED.rt){LED.rt=0;ledApply(false);}
if(HK%10===1)ledAudit();
if(HK%5===0)ramRead();
if(CF_RETRY){CF_RETRY=0;cfgLoad();}
}
Timer.set(60000,true,hk);
