import React, { Component } from 'react'

import Activity from './components/activity/activity'

import {
  getUrlVars
} from './utils/utils'

import 'firebase/firestore'
import './app.scss'

class App extends Component {
  state = {
    expStatus: 'loading',
    feedbackOpen: false,
    solo: false,
    urlId: -1
  }

  componentDidMount () {
    this.onLoaderDone()
  }

  onLoaderDone = () => {
    const v = getUrlVars()
    if (v.id) {
      console.log('V ID', v.id)
      // we have an ID
      this.setState({
        urlId: v.id,
        expStatus: 'activity'
      })
    } else {
      // no ID
      this.setState({
        expStatus: 'activity'
      })
    }
  }

  render () {
    const {
      expStatus,
      urlId
    } = this.state
    return (
      <div className='experience-app quiz-app'>
        {(expStatus === 'activity') &&
          <Activity
            urlId={urlId}
            solo={false}
          />}
      </div>
    )
  }
}
export default App
