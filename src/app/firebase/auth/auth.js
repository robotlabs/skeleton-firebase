export const isAuth = (firebase) => {
  return new Promise((resolve, reject) => {
    firebase.auth().signInAnonymously().catch((error) => {
      reject(error)
    })
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        // User is signed in.
        var uid = user.uid
        // reject(new Error('Login error'))
        resolve(uid)
      } else {
        // reject(new Error('Login error'))
      }
    })
  })
}
