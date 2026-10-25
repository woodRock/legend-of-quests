import { useEffect } from 'react'
import { useGame } from './store'
import { FileSelect } from './screens/FileSelect'
import { Game } from './screens/Game'
import { Login } from './screens/Login'
import { NameEntry } from './screens/NameEntry'
import { Title } from './screens/Title'
import { EventPlayer, GameOver, TransitionCover } from './ui/Overlays'

export default function App() {
  const { screen, user, go } = useGame()

  useEffect(() => useGame.getState().init(), [])

  // Signed out from another tab or device: back to the title.
  useEffect(() => {
    if (user === null && screen !== 'title' && screen !== 'login') go('title')
  }, [user, screen, go])

  return (
    <div className="screen">
      {screen === 'title' && <Title />}
      {screen === 'login' && <Login />}
      {screen === 'files' && <FileSelect />}
      {screen === 'name' && <NameEntry />}
      {screen === 'game' && <Game />}
      {screen === 'game' && <EventPlayer />}
      {screen === 'game' && <GameOver />}
      <TransitionCover />
    </div>
  )
}
