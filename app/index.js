/*
 * Entry point for the watch app
 */

import document from "document";
import * as messaging from "messaging";
import { UI } from "./ui.js";

console.log("App code started");

/*
startButton.onclick = function(e) {
  console.log("click");
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send(ui.runningEntry);
  }
}
*/
let ui = new UI();

ui.status.onclick = function(e) {
  console.log("click UI STATUS");
  console.log(JSON.stringify(ui.entry))
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send(ui.entry);
  }
}

// Listen for the onopen event
messaging.peerSocket.onopen = function() {
//  ui.updateUI("loading");
  console.log("HI CONNECTJK ");
//  messaging.peerSocket.send("Hi!");
}

// Listen for the onmessage event
messaging.peerSocket.onmessage = function(evt) {
  console.log("UI onmessage");
  ui.updateUI(JSON.parse(evt.data));
  console.log(evt.data);
  if (!!JSON.parse(evt.data).data)
    console.log(JSON.parse(evt.data).data.description);
}

// Listen for the onerror event
messaging.peerSocket.onerror = function(err) {
  // Handle any errors
  //ui.updateUI("error");
  console.log("Connection error: " + err.code + " - " + err.message);
}