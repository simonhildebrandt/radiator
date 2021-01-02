import React, { useState, useEffect } from 'react';
import styled from 'styled-components'

import axios from 'axios';

import { useFirebaseAuthState, LoginForm } from 'react-minimal-auth';

import { db, useFirestoreCollection} from './firebase';


const Layout = styled.div`
  position: absolute;
  left: 64px;
  right: 64px;
  top: 64px;
  bottom: 64px;
  background-color: white;
  box-shadow: 8px 8px 8px lightgrey;
  padding: 8px;
  font-family: sans-serif;
  overflow: auto;
  z-index: 1;
`
const Deployment = styled.div`
  border-left: 3px solid blue;
  padding-left: 8px;
`

export default function({onClose}) {
  const { user, loginState } = useFirebaseAuthState();

  return <Layout>
    <h1>Admin</h1>
    { loginState === 'logged_in' ? <Controls user={user} onClose={onClose}/> : ( loginState === 'logged_out' ? <LoginForm/> : 'loading' ) }
  </Layout>;
}


function suffixed(str) {
  //const num = Math.floor(Math.random() * 8999) + 1000;
  const num = Math.floor(Math.random() * 8) + 1;
  return `${str}-${num}`;
}

const nameTextFor = str => str.split('-')[0];
const numberTextFor = str => str.split('-')[1];
const urlFor = str => `/#/for/${str}`;

const Controls = ({user, onClose}) => {
  const deployments = useFirestoreCollection(`deployments`, {where: ['creatorId', '==', user.uid]});
  const [nameCache, setNameCache] = useState({});

  const addDeployment = async () => {
    createDeployment('deployment');
  }

  const createDeployment = async (name, data = {}) => {
    while(true) {
      const key = suffixed(name);
      const ref = db.collection(`deployments`).doc(key);

      if (Object.keys(deployments).includes(key)) {
        console.log('local collision', key)
        continue;
      }

      try {
        console.log('creating', key)
        await ref.set({
          createdAt: new Date().valueOf(),
          creatorId: user.uid,
           ...data
        });
        console.log('created', key)

        break;
      } catch(exp) {
        console.log('server collision', key, exp);
      }
    }
  }

  async function updateName(id) {
    const name = nameCache[id];
    const data = deployments[id];
    await db.collection(`deployments`).doc(id).delete();
    await createDeployment(name, data);
  }

  function setKey(id, data) {
    db.doc(`/deployments/${id}`).update(data);
  }

  function deleteDeployment(id) {
    db.doc(`/deployments/${id}`).delete();
  }

  function editing(id) {
    return nameCache[id] !== undefined;
  }

  function edit(id) {
    setNameCache({...nameCache, [id]: nameTextFor(id)});
  }

  function updateCachedName(id, text) {
    setNameCache({...nameCache, [id]: text.replace('-', '')});
  }

  const [calendarTokenLink, setCalendarTokenLink] = useState(null);
  useEffect(() => {
    const oauthAction = encodeURIComponent(JSON.stringify({ redirect: "http://localhost:9000/", userId: user.uid }));
    axios.get(`https://us-central1-radiator-c38a6.cloudfunctions.net/oauthUrl?action=${oauthAction}`)
    .then(res => setCalendarTokenLink(res.data));
  }, []);

  return <>
    <button type="submit" onClick={addDeployment}>Add deployment</button>
    <button type="submit" onClick={onClose}>Close</button>
    { calendarTokenLink && <a href={calendarTokenLink}>Add calendar token</a> }

    { Object.entries(deployments).map(([id, deployment]) => 
      <Deployment key={id}>
        <h4>
          { editing(id) ? (
            <>
              <input 
                type="text" 
                onChange={e => updateCachedName(id, e.target.value)} 
                placeholder="name" 
                value={nameCache[id]}/>-{numberTextFor(id)} />
              <button type="submit" onClick={() => updateName(id)}>Update name</button>
            </>
          ) : (
            <>
              <a href={urlFor(id)}>{urlFor(id)}</a>
              <button onClick={() => edit(id)}>Edit</button>
            </>
          ) }
        </h4>
        <input type="text" value={deployment.owmKey || ''} onChange={e => setKey(id, {owmKey: e.target.value})} placeholder="OpenWeatherMap Key"/><br/>
        <button type="submit" onClick={e => deleteDeployment(id)}>Delete</button>
      </Deployment>
    ) }
  </>
}
