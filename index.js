// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const admin = require('firebase-admin');
admin.initializeApp();
admin.firestore().settings( { timestampsInSnapshots: true });
const db = admin.firestore();
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  function reservation(agent) {
	let id = agent.parameters.reservationnumber.toString();
	let collectionRef = db.collection('reservations');
	let userDoc = collectionRef.doc(id);
	return userDoc.get()
		.then(doc => {
			if (!doc.exists) {
				agent.add('I could not find your reservation.');
			} else {
				db.collection('reservations').doc(id).update({
					newname: agent.parameters.newname
				}).catch(error => {
					console.log('Transaction failure:', error);
					return Promise.reject();
				});
				agent.add('Ok. I have updated the name on the reservation.');
			}
			return Promise.resolve();
		}).catch(() => {
			agent.add('Error reading entry from the Firestore database.');
		});
}
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }
  let intentMap = new Map();
  intentMap.set('name.reservation-getname', reservation);
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  // intentMap.set('your intent name here', yourFunctionHandler);
  // intentMap.set('your intent name here', googleAssistantHandler);
  agent.handleRequest(intentMap);
});
