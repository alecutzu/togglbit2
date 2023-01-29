import document from "document";
import clock from "clock";
import { battery, charger } from "power";
import { preferences } from "user-settings";
import { today } from 'user-activity';
import { sleep } from 'sleep';
import { vibration } from "haptics";
import { me } from "appbit";
import { HeartRateSensor } from "heart-rate";

clock.granularity = "minutes";
// XXX configurable
me.appTimeoutEnabled = false;

var runningEntry = null;
var durationLabel = null;
var lastTo = 0;

const ENTRY_COUNT = 10;

const playIcon = document.getElementById("play-icon");
const stopIcon = document.getElementById("stop-icon");

const timeText = document.getElementById("time");
const dateText = document.getElementById("date");
const dowText = document.getElementById("dow");
const battIcon = document.getElementById("batt");
const logText  = document.getElementById("log");

var hrm = null;
var settings = {};

export function UI() {
  this.circle = document.getElementById("circle");
  this.rect = document.getElementById("play-rect");
  this.entryProj = document.getElementById("entry-proj");
  this.entryDesc = document.getElementById("entry-desc");
  durationLabel = document.getElementById("duration");
  this.views = document.getElementById("views");
  this.todayLabel = document.getElementById("today-total");
  this.weekLabel = document.getElementById("week-total");
  this.syncButton = document.getElementById("sync-button");
  this.syncArc = document.getElementById("sync-arc");
  this.syncStyle = document.getElementsByClassName("sync-status");
  this.notification = document.getElementById("notification");
  this.notificationArea = document.getElementById("notification-area");


  this.timer = null;
  this.entry = null;
  this.recentEntries = [];

  // Recent entries
  this.tiles = [];

  let list = document.getElementById("entries-list");
  this.tiles = list.getElementsByClassName("item");

  // Summary Day Pies
  this.dayPies = [];
  this.dayPies = document.getElementsByClassName("total-pie-day");

/*
  // Summary Week Pies
  this.weekPies = [];
  this.weekPies = document.getElementsByClassName("total-pie-week");
  */
}

UI.prototype.updateUI = function(data) {
  //console.log("updateUI");
  if (data.type === "settings") {
    this.updateSettings(data.data.key, data.data.value);
  } if (data.type === "current-entry") {
    this.updateNotification(null);
    this.updateTimer(data.data);
    this.updateSyncStatus("ok")
  } else if (data.type === "entry-stop") {
    this.updateTimer(null);
    this.updateSyncStatus("ok")
  } else if (data.type === "unique") {
    this.updateRecentList(data.data);
    this.updateSyncStatus("ok")
  } else if (data.type === "summary") {
    this.updateSummary(data.data);
    this.updateSyncStatus("ok")
  } else if (data.type === "error") {
    this.updateNotification(data.data.message);
    this.updateSyncStatus("error")
  }
}

UI.prototype.updateSettings = function(key, value) {
  console.log(`Setting ${key} now ${value}`);
  settings[key] = value;
}

UI.prototype.updateNotification = function(message) {
  console.log("Update notification: " + message);
  this.notification.text = message;
  this.notification.style.display = !!message ? "inline": "none";
  this.notificationArea.style.display = !!message ? "inline": "none";
}

UI.prototype.syncSpinner = function(index) {
  //console.log("sync");
  this.syncArc.animate("enable");
}

UI.prototype.updateSyncStatus = function(status) {
  console.log(`Update sync status: ${status}`);
  let color = status === "ok" ? "fb-green" : "fb-red";
  this.syncStyle.forEach((el) => { el.style.fill = color });
}

UI.prototype.switchTo = function(index) {
  this.views.value = index;
}

UI.prototype.updateTimer = function(data) {
  var label,
    color = "#ffffff";

  runningEntry = data;
  this.entry = data;
  if (!!data) {
    //Running entry

    this.entryProj.text = data.project;
    this.entryDesc.text = data.description;

    if (!!data.project) {
      color = data.c;
    }
    
    this.entryProj.style.fill = color;
    this.entryDesc.style.fill = color;

    this.circle.style.fill = "#ff897a";
    toggleRunning(true);
    updateDuration();
  } else {
    durationLabel.text = "";
    this.entryProj.text = "";
    this.entryDesc.text = "";
    this.circle.style.fill = "#e57cd8";
    toggleRunning(false);
    this.updateNotification("No Running Time entry.\nTap on play button to start");
  }
}

UI.prototype.updateRecentList = function(data) {
  this.recentEntries = data;
  for (let i = 0; i < ENTRY_COUNT; i++) {
    let tile = this.tiles[i];
    if (!tile) {
      continue;
    }

    const entry = data[i];
    if (!entry) {
      tile.style.display = "none";
      continue;
    }

    tile.style.display = "inline";
    tile.getElementById("desc").text = entry.d;
    if (!!entry.p) {
      tile.getElementById("proj").text = entry.p;
      tile.getElementById("proj").style.fill = entry.c;
    }
  }
}

UI.prototype.updateSummary = function(data) {
  this.todayLabel.text = data.today;
  this.weekLabel.text = data.week;


  // Setup Pie chart
  /*
  let c = 1;
  let key;
  let array = data.todayPie;
  let arc;
  let anim;

  for (key in array) {
    if (array.hasOwnProperty(key)) {
      arc = this.dayPies[c].getElementById("total-arc");
      console.log(c + ".) " + key + " | " + arc.style.fill);
      arc.style.fill = array[key].c;
      console.log(c + ".) " + key + " | " + arc.style.fill);

      
      anim = this.dayPies[c].getElementById("anim");
      anim.from = parseInt(array[key].f);
      anim.to = parseInt(array[key].t);
      
      this.dayPies[c].animate("enable");
      console.log(array[key].c + " -> (" + anim.from +" - " + anim.to +")");
      c++;
    }
  }
*/
}

var toggleRunning = function(running) {
  if (running) {
    durationLabel.style.display = "inline";
    playIcon.style.display = "none";
    stopIcon.style.display = "inline";
  } else {
    durationLabel.style.display = "none";
    stopIcon.style.display = "none";
    playIcon.style.display = "inline";
  }
  
  hrmToggle(running);
}

var updateDuration = function() {
  console.log("Calc duration");
  let now = new Date();
  let duration = now - new Date(runningEntry.start);
  let minutes = parseInt((duration / (1000 * 60)) % 60, 10);
  let hours = parseInt(duration / (1000 * 60 * 60), 10);

  hours = hours < 10 ? '0' + hours : hours;
  minutes = minutes < 10 ? '0' + minutes : minutes;

  durationLabel.text = hours + ":" + minutes;
}

function zeroPad(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}

function updateClock (evt) {
  let today = evt.date;
  let hours = today.getHours();
  let suffix = "";
  if (preferences.clockDisplay === "12h") {
    // 12h format
    if (hours > 12) {
      suffix = "pm";
    } else {
      suffix = "am";
    }
    hours = hours % 12 || 12;
  } else {
    // 24h format
    hours = zeroPad(hours);
  }
  let mins = zeroPad(today.getMinutes());
  timeText.text = `${hours}:${mins}${suffix}`;

  let day = today.getDate();
  let month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
               "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][today.getMonth()];

  let dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][today.getDay()];
  
  dateText.text = `${day} ${month}`;
  dowText.text = `${dow}`

  //logText.text = "appTimeoutEnabled: " + me.appTimeoutEnabled;
}

function updateBatt (evt) {
  if (charger.connected) {
    battIcon.href="images/batt_charging.png"
  } else {
    let charge = Math.round(battery.chargeLevel / 25) * 25;
    battIcon.href = `images/batt_${charge}.png`;
  }
}


clock.ontick = e => {
  if (!!runningEntry) {
    updateDuration();
  }
  
  updateClock(e);
  updateBatt(e);
}

charger.onchange = (evt) => {
  updateBatt(evt)
}


// XXX configurable
if (sleep) {
  console.log("Sleep detection is on");
  sleep.onchange = () => {
    console.log(`User sleep state is: ${sleep.state}`)
    if (sleep.state == "asleep") {
      vibration.start("nudge");
    }
  }
}


// XXX configurable
if (HeartRateSensor) {
  console.log("Heart rate and step monitoring is on");
  
  hrm = new HeartRateSensor();
  
  let lastSteps = 0;
  let lastTime = 0;
  let lastHr = 0;
  let counter = 2;

  hrm.addEventListener("reading", () => {
    let steps = today.local.steps;
    let hr = hrm.heartRate;
    let now = new Date();
    
    if (lastTime) {
      if (steps > lastSteps) {
        if (counter > 0) {
          counter -= 1;
          if (counter == 0)
          {
            vibration.start("bump");
            vibration.stop();
          }
        } 
      } else {
        if (counter < 3)
        {
          counter += 1;

          if (counter == 3) {
            vibration.start("bump");
            vibration.stop();
          }
        }
      }
    }

    lastTime = now;
    lastSteps = steps;
    lastHr = hr;

    //console.log(`Steps ${steps} counter ${counter} hr ${hr}`);
    
  });
} 

function hrmToggle (on) {
  //console.log(`Toggle hrm: ${on} afkDetection is ${!!settings["trackAfk"]}`);
  if (!!hrm) {
    if (on && !!settings["trackAfk"]) {
      hrm.start();
    } else {
      hrm.stop();
    }
  }
}

