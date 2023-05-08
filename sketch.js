const GM_PHRASES = ["A pleasant morning to you, sir.",
"Another glorious day, sir.",
"I trust you slept well, sir.",
"A delightful morning to you, sir.",
"I hope you're feeling rested and ready to tackle the day, sir.",
"Welcome to a new day, sir.",
"May this day be filled with success and happiness, sir.",
"I trust you're prepared for the day ahead, sir.",
"Rise and shine, sir.",
"Good day to you, sir."];

const GN_PHRASES = ["A restful night to you, sir.",
"Sleep well, sir.",
"I hope you have a peaceful night, sir.",
"A pleasant night to you, sir.",
"I wish you sweet dreams, sir.",
"May you awake feeling refreshed and rejuvenated, sir.",
"Good night, sir. I will be here when you awaken.",
"I hope you enjoy a good night's rest, sir.",
"Wishing you a night of relaxation and calmness, sir.",
"Until we meet again, sir. Good night."];

// constant value from Arduino
const GM_ID = '0';
const GN_ID = '1';

let timer = 10*60; // 10 seconds * frameRate
let myVoice;
let emails = [];
let customFont;
let numberMapping = {
  1 : 'first',
  2 : 'second',
  3 : 'third',
  4 : 'fourth',
  5 : 'fifth',
  6 : 'sixth',
  7 : 'seventh',
  8 : 'eighth',
  9 : 'nineth',
  10 : 'tenth',
}

function preload() {
  customFont = loadFont('apple.TTF');
}

/* converts the json object to Map/Array object*/
function jsonToMap(jsonObject) {
  const map = new Map();
  
  // Iterate over entries of the JSON version of calendar
  for (const [key, value] of Object.entries(JSON.parse(jsonObject))) {
    // Convert array elements into maps
    if (Array.isArray(value)) {
      map.set(key, value.map((v) => jsonToMap(JSON.stringify(v))));
    }
    // Recursively convert nested objects into maps 
    else if (typeof value === 'object' && value !== null) {
      map.set(key, jsonToMap(JSON.stringify(value)));
    } 
    // Set other values
    else {
      map.set(key, value);
    }
  }
  return map;
}

/* saves events for tomorrow only with neccessary parameters */
function clearEvents() {
  const events = [];

  // iterate over each entry of the fetched events
  for (const entry of jsonToMap(CALENDAR_EVENTS).get('result').get('items')) {
    // convert ISOstring to Date format and extract hours and minutes
    const startDate = new Date(entry.get('start').get('dateTime'));
    const startTime = "" + startDate.getHours() + ":" + startDate.getMinutes();
    const endDate = new Date(entry.get('end').get('dateTime'));
    const endTime = "" + endDate.getHours() + ":" + endDate.getMinutes();

    // only save neccessary information
    events.push({'eventName' : entry.get('summary'), 'location' : entry.get('location'), 'startTime' : startTime, 'endTime' : endTime});
  }

  return events;
}

/* voices over the events happening tomorrow*/
function goodNight() {
  events = clearEvents();
  setTimeout(function() {
    const eventsLength = events.length - 1;
    let p = "Tomorrow you have " + eventsLength + " events. Your alarm is set to " + events[0]['startTime']+ " AM. " + GN_PHRASES[Math.floor(Math.random()*GN_PHRASES.length)];
    myVoice.speak(p);
    // console.log(p);
  }, 1500);

  // iterate thoruhg events and voice them over
  // timeout used since forEach does not wait for the voice to finish which gives undesired output
  for (let index = 1; index < events.length; index++) {
    const event = events[index];
    setTimeout(function() {
      console.log(numberMapping[index] + ' event is ' + event['eventName'] + ', happening from ' + event['startTime'] + ' till ' + event['endTime'] + ' at ' + event['location']);
      myVoice.speak(numberMapping[index] + ' event is ' + event['eventName'] + ', happening from ' + event['startTime'] + ' till ' + event['endTime'] + ' at ' + event['location']);
    }, index * 13000);
  }
}

/* plays morning music*/ 
function playMusic() {
  console.log("playing music");
  var audio = new Audio('mozart.mp3');
  audio.play(); 
}

/* gets IDs of the unread emails*/
function getEmailIDs() {
  const emailIDs = []; 
  
  // convert the jsonString to Object for easier access of elements
  for (const message of jsonToMap(jsonToMap(GMAIL_MAILS).get('body')).get('messages')) {
    emailIDs.push(message.get('id'));
  }
  return emailIDs;
}

/* gets data about the emails*/
function getEmails(emailIDs){
  const rawEmails = [];

  // iterate through each email ID
  emailIDs.forEach(emailID => {
    // send get request to the Gmail API
      gapi.client.gmail.users.messages.get({
        userId: 'me',
        id: emailID,
      }).then((response) => {
        // save the Object version of the reply to the array
        rawEmails.push(jsonToMap(JSON.stringify(response.result.payload.headers)));
      }).catch((error) => {
        console.log(error);
      });
  });
  return rawEmails;
}

/* clear email array from unneccessary information and only save From whom and Subject*/
function clearEmails() {
  // get the rawEmails
  const rawEmails = getEmails(getEmailIDs());
  
  // timeout to wait till the get request finishes
  setTimeout(function() {
    for (const rawEmail of rawEmails) {
      let from;
      let subject;
      // iterate over random amount of entries
      for (let i = 0; i < rawEmail.size; i++) {
        // find map that holds the From name(key)
        if (rawEmail.get("" + i).get('name') === 'From') {  
          from = rawEmail.get("" + i).get('value').split('<')[0];
        }
        // find map that holds the Subject name(key)
        if (rawEmail.get("" + i).get('name') === 'Subject') {  
          subject = rawEmail.get("" + i).get('value');
        }
      }
      // save into emails array
      emails.push({'from' : from, 'subject' : subject});
    }
  }, 3000); // time dependent on getEmails() response time
}

/* saves unread emails into GMAIL_MAILS variable*/
function loadGmail() {
  // query to get only unread emails
  var gmail_query = {'userId': 'me', 'includeSpamTrash' : false, 'q' : 'is:unread'};

  // send get request to save unread emails
  gapi.client.gmail.users.messages.list(gmail_query)
  .then(gmailAPIResponse => GMAIL_MAILS = JSON.stringify(gmailAPIResponse))
  .catch(err  => console.log(err));   // cancelled by user, timeout, etc.
}

/* voices over the Good Morning mode*/
function goodMorning() {
  // load the unread emails
  loadGmail();

  // timeout to wait till the above functions finishes execution
  setTimeout(function() {
    clearEmails();
  }, 2000);

  setTimeout(function() {
    myVoice.speak(GM_PHRASES[Math.floor(Math.random()*GM_PHRASES.length)] + "You've got " + emails.length + " emails while you were sleeping.");
    if (emails.length === 0) {
      return;
    }
    emails.forEach((email, index) => {
      setTimeout(function() {
        console.log(numberMapping[index + 1] + ' email is from ' + email.from + ' about ' + email.subject); // -> debug
        myVoice.speak(numberMapping[index + 1] + ' email is from ' + email.from + ' about ' + email.subject);
      }, (index + 1) * 10000); // wait for the previous voice to finish before starting next one
    });
    setTimeout(function() {
      myVoice.speak("Turning on music!");
    }, (emails.length + 1) * 10000);
    setTimeout(function() {
      playMusic();
    }, (emails.length + 1) * 10000 + 3000); // wait till events finishes voicing and the previous line too.
  }, 6000); // this timer is the sum of the before called timers (1000 + 3000) + 1000 extra miliseconds
}

/* changes rate of the voice when library is loaded */
function voiceReady() {
  myVoice.setRate(0.9);
  myVoice.setVoice(146); // set manly voice
}

function mousePressed() {
  // set up connection to Arduino
  setUpSerial();
}

/* reads data from Arduino */
function readSerial(data) {
  if (data != null) {
    let fromArduino = split(trim(data), "\n")[0];
    
    // if the right length, then proceed
    if (fromArduino.length == 1) {
      // calling appropriate function based on the button pressed
      
      if (fromArduino === GM_ID) {
        console.log("Called GM");
        goodMorning();
      }
      if (fromArduino === GN_ID) {
        console.log("Called GN");
        goodNight();
      }
    }
    // sending dummy variable to arduino
    writeSerial(0);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont(customFont); // change Font

  myVoice = new p5.Speech();
  myVoice.onLoad = voiceReady; // call function when p5.speech fully finishes loading

  textAlign(CENTER);
}

function draw() {
  background(0);

  textSize(50); // set the text size
  fill(255, 140, 0);
  text("Wake up to a brighter tomorrow with Akyn", width/2, 70);
  text("the device that takes care of everything, so you don't have to.", width/2, 120);

  textSize(30);
  fill(255); // set the text color to black
  text("Setup", width/2, 250);
  
  text('1. Authorize access to Google in the following page in ', width/2 - 100, 300);
  text('2. Press anywhere on the screen and select Arduino port to establish handshake', width / 2, 350);

  text("Usage", width/2, 500);
  text('Press ', width / 2 - 260, 550);
  fill(30, 255, 0);
  text('green button ', width / 2 - 140, 550);
  fill(255);
  text('to simulate Morning Routine', width / 2 + 120, 550);
  
  text('Press ', width / 2 - 233, 600);
  fill(0, 130, 255);
  text('blue button ', width / 2 - 121, 600);
  fill(255);
  text('to simulate Night Routine', width / 2 + 111, 600);

  // display timer as long as it is more than 0 seconds
  if (timer > 0) {
    textSize(100);
    fill(255, 0, 0);
    text(Math.floor(timer/60), width/2 + 265, 315);
    textSize(30);
    fill(255);
    text("seconds", width/2 + 370, 300);
    timer--;
  }
}

