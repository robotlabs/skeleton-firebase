import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import 'firebase/database'

// import firebaseConfig from './../firebase-example-account-details'
import firebaseConfig from './../firebase-gitignored-account-details'

import { isAuth } from './auth/auth'
import { onDisconnectSetup } from './utils/utils'

export const IS_ERROR = 'is-error'
export const IS_FIRESTORE_ROOM_WAITING = 'is-firestore-room-waiting'

const identities = [
  'red',
  'yellow',
  'blue',
  'orange'
]

class Firebase {
  async init (settings) {
    this.settings = settings
    this.setupConnection()
    this.uid = await this.login()
    return this.uid
  }

  async login () {
    //* * Login */
    const uid = await isAuth(firebase)
    return uid
  }

  //* * Activity update game room */
  onGameRoomUpdate = (roomUpdate) => {
    console.log('on game room update')
    const roomRefUpdate = this.db.collection('rooms').doc('room' + this.roomId)
    roomRefUpdate.update(roomUpdate)

    // firebaseAction
    // .then(() => {
    // })
    // .catch((e) => {
    //   console.error(': error ', e)
    // })
  }

  activeListeners () {
    this.roomId = Number(this.roomId)
    const roomRef = this.db.collection('rooms')

    roomRef.where('status', '==', IS_FIRESTORE_ROOM_WAITING).where('roomId', '==', this.roomId)
      .onSnapshot((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          this.settings.onGameWaiting(doc.data(), this.me)
        })
      })
  }

  getRandomNumberNotInArray (array) {
    const rn = Math.floor(Math.random() * 1000)
    if (array.includes(rn)) {
      return this.getRandomNumberNotInArray(array)
    }
    return rn
  }

  setupDisconnect () {
    onDisconnectSetup(this.roomId, this.db, this.dbRT, this.uid)
  }

  getRoomData (urlId) {
    this.roomId = Number(urlId)
    return new Promise((resolve, reject) => {
      const roomRef = this.db.collection('rooms').doc('room' + urlId)
      roomRef.get()
        .then((doc) => {
          if (doc.exists) {
            const data = doc.data()
            resolve(data)
          } else {
            resolve()
          }
        })
    })
  }

  slaveJoinRoom (slaveId) {
    return new Promise((resolve, reject) => {
      this.roomId = slaveId
      const roomRef = this.db.collection('rooms').doc('room' + slaveId)
      roomRef.get()
        .then((doc) => {
          if (doc.exists) {
            const usersObj = doc.data().usersObj
            const me = {
              nickname: identities[Object.keys(usersObj).length],
              roomId: Number(slaveId),
              uid: this.uid,
              master: false,
              online: true
            }
            this.me = me
            const newUsersObj = {
              [this.uid]: me,
              ...usersObj
            }
            const firebaseAction = roomRef.update({
              usersObj: newUsersObj
            })

            firebaseAction
              .then(() => {
                resolve(newUsersObj)
              })
              .catch((e) => {
                this.masterAddRoom()
              })
          } else {
            this.masterAddRoom()
          }
        })
    })
  }

  masterAddRoom (id) {
    return new Promise((resolve, reject) => {
      const roomList = []
      const roomsCollection = this.db.collection('rooms')
      const unsubscribe = roomsCollection
        .onSnapshot((querySnapshot) => {
          querySnapshot.forEach(function (doc) {
            //* * get all room IDs */
            roomList.push(Number(doc.id.replace('room', '')))
          })

          //* * be sure the new ID generate won't overwrite another room */
          let rnIdRoom
          if (id) {
            rnIdRoom = id
          } else {
            rnIdRoom = this.getRandomNumberNotInArray(roomList)
            //* * update url in case user refresh, can keep playing */
            window.location.href = window.location.href + '?id=' + rnIdRoom
          }
          this.roomId = rnIdRoom
          const me = {
            nickname: identities[0],
            roomId: rnIdRoom,
            uid: this.uid,
            master: true,
            online: true
          }
          roomsCollection.doc('room' + +rnIdRoom).set({
            status: IS_FIRESTORE_ROOM_WAITING,
            roomId: Number(rnIdRoom),
            activeIterQuestion: 0,
            usersObj: {
              [this.uid]: me
            }
          })
          this.me = me

          //* * let's stop this listener */
          unsubscribe()
          //* * all done. resolve the promise */
          resolve()
        })
    })
  }

  setupConnection () {
    // FIREBASE INIT
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig)
    }
    this.db = firebase.firestore()
    this.dbRT = firebase.database()
  }
}
export default Firebase
