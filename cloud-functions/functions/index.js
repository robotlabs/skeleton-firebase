const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp()
const FieldValue = require('firebase-admin').firestore.FieldValue

const firestore = admin.firestore()
exports.onUserStatusChanged = functions.database.ref('/status/{uid}').onUpdate(
  async (change, context) => {
    const eventStatus = change.after.val()

    const statusSnapshot = await change.after.ref.once('value')
    const status = statusSnapshot.val()
    if (status.last_changed > eventStatus.last_changed) {
      return null
    }
    if (eventStatus.state === 'offline') {
      const updateUsers = {}
      updateUsers[`usersObj.${context.params.uid}.online`] = false
      firestore.doc('rooms/room' + eventStatus.id).update(updateUsers)

      await firestore.doc('rooms/room' + eventStatus.id).update(
        {
          [context.params.uid]: FieldValue.delete()
        }
      )
    }
    if (eventStatus.state === 'online') {
      const updateUsers = {}
      updateUsers[`usersObj.${context.params.uid}.online`] = true
      firestore.doc('rooms/room' + eventStatus.id).update(updateUsers)
    }
    // if (eventStatus.state === 'online') {
    //   window.clearTimeout(this.deleteId)
    // }

    const res = await updateUsersArray(eventStatus.id, context.params.uid, eventStatus.state)
    if (res.delete) {
      return firestore.doc('rooms/room' + eventStatus.id).delete()

      return new Promise((resolve, reject) => {
        this.deleteId = setTimeout(() => {
          // resolve(firestore.doc('rooms/room' + eventStatus.id).delete())
          const roomRef = firestore.doc('rooms/room' + eventStatus.id)
          roomRef.get()
            .then((doc) => {
              const usersObj = doc.data().usersObj
              let isOnline = false
              for (const uuid in usersObj) {
                if (usersObj[uuid].online) {
                  isOnline = true
                }
              }
              if (!isOnline) {
                resolve(firestore.doc('rooms/room' + eventStatus.id).delete())
              }
            })
        }, 4000)
      })

      // return firestore.doc('rooms/room' + eventStatus.id).delete()
    }
    // else {
    // return firestore.doc('rooms/room' + eventStatus.id).update({
    //   rnId: Math.floor(Math.random() * 44)
    // })
    // }
  })

const updateUsersArray = async (id, uid, state) => {
  return new Promise(resolve => {
    const roomRef = firestore.doc('rooms/room' + id)
    roomRef.get()
      .then((doc) => {
        const usersObj = doc.data().usersObj
        let counter = 0
        let uuidStore
        for (const uuid in usersObj) {
          const user = usersObj[uuid]
          uuidStore = uuid
          if (user.online) {
            counter++
          }
        }
        // if (counter === 1) {
        //   if (uuidStore === uid) {
        //     if (!state) {
        //       resolve({
        //         delete: true
        //       })
        //     }
        //   }
        // }
        if (counter === 0 || (counter === 1 && uuidStore === uid && state === 'offline')) {
          resolve({
            delete: true
          })
        } else {
          resolve({
            delete: false
          })
        }
      })
  })
}
