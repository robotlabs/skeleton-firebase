
import React, { Component } from 'react'
import './activity.scss'
import FirebaseManager, {
  IS_ERROR
}
  from './../../firebase/firebase'

class Activity extends Component {
  state = {
    usersObj: {},
    me: null,
    myColor: null
  }

  componentDidMount () {
    this.startChallenge()
  }

  async startChallenge () {
    const { urlId } = this.props
    this.firebaseManager = new FirebaseManager()
    try {
      const uid = await this.firebaseManager.init({
        onGameWaiting: this.onGameWaiting
      })
      if (urlId === -1) {
        await this.createRoom()
      } else {
        const roomData = await this.firebaseManager.getRoomData(urlId)
        if (!roomData) {
          //* * room doesn't exist anymore. create it */
          await this.createRoom(urlId)
        } else {
          //* * join the room */
          const userObj = await this.firebaseManager.slaveJoinRoom(urlId)
          if (userObj.roomError) {
            await this.createRoom()
          }
        }
      }
      this.firebaseManager.activeListeners()
    } catch (e) {
      if (IS_ERROR === '') {
        this.setState({
          activityStatus: IS_ERROR,
          error: e.message
        })
      }
    }
  }

  async createRoom (id = null) {
    await this.firebaseManager.masterAddRoom(id)
    this.firebaseManager.setupDisconnect()
  }

  onGameWaiting = (data, me) => {
    this.setState({
      me: me,
      usersObj: data.usersObj,
      myColor: me.nickname
    })
  }

  onFirebaseError () {
    console.warn('firebase error')
  }

  render () {
    const {
      usersObj, myColor

    } = this.state

    return (
      <div>
        <div style={{ backgroundColor: myColor }} className='box' />
        {Object.keys(usersObj).map((d, i) => {
          console.log('d ', usersObj[d])
          const myColor = usersObj[d].nickname
          return (
            <div key={i} style={{ backgroundColor: myColor }} className='box2' />
          )
        })}
      </div>
    )
  }
}
export default Activity
