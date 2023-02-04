/*
 * Entry point for the watch app
 */

import document from "document";
import * as messaging from "messaging";
import { UI } from "./ui.js";

console.log("App code started");

function sendToPeer (type, data, retries = 0) {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send({ "type" : type, "data" : data })
    console.log(`Enqueued a ${type} message, buffer now ${messaging.peerSocket.bufferedAmount}.`)
  } else if (retries > 0) {
    setTimeout(function() { sendToPeer(type, data, retries - 1) },
               100);
  } else {
    console.log(`Dropping ${type}, peer socket not ready.`)
  }
}

let ui = new UI(sendToPeer);

ui.rect.onclick = function(e) {
  //console.log("click UI STATUS");
  console.log(JSON.stringify(ui.activeEntry()))
  sendToPeer(ui.timerRunning() ? "stop": "start",
             ui.activeEntry())
}

ui.syncButton.onclick = function(e) {
  ui.syncSpinner();
  sendToPeer("sync", null)
}

let list = document.getElementById("entries-list");
let items = list.getElementsByClassName("item");

items.forEach((element, index) => {
  let touch = element.getElementById("touch-me");
  touch.onclick = (evt) => {
    //console.log(`touched: ${index}`);
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
      //console.log("index: " + index);
      //console.log(JSON.stringify(ui.recentEntries));
      //console.log("--------------------------------------");
      //console.log(JSON.stringify((ui.recentEntries[index])))
      sendToPeer("start", ui.recentEntries[index]);
      ui.switchTo(0);
    }
  }
});

// Listen for the onopen event
messaging.peerSocket.onopen = function() {
//  ui.updateUI("loading");
  console.log("UI CONNECTJK ");
//  messaging.peerSocket.send("Hi!");
}

// Listen for the onmessage event
messaging.peerSocket.onmessage = function(evt) {
  //console.log(`UI onmessage ${evt.data}`);
  ui.updateUI(JSON.parse(evt.data));
}

// Listen for the onerror event
messaging.peerSocket.onerror = function(err) {
  // Handle any errors
  //ui.updateUI("error");
  console.log("Connection error: " + err.code + " - " + err.message);
  ui.updateSyncStatus("error");
}

messaging.peerSocket.onclose = function(ev) {
  console.log("Connection closed: " + ev.code + " - " + ev.reason);
  ui.updateSyncStatus("error");
}
