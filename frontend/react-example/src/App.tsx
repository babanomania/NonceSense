
import './App.css'
import { NonceCaptcha } from './NonceCaptcha'

function App() {

  return (
    <>
      <div className="card">
        <NonceCaptcha apiUrl="http://localhost:8000" onVerify={({ challenge, nonce }) => {
          console.log("Challenge:", challenge);
          console.log("Nonce:", nonce);
        }} />
      </div>
    </>
  )
}

export default App
