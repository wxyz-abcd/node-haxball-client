import { useState, useCallback } from 'react';
import NameForm from './features/player-data/nameForm';
import App from './App';

function Root() {
  const [showNameForm, setShowNameForm] = useState(true);
  const showNameFormCb = useCallback(() => setShowNameForm(true), []);

  if (showNameForm) return <NameForm onNameSet={()=>setShowNameForm(false)} />

  return <App showNameForm={showNameFormCb} />
}

export default Root;