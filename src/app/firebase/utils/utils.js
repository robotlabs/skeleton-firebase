
import firebase from 'firebase/app'
import { MAX_USERS } from './../../app-constants'
const identities = [
  'red',
  'yellow',
  'blue',
  'orange'
]
const toomanyUsers = 'There is already a game in progress. Please join in next time!'

export const firebaseStartup = (config) => {
  var firebaseConfigNative = {
    apiKey: 'AIzaSyB4sksC3eQtJn1CDvJ560d9BgVZl0ALZnw',
    authDomain: 'multiplayer-quiz-a82d4.firebaseapp.com',
    databaseURL: 'https://multiplayer-quiz-a82d4.firebaseio.com',
    projectId: 'multiplayer-quiz-a82d4',
    storageBucket: 'multiplayer-quiz-a82d4.appspot.com',
    messagingSenderId: '579036913427',
    appId: '1:579036913427:web:631b246ac69421d08e04e6',
    measurementId: 'G-2F78GLRPN9'
  }

  // Initialize Firebase
  firebase.initializeApp(firebaseConfigNative)
}
export const isRoomCheck = (roomId, db) => {
  return new Promise(resolve => {
    db.collection('rooms')
      .onSnapshot((querySnapshot) => {
        if (querySnapshot.empty) {
          resolve(false)
        } else {
          querySnapshot.forEach(function (doc) {
            if (doc.id === 'room' + roomId) {
              resolve(true)
            }
          })
          resolve(false)
        }
      })
  })
}
export const createRoom = async (roomId, db, uid) => {
  return new Promise(resolve => {
    db.collection('rooms').doc('room' + +roomId).set({
      status: 'IS-INTRO',
      roomId,
      users: [
        {
          nickname: identities[0],
          roomId,
          uid,
          timer: -1
        }
      ]
    })
      .then(function () {
        resolve({ success: true, identity: identities[0] })
      })
      .catch(function (error) {
        console.error('Error writing document: ', error)
        resolve(false)
      })
  })
}

export const xxxcreateRoom = async (roomId, db, uid) => {
  return new Promise(resolve => {
    db.collection('rooms').doc('room' + +roomId).set({
      status: 'IS-INTRO',
      roomId,
      users: [
        {
          nickname: identities[0],
          roomId,
          uid,
          timer: -1
        }
      ]
    })
      .then(function () {
        resolve({ success: true, identity: identities[0] })
      })
      .catch(function (error) {
        console.error('Error writing document: ', error)
        resolve(false)
      })
  })
}

export const joinRoom = async (roomId, db, uid) => {
  return new Promise(resolve => {
    const roomRef = db.collection('rooms').doc('room' + roomId)
    roomRef.get()
      .then((doc) => {
        if (doc.exists) {
          const status = doc.data().status
          //* * bad. just for prototype. this function shouldn't be aware about the status */
          if (status === 'IS-LAUNCHING' || status === 'IS-PLAYINGxx') {
            resolve({ success: false, error: toomanyUsers })
            return
          }
          const users = doc.data().users
          let isUidAlreadyRegistered = false
          if (users) {
            if (users.length > 0) {
              users.forEach((d) => {
                if (d.uid === uid) {
                  isUidAlreadyRegistered = true
                  let nextStatus = 'IS-WAITING'
                  const ll = getlUsersL(doc.data())
                  if (ll >= MAX_USERS) {
                    nextStatus = 'IS-LAUNCHING'
                  }
                  const firebaseAction = roomRef.update({
                    status: nextStatus,
                    roomId
                  })
                  firebaseAction
                    .then(() => {
                      resolve({ success: true, usersL: getlUsersL(doc.data()), identity: identities[getlUsersL(doc.data())] })
                    })
                    .catch((e) => {
                      console.error(': error ', e)
                      resolve({ success: false, usersL: getlUsersL(doc.data()) })
                    })
                  // resolve({ success: true, usersL: getlUsersL(users) })
                }
              })
            }
          }

          if (!isUidAlreadyRegistered) {
            if (users.length >= 4) {
              resolve({ success: false, error: toomanyUsers })
              return
            }
            let firebaseAction
            //* * more than user */

            const ll = getlUsersL(doc.data())
            if (ll > 0) {
              //* * MORE THEN ONE PLAYER */
              let nextStatus = doc.data().status
              if (ll >= MAX_USERS) {
                nextStatus = 'IS-LAUNCHING'
              }
              firebaseAction = roomRef.update({
                status: nextStatus,
                roomId,
                users: [{
                  nickname: identities[getlUsersL(doc.data())],
                  roomId,
                  uid
                  // status: 'online'
                }, ...users]
              })
            } else {
              //* * FIRST PLAYER */
              const nextStatus = doc.data().status
              //* * first user */
              firebaseAction = roomRef.set({
                status: nextStatus,
                roomId,
                timer: -1,
                users: [{
                  nickname: identities[getlUsersL(doc.data())],
                  roomId,
                  uid
                  // status: 'online'
                }]
              })
            }
            firebaseAction
              .then(() => {
                resolve({ success: true, usersL: getlUsersL(doc.data()), identity: identities[getlUsersL(doc.data())] })
              })
              .catch((e) => {
                console.error(': error ', e)
                resolve({ success: false, usersL: getlUsersL(doc.data()), identity: identities[getlUsersL(doc.data())] })
              })
          }
        }
      })
  })
}
const getlUsersL = (dataUsers) => {
  const users = dataUsers.users
  let usersL = 0
  for (let i = 0; i < users.length; i++) {
    if (dataUsers[users[i].uid]) {
      usersL++
    }
  }
  return usersL
}

export const onDisconnectSetup = async (roomId, db, dbRT, uid) => {
  var userStatusDatabaseRef = firebase.database().ref('/status/' + uid)
  userStatusDatabaseRef.set({})
  var userStatusFirestoreRef = firebase.firestore().doc('/status/' + uid)
  var isOfflineForDatabase = {
    state: 'offline',
    id: roomId,
    last_changed: firebase.database.ServerValue.TIMESTAMP
  }

  var isOnlineForDatabase = {
    state: 'online',
    id: roomId,
    last_changed: firebase.database.ServerValue.TIMESTAMP
  }
  // Firestore uses a different server timestamp value, so we'll
  // create two more constants for Firestore state.
  var isOfflineForFirestore = {
    state: 'offline',
    id: roomId,
    last_changed: firebase.firestore.FieldValue.serverTimestamp()
  }

  // var isOnlineForFirestore = {
  //   state: 'online',
  //   id: roomId,
  //   last_changed: firebase.firestore.FieldValue.serverTimestamp()
  // }

  firebase.database().ref('.info/connected').on('value', function (snapshot) {
    if (snapshot.val() === false) {
      // Instead of simply returning, we'll also set Firestore's state
      // to 'offline'. This ensures that our Firestore cache is aware
      // of the switch to 'offline.'
      userStatusFirestoreRef.set(isOfflineForFirestore)
      return
    };

    userStatusDatabaseRef.onDisconnect().set(isOfflineForDatabase).then(function () {
      userStatusDatabaseRef.set(isOnlineForDatabase)
      // We'll also add Firestore set here for when we come online.
      // userStatusFirestoreRef.set(isOnlineForFirestore)

      const roomRef = db.doc('rooms/room' + roomId)
      const updateUsers = {}
      updateUsers[`${uid}`] = true
      if (roomRef) {
        roomRef.update(updateUsers).catch((e) => {
          console.error(': error ', e)
        })
      }
    })
  })
}
export const getUrlVars = () => {
  const vars = {}
  window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
    vars[key] = value
  })
  return vars
}
