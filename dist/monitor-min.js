/* monitor-min - v0.5.1 - 2013-03-27 */
(function(e){var t=typeof exports!="undefined",n=t?require("backbone"):e.Backbone,r=t?require("underscore")._:e._,i=t?require("cron"):null,s=4,o=n.Model.extend({defaults:{id:"",name:"",probeClass:"",initParams:{},hostName:"",appName:"",appInstance:0},initialize:function(e,t){},connect:function(e){var t=this;o.getRouter().connectMonitor(t,function(n){e&&e(n),n||(t.trigger("connect",t),t.trigger("change",t))})},getConnection:function(){var e=this;return e.probe&&e.probe.connection?e.probe.connection:null},isConnected:function(){var e=this;return e.probe!=null},disconnect:function(e){var t=this,n="manual_disconnect";o.getRouter().disconnectMonitor(t,n,function(n,r){e&&e(n),n||t.trigger("disconnect",r)})},control:function(e,t,n){typeof t=="function"&&(n=t,t=null),n=n||function(){};var r=this,i=r.probe;if(!i)return n("Probe not connected");i&&i.connection?i.connection.emit("probe:control",{probeId:r.get("probeId"),name:e,params:t},n):i.onControl(e,t,n)},toProbeJSON:function(e){var t=this,n={id:t.get("probeId")};return r.each(t.toJSON(e),function(e,r){r in t.defaults||(n[r]=e)}),n},toMonitorJSON:function(e){var t=this,n={};return r.each(t.toJSON(e),function(e,r){r in t.defaults&&(n[r]=e)}),n},toServerString:function(){return o.toServerString(this.toMonitorJSON())}});o.generateUniqueId=function(){function e(){return((1+Math.random())*65536|0).toString(16).substring(1)}return e()+e()+"-"+e()+"-"+e()+"-"+e()+"-"+e()+e()+e()},o.generateUniqueCollectionId=function(e,t){var n="";return t=t||"",e.idSequence||(e.idSequence=0,e.forEach(function(n){var r=n.get("id")||"",i=+r.substr(t.length);e.idSequence<=i&&(e.idSequence=i+1)})),t+e.idSequence++},o.getRouter=function(){return o.defaultRouter||(o.defaultRouter=new o.Router,e.io&&o.defaultRouter.setGateway({socket:e.io.connect()})),o.defaultRouter},o.toServerString=function(e){var t=e.hostName;return e.appName&&(t+=":"+e.appName,e.appInstance&&(t+=":"+e.appInstance)),t},o.deepCopy=function(e,t){t=typeof t=="undefined"?s:t;if(typeof e!="object"&&typeof e!="function")return e;var n="[Object]";typeof e=="function"?n="[Function]":Array.isArray(e)&&(n="[Array]");if(t<=0)return n;var i=Array.isArray(e)?[]:{};for(var u in e){var a=e[u];typeof a=="object"||typeof a=="function"?i[u]=o.deepCopy(a,t-1):i[u]=a}return typeof e=="function"&&(r.isEmpty(i)?i=n:i=r.extend({constructor:n},i)),i},o.stringify=function(e,t,n){return n=typeof n=="undefined"?2:n,JSON.stringify(o.deepCopy(e,t),null,n)},o.List=n.Collection.extend({model:o});var u={appName:"unknown",serviceBasePort:42e3,portsToScan:20,allowExternalConnections:!1};t?(o.Config=require("config"),o.Config.setModuleDefaults("MonitorMin",u)):o.Config={MonitorMin:u},o._=r,o.Backbone=n,o.Cron=i,o.commonJS=t,t?module.exports=o:e.Monitor=o})(this),function(e){var t=e.Monitor||require("./Monitor"),n=t.Cron,r=t._,i=t.Backbone,s=t.Probe=i.Model.extend({defaults:{id:null},initialize:function(e,t){},release:function(){},onControl:function(e,t,n){t=t||{},n=n||function(){};var r=this,i=r[e+"_control"],s;if(!i)return n({msg:"No control function: "+e});try{i.call(r,t,n)}catch(o){s="Error calling control: "+r.probeClass+":"+e,console.error(s,o),n({msg:s})}},ping_control:function(e,t){return t(null,"pong")}});s.classes={},s.extend=function(e){var t=this,n=i.Model.extend.apply(t,arguments);return e.probeClass&&(s.classes[e.probeClass]=n),n},s.List=i.Collection.extend({model:s})}(this),function(e){var t=e.Monitor||require("./Monitor"),n=t.Cron,r=t._,i=t.Backbone,s=t.Config,o=e.io||require("socket.io-client"),u=t.Probe,a=t.Connection=i.Model.extend({defaults:{hostName:"",hostPort:null,url:null,socket:null,gateway:!1,firewall:!1,remoteHostName:null,remoteAppName:null,remotePID:0,remoteProbeClasses:[],remoteGateway:!1,remoteFirewall:!1},initialize:function(e){var t=this;t.connecting=!0,t.connected=!1,t.socketEvents=null,t.remoteProbeIdsByKey={},t.remoteProbesById={},t.incomingMonitorsById={},e.socket?t.bindConnectionEvents():e.url||e.hostName&&e.hostPort?t.connect():console.error("Connection must supply a socket, url, or host name/port")},connect:function(){var e=this,t=e.get("hostName"),n=e.get("hostPort"),r=e.get("url");r||(r=e.attributes.url="http://"+t+":"+n);var i={transports:["websocket","xhr-polling"],"force new connection":!0,reconnect:!1},s=o.connect(r,i);e.set({socket:s}).bindConnectionEvents()},ping:function(e){var t=this;e=e||function(){};var n=function(){t.off("pong",n),e()};t.on("pong",n),t.emit("connection:ping")},disconnect:function(e){var t=this,n=t.get("socket");t.connecting=!1,t.connected=!1,t.socketEvents&&(t.removeAllEvents(),n.disconnect(),t.trigger("disconnect",e))},isThisHost:function(e){var t=this,n=e.toLowerCase(),r=t.get("hostName"),i=t.get("remoteHostName");return r=r&&r.toLowerCase(),i=i&&i.toLowerCase(),n===r||n===i},emit:function(){var e=this,t=e.get("socket");t.emit.apply(t,arguments)},addEvent:function(e,t){var n=this,r=n.get("socket");n.socketEvents=n.socketEvents||{};if(n.socketEvents[e])throw new Error("Event already connected: "+e);return r.on(e,t),n.socketEvents[e]=t,n},removeEvent:function(e){var t=this,n=t.get("socket");return t.socketEvents&&t.socketEvents[e]&&(n.removeListener(e,t.socketEvents[e]),delete t.socketEvents[e]),t},removeAllEvents:function(){var e=this,t=e.get("socket");for(var n in e.socketEvents)t.removeListener(n,e.socketEvents[n]);return e.socketEvents=null,e},bindConnectionEvents:function(){var e=this,n=e.get("socket");if(e.socketEvents)throw new Error("Already connected");e.socketEvents={},e.addEvent("connect_failed",function(){e.trigger("error","connect failed"),e.disconnect("connect failed")}),e.addEvent("disconnect",function(){e.disconnect("remote_disconnect")}),e.addEvent("error",function(t){e.trigger("error",t),e.disconnect("connect error")}),e.addEvent("probe:connect",e.probeConnect.bind(e)),e.addEvent("probe:disconnect",e.probeDisconnect.bind(e)),e.addEvent("probe:control",e.probeControl.bind(e)),e.addEvent("connection:ping",function(){n.emit("connection:pong")}),e.addEvent("connection:pong",function(){e.trigger("pong")}),e.addEvent("connection:info",function(t){e.set({remoteHostName:t.hostName,remoteAppName:t.appName,remotePID:t.pid,remoteProbeClasses:t.probeClasses,remoteGateway:t.gateway,remoteFirewall:t.firewall}),e.connecting=!1,e.connected=!0,e.trigger("connect")}),n.emit("connection:info",{hostName:t.getRouter().getHostName(),appName:s.MonitorMin.appName,pid:typeof process=="undefined"?0:process.pid,probeClasses:r.keys(u.classes),gateway:e.get("gateway"),firewall:e.get("firewall")})},probeConnect:function(e,n){n=n||function(){};var r=this,i=t.getRouter(),s=r.get("gateway"),o=r.get("firewall");if(o)return n("firewalled");i.determineConnection(e,s,function(o,u){if(o)return n(o);if(u&&!s)return n("Not a gateway");var a=function(i,s){if(i)return n(i);var o=new t(e),u=s.get("id");o.set("probeId",u),r.incomingMonitorsById[u]=o,o.probe=s,o.probeChange=function(){r.emit("probe:change:"+u,s.changedAttributes())},n(null,s.toJSON()),s.on("change",o.probeChange)};u?i.connectExternal(e,u,a):i.connectInternal(e,a)})},probeDisconnect:function(e,n){n=n||function(){};var r=this,i=t.getRouter(),s=e.probeId,o=r.incomingMonitorsById[s],u=r.get("firewall");if(u)return n("firewalled");if(!o||!o.probe)return n("Probe not connected");var a=function(e){return e?n(e):(o.probe.off("change",o.probeChange),o.probe=o.probeChange=null,delete r.incomingMonitorsById[s],n(null))},f=o.probe;f&&f.connection?i.disconnectExternal(f.connection,s,a):i.disconnectInternal(s,a)},probeControl:function(e,n){n=n||function(){};var r=this,i=t.getRouter(),s=r.get("firewall");if(s)return n("firewalled");var o=i.runningProbesById[e.probeId];if(!o){var u=r.incomingMonitorsById[e.probeId];return u?u.control(e.name,e.params,function(e,t){n(e,t)}):n("Probe id not found: "+e.probeId)}return o.onControl(e.name,e.params,n)}});a.List=i.Collection.extend({model:a})}(this),function(e){var t=e.Monitor||require("./Monitor"),n=t.Config,r=t._,i=t.Backbone,s=t.Connection,o=t.commonJS?require("http"):null,u=e.io||require("socket.io"),a=t.Server=i.Model.extend({initialize:function(e){var t=this;t.isListening=!1,t.connections=new s.List},start:function(e,t){typeof e=="function"&&(t=e,e=null),e=e||{},t=t||function(){};var r=this,i=r.get("server"),s,u=e.port||n.MonitorMin.serviceBasePort,a=e.attempt||1,f=n.MonitorMin.allowExternalConnections;if(a>n.MonitorMin.portsToScan)return s={err:"connect:failure",msg:"no ports available"},console.error("Server start",s),t(s);if(i)r.bindEvents(t);else{i=o.createServer(),i.on("error",function(e){r.get("port")||r.start({port:u+1,attempt:a+1},t)});var l=f?"0.0.0.0":"127.0.0.1";i.listen(u,function(){r.set({server:i,port:u}),r.bindEvents(t)})}},bindEvents:function(e){var n=this,r=n.get("server");r.on("clientError",function(e){console.error("Client error detected on server",e),n.trigger("error",e)}),r.on("close",function(e){r.hasEmittedClose=!0,n.stop()});var i={log:!1};n.socketServer=u.listen(r,i),n.socketServer.sockets.on("connection",function(e){var r=t.getRouter().addConnection({socket:e,gateway:n.get("gateway")});n.connections.add(r);var i=function(e){n.connections.remove(r),t.getRouter().removeConnection(r),r.off("disconnect",i)};r.on("disconnect",i)}),n.isListening=!0,e&&e(null),n.trigger("start")},stop:function(e){var n=this,r=n.get("server"),i=t.getRouter();return e=e||function(){},n.isListening?(n.connections.each(i.removeConnection,i),n.connections.reset(),n.isListening=!1,r.close(),n.trigger("stop"),e()):e()}});a.List=i.Collection.extend({model:a})}(this),function(e){var t=e.Monitor||require("./Monitor"),n=t.Cron,r=t._,i=t.Backbone,s=t.Config,o=t.Probe,u=t.Connection,a=t.Server,f=e.io||require("socket.io"),l=t.commonJS?require("os").hostname():null,c=t.Router=i.Model.extend({initialize:function(){var e=this;e.defaultGateway=null,e.firewall=!1,e.connections=new u.List,e.runningProbesByKey={},e.runningProbesById={}},setFirewall:function(e){var n=t.getRouter();n.firewall=e},setGateway:function(e){var t=this;return e.gateway=!1,e.firewall=!0,t.defaultGateway=t.addConnection(e)},getHostName:function(){var n=e.localStorage;return l||(n&&(l=n.hostName),l=l||t.generateUniqueId(),n&&(n.hostName=l)),l},setHostName:function(e){l=e},addConnection:function(e){var n=this;r.isUndefined(e.firewall)&&(e=r.extend({},e,{firewall:n.firewall})),e.id=t.generateUniqueCollectionId(n.connections);var i=new u(e),s=function(){n.trigger("connection:add",i)},o=function(){n.removeConnection(i),i.off("connect",s),i.off("disconnect",s)};return i.on("connect",s),i.on("disconnect",o),n.connections.add(i),i},removeConnection:function(e){var t=this;e.disconnect("connection_removed"),t.connections.remove(e),t.trigger("connection:remove",e)},connectMonitor:function(e,t){t=t||function(){};var n=this,r=e.toMonitorJSON(),i=null,s=r.probeClass;if(!s)return t("probeClass must be set");n.determineConnection(r,!0,function(s,o){if(s)return t(s);var u=function(n,r){if(n)return t(n);i=r.toJSON(),i.probeId=i.id,delete i.id,e.probe=r,e.set(i,{silent:!0}),e.probeChange=function(){e.set(r.changedAttributes())},r.on("change",e.probeChange),t(null)};o?n.connectExternal(r,o,u):n.connectInternal(r,u)})},disconnectMonitor:function(e,t,n){n=n||function(){};var r=this,i=e.probe,s=e.get("probeId");if(!i)return n("Monitor must be connected");var o=function(r){return r?n(r):(i.off("change",e.probeChange),e.probe=e.probeChange=null,e.set({probeId:null}),n(null,t))};i.connection?r.disconnectExternal(i.connection,s,o):r.disconnectInternal(s,o)},buildProbeKey:function(e){var t=e.probeClass,n=e.initParams;return n&&r.keys(n).sort().forEach(function(e){t+=":"+e+"="+n[e]}),t},determineConnection:function(e,n,r){var i=this,u=null,a=e.probeClass,f=e.hostName,l=e.appName,c=e.appInstance,h=i.getHostName().toLowerCase(),p=s.appName,d=function(t){t||(delete e.hostName,delete e.appName,delete e.appInstance);var n=function(){s(),r(null,u)},i=function(e){s(),r({msg:"connection error",err:e})},s=function(){u.off("connect",n),u.off("error",i)};if(u&&u.connecting){u.on("connect",n),u.on("error",i);return}return u&&!u.connected?(u.on("connect",n),u.on("error",i),u.connect(r)):r(null,u)};f=f?f.toLowerCase():null;if(!!f&&f!==h||!!l&&l!==p){u=i.findConnection(f,l,c);if(u)return d();if(f&&n){i.addHostConnections(f,function(n){return n?r(n):(u=i.findConnection(f,l,c),u?d():i.defaultGateway?(u=i.defaultGateway,d(!0)):r({err:"No route to host: "+t.toServerString(e)}))});return}return f?r({msg:"Not a gateway to remote monitors"}):r({msg:"No host specified for app: "+l},null)}return o.classes[a]!=null?r(null,null):i.defaultGateway?(u=i.defaultGateway,d(!0)):r({err:'Probe class "'+a+'" not available in this process'})},findConnection:function(e,t,n){var r=this,i=0;return r.connections.find(function(r){var s=!e||r.isThisHost(e),o=!t||t===r.get("remoteAppName"),u=r.get("remoteFirewall");return!u&&s&&o?i++===n:!1})},findConnections:function(e,t){var n=this;return n.connections.filter(function(n){var r=!e||n.isThisHost(e),i=!t||t===n.get("remoteAppName"),s=n.get("remoteFirewall");return!s&&r&&i})},addHostConnections:function(e,t){var n=this,r=[],i=s.MonitorMin.serviceBasePort,o=s.MonitorMin.serviceBasePort+s.MonitorMin.portsToScan-1;n.connections.each(function(t){var n=t.get("hostName").toLowerCase(),s=t.get("hostPort");n===e&&s>=i&&s<=o&&r.push(s)});var u=s.MonitorMin.portsToScan-r.length;if(u===0)return t();var a=function(){var e=this;e.off("connect disconnect error",a);if(--u===0)return t()};for(var f=i;f<=o;f++)if(r.indexOf(f)<0){var l=n.addConnection({hostName:e,hostPort:f});l.on("connect disconnect error",a,l)}},connectInternal:function(e,n){var r=this,i=r.buildProbeKey(e),s=e.probeClass,u=e.initParams,a=null,f=function(e){setTimeout(function(){if(e){if(a){delete r.runningProbesByKey[i],delete r.runningProbesById[a.id];try{a.release()}catch(t){}}return n(e)}a.refCount++,n(null,a)},0)};a=r.runningProbesByKey[i];if(!a){var l=o.classes[s];if(!l)return f({msg:"Probe not available: "+s});var c={asyncInit:!1,callback:f};try{a=new l(u,c),a.set({id:t.generateUniqueId()}),a.refCount=0,a.probeKey=i,r.runningProbesByKey[i]=a,r.runningProbesById[a.id]=a}catch(h){var p={msg:"Error instantiating probe "+s,error:h};return console.error(p),f(p)}if(c.asyncInit)return}f()},disconnectInternal:function(e,t){var n=this,r=n.runningProbesById[e];if(!r)return t("Probe not running");if(--r.refCount===0){try{r.release()}catch(i){}delete n.runningProbesByKey[r.probeKey],delete n.runningProbesById[e]}t(null,r)},connectExternal:function(e,n,r){var i=this,s=i.buildProbeKey(e),u=n.remoteProbeIdsByKey[s],a=n.remoteProbesById[u];if(!a){n.emit("probe:connect",e,function(i,f){return i?(console.error("Cannot connect to probeClass '"+e.probeClass+"' on "+t.toServerString(e),e,i),r(i)):(u=f.id,a=n.remoteProbesById[u],a?(a.refCount++,r(null,a)):(a=new o(f),a.refCount=1,a.connection=n,n.remoteProbeIdsByKey[s]=u,n.remoteProbesById[u]=a,n.addEvent("probe:change:"+u,function(e){a.set(e)}),r(null,a)))});return}return a.refCount++,r(null,a)},disconnectExternal:function(e,t,n){var r=this,i=e.remoteProbesById[t];if(!i)return n("Probe not running");if(--i.refCount===0)return i.release(),i.connection=null,delete e.remoteProbesById[t],delete e.remoteProbeIdsByKey[i.probeKey],e.removeEvent("probe:change:"+t),e.emit("probe:disconnect",{probeId:t},function(t){return t&&console.log("Probe disconnect error from host : "+e.get("hostName"),t),n(t)});n(null)}})}(this),function(e){var t=e.Monitor||require("./Monitor"),n=t.Backbone,r=t._,i="create",s="read",o="update",u="delete";t.Sync=function(e,t){if(!e)throw new Error("Sync class name must be provided");var n=new a(e,t);return function(e,t,r){return n._sync(e,t,r)}};var a=function(e,t){var n=this;n.className=e,n.options=t||{}};a.prototype._sync=function(e,r,o){var u=this;if(o.liveSync&&r instanceof n.Collection)return o.error(null,"Cannot liveSync with a collection");if(!r.has("id")){if(e!==i)return o.error(null,"ID element must be set.");r.set({id:t.generateUniqueId()},{silent:!0})}if(e===i&&o.liveSync){u._sync(e,r,{error:o.error,success:function(e){u._sync(s,r,o)}});return}var a=function(e,t){e?o.error(null,e):o.success(t)};if(r.syncMonitor||u.syncMonitor&&!o.liveSync){var f=r.syncMonitor||u.syncMonitor,l=u._getOpts(e,r);f.control(e,l,a)}else o.liveSync?u._connectInstanceMonitor(e,r,a):u._connectClassMonitor(e,r,a)},a.prototype._connectClassMonitor=function(e,n,r){var i=this,s=i._getMonitorParams(null),o=new t(s);o.connect(function(t){if(t)return r(t);i.syncMonitor=o;var s=i._getOpts(e,n);o.control(e,s,r)})},a.prototype._connectInstanceMonitor=function(e,n,i){var o=this,u,a=n.get("id"),f=function(e){if(e)return i(e);var t=function(){n.off("change",s),n.syncMonitor.off("change",o),n.syncMonitor.disconnect(),n.syncMonitor=null},s=function(e,i){i=i||{};if(r.isEqual(JSON.parse(JSON.stringify(n)),JSON.parse(JSON.stringify(n.syncMonitor.get("model")))))return;if(n.get("id")!==a)return t();i.isSyncChanging||n.save()},o=function(e,i){var s=n.syncMonitor.get("model");if(r.isEqual(JSON.parse(JSON.stringify(n)),JSON.parse(JSON.stringify(s))))return;var o=r.size(s)===0;(o||s.id!==a)&&t();var u={isSyncChanging:!0};o?n.clear(u):n.set(s,u)};n.on("change",s),n.syncMonitor.on("change",o),i(null,n.syncMonitor.get("model"))},l=o._getMonitorParams(a);u=new t(l),u.connect(function(t){if(t)return u.disconnect(),f(t);n.syncMonitor=u;if(e===s)return f();var r=o._getOpts(e,n);u.control(e,r,f)})},a.prototype._getOpts=function(e,t){var n={};switch(e){case s:case u:n.id=t.get("id");break;case i:case o:n.model=t.toJSON()}return n},a.prototype._getMonitorParams=function(e){var t=this,n=r.pick(t.options,"hostName","appName","appInstance");return n.probeClass="Sync",n.initParams={className:t.className},e&&(n.initParams.modelId=e),n}}(this),function(e){var t=e.Monitor||require("../Monitor"),n=t.Probe,r=t.Cron,i=t._,s=t.Backbone,o=1e3,u="* * * * * *",a=t.PollingProbe=n.extend({defaults:i.extend({},n.prototype.defaults,{pollInterval:null,cronPattern:u}),initialize:function(){var e=this,t=e.get("pollInterval"),i=e.get("cronPattern"),s=function(){e.poll()};n.prototype.initialize.apply(e,arguments),t==null&&i===u&&(t=o),e.poll();if(t!==0)if(t)e.timer=setInterval(s,t);else{if(!r)throw new Error("Cron is not available in this client");e.cronJob=new r.CronJob(i,s)}},release:function(){var e=this,t=e.cronJob?e.cronJob.timer:e.timer;e.cronJob&&!e.cronJob.initiated?setTimeout(function(){clearInterval(e.cronJob.timer)},1e3):e.timer&&clearInterval(t),e.timer=e.cron=null,n.prototype.release.apply(e,arguments)}})}(this),function(root){var Monitor=root.Monitor||require("../Monitor"),_=Monitor._,Backbone=Monitor.Backbone,PollingProbe=Monitor.PollingProbe,DEFAULT_DEPTH=2,Inspect=Monitor.Inspect=PollingProbe.extend({probeClass:"Inspect",initialize:function(e){var t=this;t.key=e.key,typeof e.key=="undefined"&&(t.key=typeof window=="undefined"?"global":"window"),typeof e.depth=="undefined"?!e.key&&t.key==="window"?t.depth=1:t.depth=DEFAULT_DEPTH:t.depth=e.depth,t.value=t._evaluate(t.key),t.isModel=t.value instanceof Backbone.Model,t.set({value:Monitor.deepCopy(t.value,t.depth),isModel:t.isModel}),t.isModel?t.value.on("change",t.poll,t):PollingProbe.prototype.initialize.apply(t,arguments)},release:function(){var e=this;e.isModel?e.value.off("change",e.poll,e):PollingProbe.prototype.release.apply(e,arguments)},eval_control:function(e,t){var n=this;t=typeof t=="undefined"?DEFAULT_DEPTH:t;var r=n._evaluate(e);return Monitor.deepCopy(r,t)},_evaluate:function(expression){var t=this,value=null;try{value=eval(expression)}catch(e){throw new Error("Unable to evaluate: "+expression)}return value},poll:function(){var e=this,t=e.eval_control(e.key,e.depth);_.isEqual(t,e.get("value"))||e.set({value:t})}})}(this);