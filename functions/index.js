const functions = require('firebase-functions');
const admin = require('firebase-admin');
const FieldValue = admin.firestore.FieldValue;
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://bbaembot.firebaseio.com'
});

let db = admin.firestore();

let addSwitchStatus = (name, value) => {
  let model = { name: name, value: value, created: FieldValue.serverTimestamp() };
  return db.collection('switch').add(model)
};

let makeSimpleTextJson = (message) => {
  return {
    version: '2.0',
    template: {
      outputs: [
        {
          simpleText: {
            text: message
          }
        }
      ]
    }
  }
};

exports.getSwitch = functions
.region('asia-northeast1')
.https.onRequest((req, res) => {
  const name = req.body.action.params.name;

  db.collection('switch')
    .where('name', '==', name)
    .orderBy('created', 'desc')
    .limit(1)
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        return res.status(200).json(makeSimpleTextJson(`${name} 스위치가 없습니다.`))
      }
      
      let doc;
      snapshot.forEach((_doc) => {
        doc = _doc;
      })
      if (typeof doc.data()['value'] !== 'boolean') {
        return res.status(500).json({
          error: {
            message: 'value type error'
          }
        })
      }
      const valueText = doc.data()['value'] ? '켜져있습니다.' : '꺼져있습니다.';
      return res.status(200).json(makeSimpleTextJson(`${name} 스위치가 ${valueText}`))
    })
    .catch(err => {
      console.log('Error getting documents', err);
    });
});

exports.setSwitch = functions
.region('asia-northeast1')
.https.onRequest((req, res) => {
  const name = req.body.action.params.name;
  const value = req.headers['value'] === 'true'
  addSwitchStatus(name, value)
    .then(_ => {
      const valueText = value ? '켭니다.' : '끕니다.'
      return res.status(200).json(makeSimpleTextJson(`${name} 스위치를 ${valueText}`));
    })
    .catch(err => {
      return res.status(500).json({
        error: err
      })
    })
});