import { Base64 } from "./base64.js"

export function API(apiKey) {
};

let ApiUrl = "https://api.track.toggl.com/api/v9"
let default_wid
let CreatedWith = "TogglBit2";
let credentials;
let entryDescription = "";
let base64 = new Base64();

API.prototype.setDescription = function(description) {
  console.log("API: set entry description - " + description);
  entryDescription = description;
}

API.prototype.setToken = function(token) {
  console.log("API: set token - " + token);
  credentials = 'Basic ' + base64.encode(token + ':api_token');
}

function dump (o, d = {}, i = '') {
  var r = ''
  
  if (typeof(o) == 'string')
    r += `'${o}'`
  else if (typeof(o) == 'number')
    r += `${o}`
  else
  {
    r += `${i} {\n`
    for (const k in o) {
      r += `${i}   ${k} : ${dump(o[k], d, i + '    ')}\n`
    }
    r += `${i} }\n`
  }

  return r
}


API.prototype.fetchUser = function(sub = "") {
  let self = this;
  console.log(`API: Fetch User Data: me${sub}`);
  return new Promise(function(resolve, reject) {
    let url = ApiUrl + "/me" + sub;

    //console.log(`API: URL is ${url}`);
    
    var obj = {  
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': credentials
    }};

    //console.log(`Request is ${dump(obj)}`)
    
    fetch(url, obj)
//      .then(r => {console.log(`Got ${dump(r)}`); return r; })
    .then(response => response.json())
    .then(data => {
      if (!!data && !!data.default_workspace_id)
        default_wid = data.default_workspace_id
      
      //console.log("Got JSON response from server:" + JSON.stringify(data));
      resolve(JSON.stringify(data));
    }).catch(function (error) {
      console.log(`Error fetching ${url}:\n ${error}`);
      reject(error);
    });
  });
}


API.prototype.stopEntry = function(timeEntry) {
  let self = this;
  console.log("API - Stop Entry ");
  return new Promise(function(resolve, reject) {
    let url = ApiUrl + "/workspaces/" + default_wid + "/time_entries/" + timeEntry.id;
    const stopTime = new Date();
    const startTime = new Date(-timeEntry.duration * 1000);
    const entry = {
      id : timeEntry.id,
      stop: stopTime.toISOString(),
      duration: Math.floor((stopTime - startTime) / 1000)
    };
    
    var obj = {  
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': credentials
      },
      body: JSON.stringify(entry)
    }

    //console.log(`API: url ${url} obj ${JSON.stringify(obj)}`);
    
    fetch(url, obj)
    .then(response => response.json())
    .then(data => {
      //console.log("STOP Got JSON response from server:" + JSON.stringify(data));
      resolve(JSON.stringify(data));
    }).catch(function (error) {
      console.log(`Error fetching ${url}:\n ${JSON.stringify(error)}`);
      reject(error);
    });
  });

}

API.prototype.startEntry = function(timeEntry) {
  let self = this;
  console.log("API - Start Entry");
  return new Promise(function(resolve, reject) {
    let url = ApiUrl + "/workspaces/" + default_wid + "/time_entries";
    const start = new Date();
    let entry;

    if (!!timeEntry) {
      entry = {
        start: start.toISOString(),
        stop: null,
        duration: -parseInt(start.getTime() / 1000, 10),
        description: timeEntry.description,
        pid: timeEntry.pid,
        tid: timeEntry.tid || null,
        wid: timeEntry.wid || default_wid,
        tags: timeEntry.tags || null,
        billable: timeEntry.billable || false,
        created_with: CreatedWith
      };
    } else {
      entry = {
        start: start.toISOString(),
        stop: null,
        duration: -parseInt(start.getTime() / 1000, 10),
        description: entryDescription,
        pid: null,
        tid: null,
        wid: default_wid,
        tags: null,
        billable: false,
        created_with: CreatedWith
      };
    }

    var obj = {  
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': credentials
      },
      body: JSON.stringify(entry)
    };

    //console.log(`API: url ${url} obj ${JSON.stringify(obj)}`);
    
    fetch(url, obj)
    //.then(r => {console.log(`Got ${dump(r)}`); return r; })
    .then(response => response.json())
    .then(data => {
      //console.log("START Got JSON response from server:" + JSON.stringify(data));
      resolve(JSON.stringify(data));
    }).catch(function (error) {
      console.log(`Error fetching ${url}:\n ${JSON.stringify(error)}`);
      reject(error);
    });
  });
}
