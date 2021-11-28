import "@babel/polyfill";

import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import styled, { keyframes, css } from 'styled-components'
import { DateTime } from 'luxon';
import axios from 'axios';
import Navigo from 'navigo';

import { useAuthChanged, MinimalAuth } from 'react-minimal-auth';

import { firebaseConfig, db, auth, logout } from './firebase';

import { Flex } from './styled';
import Admin from './admin';
import CalendarDisplay from './calendar_display';


const lightToDark = keyframes`
  from {
    color: black;
    background-color: white;
  }
  to {
    color: #888;
    background-color: black;
  }
`

const darkToLight = keyframes`
  from {
    color: #888;
    background-color: black;
  }
  to {
    color: black;
    background-color: white;
  }
`

const DateBlock = styled(Flex)`
  font-family: 'Castoro', serif;
`

const Time = styled(DateBlock)`
  font-size: 20vw;
`


const DateView = styled(DateBlock)`
  font-size: 7vw;
`

const Grey = styled.div`
  color: grey;
  font-size: 5vw;
  font-family: 'Roboto', sans-serif;
  margin-right: 4vw;
  margin-left: 4vw;
`

const colourModeMixin = props => css`
  ${props.light ? darkToLight : lightToDark} 5s linear forwards;
`

const Content = styled(Flex)`
  height: 100%;
  animation: ${colourModeMixin};
  justify-content: flex-start;
  overflow: hidden;
`

const Opacity = styled.div`
  opacity: ${props => props.show ? 1 : 0.1};
`

const WeatherIcon = styled.div`
  width: 12.5vw;
  height: 12.5vw;
  background-image: ${props => `url(https://openweathermap.org/img/wn/${props.icon}@4x.png)`};
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
`

const WeatherItem = styled.div`
  width: 12.5vw;
  height: 22vw;
  position: relative;
`

const WeatherItemTime = styled.div`
  position: absolute;
  top: 0;
  left: 2vw;
  padding: 8px;
`

const WeatherItemTemp = styled.div`
  font-family: 'Castoro', serif;
  font-size: 3vw;
  text-align: center;
`

const City = styled(Flex)`
  padding: 2vw;
`

const CityName = styled.div`
  font-family: 'Castoro', serif;
  font-size: 3vw;
`
const SunTime = styled.div``

var router = new Navigo(null, true, '#');

const uiConfig = {
  signInFlow: 'popup',
  signInOptions: [
    auth.GoogleAuthProvider.PROVIDER_ID
  ],
  callbacks: {
    // Avoid redirects after sign-in.
    signInSuccessWithAuthResult: () => false
  }
};


const WeatherSlot = ({ data }) => {
  const { weather, dt, main } = data;
  const { temp } = main;
  const [{ icon }, ...rest] = weather;
  const time = DateTime.fromSeconds(dt);
  return <WeatherItem>
    <WeatherItemTime>
      {time.toFormat("ha").toLowerCase()}
    </WeatherItemTime>
    <WeatherIcon icon={icon} />
    <WeatherItemTemp>
      {Math.round(temp)}°C
    </WeatherItemTemp>
  </WeatherItem>
}

const WeatherData = ({ weatherData }) => {
  const { list, city } = weatherData;
  const { name, sunrise, sunset } = city;

  const short = list.slice(0, 16);

  const render = date => DateTime.fromSeconds(date).toFormat("h:mma").toLowerCase();

  return <>
    <City justify="space-between">
      <CityName>{city.name}</CityName>
      <Flex>
        <SunTime>Sunrise: {render(sunrise)}</SunTime>
        &nbsp;-&nbsp;
        <SunTime>Sunset: {render(sunset)}</SunTime>
      </Flex>
    </City>
    <Flex flexWrap="wrap">
      {short.map((slot, index) => (
        <WeatherSlot key={index} data={slot} />
      ))}
    </Flex>
  </>
}

const weatherAPI = token => `https://api.openweathermap.org/data/2.5/forecast?units=metric&q=Melbourne,au&APPID=${token}`;
const WeatherDisplay = ({ owmKey, updateLightRange }) => {
  const [weatherData, setWeatherData] = useState(null);

  const getWeather = useCallback(() => {
    if (!owmKey) return;

    axios.get(weatherAPI(owmKey))
      .then(response => setWeatherData(response.data));
  });

  useEffect(() => {
    const { city: { sunrise, sunset } = {} } = weatherData || {};

    if (sunrise && sunset ) {
      updateLightRange(
        DateTime.fromSeconds(sunrise),
        DateTime.fromSeconds(sunset)
      )
    }
  }, [weatherData]);

  useEffect(() => {
    const intId = setInterval(getWeather, 60 * 60 * 1000);
    getWeather();

    return () => clearInterval(intId);
  }, [owmKey]);

  return weatherData ? <WeatherData weatherData={weatherData} /> : null;
}


const Display = ({ firebaseData = {}, showAdmin }) => {
  const [currentTime, setCurrentTime] = useState(DateTime.local());
  useEffect(() => {
    const intId = setInterval(() => setCurrentTime(DateTime.local()), 1000);
    return () => clearInterval(intId);
  }, []);

  const [sunrise, setSunrise] = useState(DateTime.fromObject({hour: 6}));
  const [sunset, setSunset] = useState(DateTime.fromObject({hour: 18}));

  const updateLightRange = useCallback((sunrise, sunset) => {
    setSunrise(sunrise);
    setSunset(sunset);
  });

  //console.log(sunrise.toString(), sunset.toString());
  // console.log({firebaseData});

  const time = currentTime.toFormat("h:mm");
  const seconds = currentTime.toFormat("ss");
  const ampm = currentTime.toFormat("a").toLowerCase();
  const day = currentTime.toFormat("cccc");
  const date = currentTime.toLocaleString(DateTime.DATE_SHORT);

  const lightTime = currentTime > sunrise && currentTime < sunset;

  const { owmKey, calendarUser } = firebaseData;

  return <Content column light={lightTime} align="stretch" onClick={showAdmin}>
    <Opacity show={lightTime}>
      <Flex justify="center" row>
        <Time>{time}</Time>
        <Flex column justify="space-evenly">
          <Grey>
            <Flex>{seconds}</Flex>
            <Flex>{ampm}</Flex>
          </Grey>
        </Flex>
        <DateView column>
          <Flex>{day}</Flex>
          <Flex>{date}</Flex>
        </DateView>
      </Flex>

      {owmKey && <WeatherDisplay owmKey={owmKey}  updateLightRange={updateLightRange} />}
      {calendarUser && <CalendarDisplay calendarUser={calendarUser} />}
    </Opacity>
  </Content>
}

const App = () => {
  const [showAdmin, setShowAdmin] = useState(false);
  const [firebaseKey, setFirebaseKey] = useState(null);
  const [firebaseData, setFirebaseData] = useState(undefined);

  useEffect(() => {
    router
      .on('/for/:key', function ({ key }) {
        setFirebaseKey(key);
      })
      .resolve();
  }, []);

  useEffect(() => {
    if (firebaseKey) {
      db.doc(`deployments/${firebaseKey}`)
        .get()
        .then(doc => setFirebaseData(doc.data()))
        .catch(err => ({}))
    }
  }, [firebaseKey]);

  useAuthChanged(auth, async function (newUser) {
    if (newUser) {
      const { displayName, email } = newUser;

      const userRec = await db.collection('users').doc(newUser.uid).get();
      if (!userRec.exists) {
        await db.collection('users').doc(newUser.uid).set({});
      }

      db.collection('users').doc(newUser.uid).update({ displayName, email });
    }
  })
  return <>
    { showAdmin && <Admin onClose={() => setShowAdmin(false)} />}
    <Display firebaseData={firebaseData} showAdmin={() => setShowAdmin(true)} />
  </>;
}

ReactDOM.render(<MinimalAuth uiConfig={uiConfig} auth={auth}><App /></MinimalAuth>, document.getElementById('app'));
