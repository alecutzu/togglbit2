import { me } from "companion";
import * as messaging from "messaging";
import { API } from "./api.js"
import { settingsStorage } from "settings";

let Api = new API();
let userData = {
  info : null,
  time_entries : [],
  projects : [],
}
const apiError = "Sync error - please make sure you have set up Toggl API token in Fitbit mobile app";

// Listen for the onopen event
messaging.peerSocket.onopen = function() {
  // Ready to send or receive messages
  restoreSettings();
  getUserData();
}

// Listen for the onmessage event
messaging.peerSocket.onmessage = function(evt) {
  // Output the message to the console
  //console.log("COMPANION MESSAGE");
  //console.log(JSON.stringify(evt.data));
  if (evt.data.type === "stop") {
    stopEntry(evt.data.data)
  } else if (evt.data.type === "sync") {
    getUserData();
  } else {
    startEntry(evt.data);
  }
}

// Listen for the onerror event
messaging.peerSocket.onerror = function(err) {
  // Handle any errors
  console.log("Connection error: " + err.code + " - " + err.message);
}

function sendToPeer (type, data, retries = 0) {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send(JSON.stringify({ "type" : type,
                                               "data" : data }))
  } else if (retries > 0) {
    setTimeout(function() { sendToPeer(type, data, retries - 1) },
               100);
  } else {
    console.log(`Dropping ${type}, peer socket not ready.`)
  }
}

function sendCurrentEntry (entry, retries = 0) {
    if (!!entry) {
      let projName = ''
      let color = '#ffffff'
      const proj = findById(entry.pid, userData.projects);
      
      if (!!proj) {
        projName = proj.name
        
        if (!!proj.color)
          color = proj.color
      }
      
      sendToPeer("current-entry",
                 {
                   "id": entry.id,
                   "description": entry.description || "",
                   "duration": entry.duration,
                   "start": entry.start,
                   "project": projName,
                   "c" : color
                 },
                retries)
    } else {
      sendToPeer("entry-stop", null)
    }
}


function startEntry(entry) {
  let te, p, c;
  if (!!entry) {
    te = findById(entry.id, userData.time_entries);
  }
  Api.startEntry(te).then(function(data) {
    sendCurrentEntry(JSON.parse(data));
  }).catch(function (e) {
    console.log(`Exception: ${e}`);
    sendToPeer('error', {'message' : apiError})
  });
}

function stopEntry(entry) {
  Api.stopEntry(entry).then(function(data) {
    sendToPeer("entry-stop", null)
  }).catch(function (e) {
    console.log(`Exception: ${e}`);
    sendToPeer('error', {'message' : apiError})
  });
}

function getUserData () {
  Api.fetchUser().then(data => {
    userData.info = JSON.parse(data);
    getTimeEntries();
  }).catch(e => {
    console.log(`Exception: ${e}`);
    sendToPeer('error', {'message' : apiError})
  })
}


function getTimeEntries () {
  Api.fetchUser('/time_entries').then(data => {
    userData.time_entries = JSON.parse(data);
    getProjects();
  }).catch (e => {
    console.log(`Exception: ${e}`);
    sendToPeer('error', {'message' : apiError})
  })
}


function getProjects () {
  Api.fetchUser('/projects').then(data => {
    userData.projects = JSON.parse(data)
    getCurrentEntry()
    setTimeout(generateRecentEntries, 100)
    setTimeout(calculateSummary, 100)
  }).catch (e => {
    console.log(`Exception: ${e}`);
    sendToPeer('error', {'message' : apiError})
  })
}


function getCurrentEntry () {
  Api.fetchUser('/time_entries/current').then(data => {
    sendCurrentEntry(JSON.parse(data));
  }).catch (e => {
    console.log(`Exception: ${e}`);
    sendToPeer('error', {'message' : apiError})
  })
}


// A user changes Settings
settingsStorage.onchange = evt => {
  if (evt.key === "token") {
    // Settings page sent us an Api token
    let data = JSON.parse(evt.newValue);
    Api.setToken(data.name);
    getUserData();
  } else if (evt.key === "description") {
  } else {
    updateDeviceSettings(evt.key,
                         JSON.parse(settingsStorage.getItem(evt.key)));
  }
};

// Restore previously saved settings and send to the device
function restoreSettings() {
  for (let index = 0; index < settingsStorage.length; index++) {
    let key = settingsStorage.key(index);
    if (key && key === "token") {
      // We already have a token, get it
      let data = JSON.parse(settingsStorage.getItem(key))
      Api.setToken(data.name);
    }
    if (key && key === "description") {
      // We already have a token, get it
      let data = JSON.parse(settingsStorage.getItem(key))
      Api.setDescription(data.name);
    }

    if (key && key === "trackAfk") {
        updateDeviceSettings(key,
                             JSON.parse(settingsStorage.getItem(key)));
    }
  }
}

function findById(id, array) {
  let key;
  for (key in array) {
    if (array.hasOwnProperty(key) && array[key].id === id) {
      return array[key];
    }
  }

  return undefined;
}


function generateRecentEntries() {
  var entries = userData.time_entries || [];
  var listEntries = [],
    numOfEntries = 10,
    i,
    obj,
    te;

  
  var checkUnique = function (te) {
    var j, obj, p;

    if (!te.description && !te.pid) {
      return false;
    }

    if (!te.description) {
      te.description = "(no description)";
    }

    if (listEntries.length > 0) {
      for (j = 0; j < listEntries.length; j++) {
        if (!!te.description
          && listEntries[j].d === te.description
          && listEntries[j].pid === te.pid ) {
          return false;
        }
        if (te.id == listEntries[j].id) {
          return false;
        }
      }
    }

    obj = {
      "id": te.id,
      "d": te.description
    };

    p = findById(te.pid, userData.projects);

    if (!!p) {
      obj.p = p.name;
      obj.pid = te.pid;
      obj.c = p.color;
    }
    listEntries.push(obj);
    return te;
  };

  if (!!entries) {
    for (i = entries.length - 1; i >= 0; i--) {
      checkUnique(entries[i]);
      if (listEntries.length >= numOfEntries) {
        break;
      }
    }
  }

  sendToPeer("unique", listEntries, 10)
}


function calculateSummary() {
  let todaySum = 0;
  let weekSum = 0;
  let todayItems = 0;
  let weekItems = 0;
  let dur;
  let p;
  let pname;
  const timeEntries = userData.time_entries || [];

  const now = new Date();
  now.setHours(0, 0, 0, 0); // Get today's date at midnight for the local timezone
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Get today's date at midnight for the local timezone

  const getWeekStart = function (d) {
    const startDay = userData.beginning_of_week;
    const day = d.getDay();
    const diff = d.getDate() - day + (startDay > day ? startDay - 7 : startDay);
    return new Date(d.setDate(diff));
  };

  const weekStart = getWeekStart(now);
  let todayPie = {};
  let weekPie = {};

  timeEntries.forEach(function (entry) {
    // Calc today total
    if (new Date(entry.start).getTime() > today.getTime()) {
      if (entry.duration < 0) {
        dur = ((new Date() - new Date(entry.start)) / 1000);
      } else {
        dur = entry.duration;
      }
      todaySum += dur;

      // Today Pie - project name, color, total duration
      p = findById(entry.pid, userData.projects);
      pname = "No project";
      if (!!p) {
        pname = p.name;
      }

      if (!todayPie[pname]) {
        todayItems++;
        todayPie[pname] = { 
          d: 0,
          c: (!!p) ? p.hex_color: "#ffffff"
        };
      }
      todayPie[pname].d += dur;
    }

    // Calc week total
    if (new Date(entry.start).getTime() > weekStart.getTime()) {
      if (entry.duration < 0) {
        dur = ((new Date() - new Date(entry.start)) / 1000);
      } else {
        dur = entry.duration;
      }
      weekSum += dur;

      // Week Pie - project name, color, total duration
      p = findById(entry.pid, userData.projects);
      pname = "No project";
      if (!!p) {
        pname = p.name;
      }

      if (!weekPie[pname]) {
        weekItems++;
        weekPie[pname] = { 
          d: 0,
          c: (!!p) ? p.hex_color : "#ffffff"
        };
      }
      weekPie[pname].d += dur;
    }
  });

  let from = 0;
  let c = 1;

  // Today pie
  for (const index in todayPie) {
    if (todayPie.hasOwnProperty(index)) {
      todayPie[index]["f"] = from;
      
      if (todayItems == c) {
        todayPie[index]["t"] = 359;
      } else {
        todayPie[index]["t"] = from + parseInt(todayPie[index].d / todaySum * 360, 10);
      }
      from = todayPie[index]["t"];
      c++;
    }
  }

  // Week pie
  /*
  weekPie.forEach((element, index) => {

  })
  */

  sendToPeer('summary',
             {
               today: secToHHMM(todaySum),
               week: secToHHMM(weekSum),
               todayPie: {}, //todayPie,
               weekPie: {} //weekPie
             },
            3);
}

function secToHHMM(sum) {
  const hours = Math.floor(sum / 3600);
  const minutes = Math.floor((sum % 3600) / 60);
  return hours + 'h ' + minutes + 'm';
}

function updateDeviceSettings (key, value) {
  console.log(`Sending settings: ${key} ${value}`);
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    var obj = {
      "type": "settings",
      "data": {
          "key": key,
          "value": value
      }
    };
    
    messaging.peerSocket.send(JSON.stringify(obj));
  }
    
}
