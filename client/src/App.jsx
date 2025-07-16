import { useEffect, useState } from 'react';

function App() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    fetch("http://localhost:3001/")  // Ensure port matches your server
      .then((res) => res.text())     // Use .text() since your backend sends plain text
      .then((data) => setMessage(data))
      .catch((err) => {
        console.error(err);
        setMessage("Failed to connect to backend");
      });
  }, []);

  return (
    <div className="p-6 font-sans">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">Qloo TasteBot</h1>
      <p className="text-lg">{message}</p>
    </div>
  );
}

export default App;
