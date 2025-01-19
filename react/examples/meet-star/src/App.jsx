import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Focus, Item, Entry, Exit, List, Head, Tail } from "react-focus";

function App() {
  const [count, setCount] = useState(0)
  const [shown, setS] = useState(false);
  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <Focus onEntry={() => setS(v => !v)} onExit={() => setS(false)}>
        <Entry><button>Open</button></Entry>
        {shown && <List>
          <div>
            <Head><button>1</button></Head>
            <button>2</button>
            <Exit><button>Close</button></Exit>
            <Tail><button>3</button></Tail>
          </div>
        </List>}
      </Focus>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
